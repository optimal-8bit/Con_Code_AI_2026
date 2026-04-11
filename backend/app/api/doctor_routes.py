"""
Doctor dashboard routes: appointments management, prescriptions, patients.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_user
from app.models.schemas import (
    AppointmentUpdateRequest,
    MessageResponse,
    PrescriptionCreateRequest,
)
from app.services.data_service import (
    appointment_service,
    medical_record_service,
    prescription_service,
    user_service,
    ai_record_service,
)
from app.services.notification_service import notification_service
from app.services.llm_service import llm_service

doctor_router = APIRouter()


@doctor_router.get("/dashboard")
def doctor_dashboard(user: dict = Depends(get_current_user)):
    if user.get("role") != "doctor":
        raise HTTPException(status_code=403, detail="Doctor access required.")
    
    uid = user["sub"]
    
    todays = appointment_service.todays_for_doctor(uid)
    all_appts = appointment_service.list_for_doctor(uid, limit=20)
    pending = [a for a in all_appts if a.get("status") == "pending"]
    recent_rx = prescription_service.list_for_doctor(uid, limit=10)
    notifications = notification_service.get_for_user(uid, limit=10)
    
    status_counts = appointment_service.count_by_status("doctor_id", uid)
    
    # Recent unique patients
    patient_ids = list({a["patient_id"] for a in all_appts[:20]})[:5]
    recent_patients = []
    for pid in patient_ids:
        p = user_service.get_by_id(pid)
        if p:
            recent_patients.append(user_service.safe_user(p))

    metrics = {
        "total_appointments": sum(status_counts.values()),
        "pending_appointments": status_counts.get("pending", 0),
        "todays_appointments": len(todays),
        "completed_appointments": status_counts.get("completed", 0),
        "total_prescriptions": len(recent_rx),
        "unread_notifications": notification_service.count_unread(uid),
    }

    ai_summary = "You have a busy schedule today. Review pending appointments."
    ai_recommendations = [
        "Review pending appointment requests promptly.",
        "Follow up with patients on long-standing cases.",
        "Issue digital prescriptions for treated patients.",
    ]

    if llm_service.enabled:
        context = (
            f"Doctor has {len(todays)} appointments today, {len(pending)} pending. "
            f"Issued {len(recent_rx)} prescriptions recently."
        )
        try:
            result = llm_service.invoke_json(
                "You are an AI assistant for doctors. Provide a professional workload summary.",
                f"Data: {context}\n\nReturn JSON: {{\"summary\": \"...\", \"recommendations\": [\"...\"]}}",
                {"summary": ai_summary, "recommendations": ai_recommendations},
            )
            ai_summary = result.get("summary", ai_summary)
            ai_recommendations = result.get("recommendations", ai_recommendations)
        except Exception:
            pass

    return {
        "metrics": metrics,
        "todays_appointments": todays,
        "pending_appointments": pending[:5],
        "recent_patients": recent_patients,
        "recent_prescriptions": recent_rx[:5],
        "notifications": notifications[:5],
        "ai_workload_summary": ai_summary,
        "ai_recommendations": ai_recommendations,
    }


@doctor_router.get("/appointments")
def list_appointments(status: str | None = None, user: dict = Depends(get_current_user)):
    if user.get("role") not in ("doctor", "admin"):
        raise HTTPException(status_code=403, detail="Doctor access required.")
    return appointment_service.list_for_doctor(user["sub"], status=status)


@doctor_router.patch("/appointments/{appointment_id}")
def update_appointment(
    appointment_id: str,
    payload: AppointmentUpdateRequest,
    user: dict = Depends(get_current_user),
):
    if user.get("role") != "doctor":
        raise HTTPException(status_code=403, detail="Doctor access required.")
    
    appt = appointment_service.get(appointment_id)
    if not appt or appt["doctor_id"] != user["sub"]:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    updated = appointment_service.update(appointment_id, updates)

    # Notify patient on status changes
    if payload.status:
        status_messages = {
            "confirmed": "Your appointment has been confirmed.",
            "cancelled": "Your appointment has been cancelled by the doctor.",
            "completed": "Your appointment visit is marked complete.",
        }
        msg = status_messages.get(payload.status)
        if msg:
            notification_service.create(
                recipient_id=appt["patient_id"],
                notif_type="appointment_update",
                title=f"Appointment {payload.status.capitalize()}",
                message=msg,
                data={"appointment_id": appointment_id},
            )
    return updated


@doctor_router.get("/patients/{patient_id}")
def get_patient(patient_id: str, user: dict = Depends(get_current_user)):
    if user.get("role") != "doctor":
        raise HTTPException(status_code=403, detail="Doctor access required.")
    
    patient = user_service.get_by_id(patient_id)
    if not patient or patient.get("role") != "patient":
        raise HTTPException(status_code=404, detail="Patient not found.")
    
    records = medical_record_service.list_for_patient(patient_id, limit=10)
    prescriptions = prescription_service.list_for_patient(patient_id, limit=10)
    appointments = appointment_service.list_for_patient(patient_id, limit=10)
    
    return {
        "patient": user_service.safe_user(patient),
        "medical_records": records,
        "prescriptions": prescriptions,
        "appointments": appointments,
    }


@doctor_router.post("/prescriptions", status_code=201)
def issue_prescription(payload: PrescriptionCreateRequest, user: dict = Depends(get_current_user)):
    if user.get("role") != "doctor":
        raise HTTPException(status_code=403, detail="Doctor access required.")
    
    data = payload.model_dump()
    data["doctor_id"] = user["sub"]
    
    # Verify patient exists
    patient = user_service.get_by_id(data["patient_id"])
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")

    rx = prescription_service.create(data)

    # Notify patient
    notification_service.create(
        recipient_id=data["patient_id"],
        notif_type="new_prescription",
        title="New Prescription Issued",
        message=f"Dr. {user.get('email', 'Your doctor')} has issued a new prescription with {len(data['medicines'])} medicine(s).",
        data={"prescription_id": rx["id"]},
    )
    return rx


@doctor_router.get("/prescriptions")
def list_prescriptions(user: dict = Depends(get_current_user)):
    if user.get("role") != "doctor":
        raise HTTPException(status_code=403, detail="Doctor access required.")
    return prescription_service.list_for_doctor(user["sub"])


@doctor_router.get("/patients")
def list_patients(user: dict = Depends(get_current_user)):
    """List all patients who have had appointments with this doctor."""
    if user.get("role") != "doctor":
        raise HTTPException(status_code=403, detail="Doctor access required.")
    
    appts = appointment_service.list_for_doctor(user["sub"], limit=200)
    patient_ids = list({a["patient_id"] for a in appts})
    
    patients = []
    for pid in patient_ids[:50]:
        p = user_service.get_by_id(pid)
        if p:
            patients.append(user_service.safe_user(p))
    return patients


@doctor_router.get("/notifications")
def get_notifications(user: dict = Depends(get_current_user)):
    if user.get("role") != "doctor":
        raise HTTPException(status_code=403, detail="Doctor access required.")
    return notification_service.get_for_user(user["sub"])


@doctor_router.patch("/notifications/{notif_id}/read", response_model=MessageResponse)
def mark_read(notif_id: str, user: dict = Depends(get_current_user)):
    notification_service.mark_read(notif_id, user["sub"])
    return MessageResponse(message="Marked as read.")
