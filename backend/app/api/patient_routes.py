"""
Patient dashboard routes: appointments, prescriptions, records, medications, notifications.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status

from app.core.security import get_current_user, require_patient
from app.models.schemas import (
    AppointmentCreateRequest,
    DoctorSearchRequest,
    MedicalRecordCreateRequest,
    MedicationLogRequest,
    MedicationTrackerRequest,
    MessageResponse,
    PatientDashboardResponse,
    DashboardMetrics,
    OrderCreateRequest,
    PaymentIntentRequest,
)
from app.services.data_service import (
    appointment_service,
    medical_record_service,
    medication_service,
    prescription_service,
    user_service,
    ai_record_service,
    order_service,
    inventory_service,
)
from app.services.notification_service import notification_service
from app.services.file_service import file_service
from app.services.llm_service import llm_service

patient_router = APIRouter()


@patient_router.get("/dashboard", response_model=dict)
def patient_dashboard(user: dict = Depends(get_current_user)):
    uid = user["sub"]
    
    appointments = appointment_service.list_for_patient(uid, limit=10)
    upcoming = [a for a in appointments if a.get("status") in ("pending", "confirmed")]
    
    prescriptions = prescription_service.list_for_patient(uid, limit=5)
    medications = medication_service.list_active(uid)
    records = medical_record_service.list_for_patient(uid, limit=5)
    notifications = notification_service.get_for_user(uid, limit=10)
    
    status_counts = appointment_service.count_by_status("patient_id", uid)
    
    metrics = {
        "total_appointments": sum(status_counts.values()),
        "pending_appointments": status_counts.get("pending", 0),
        "completed_appointments": status_counts.get("completed", 0),
        "total_prescriptions": len(prescriptions),
        "active_medications": len(medications),
        "unread_notifications": notification_service.count_unread(uid),
        "medical_records": medical_record_service.col.count_documents({"patient_id": uid}),
    }

    # AI health summary
    ai_summary = "Your health dashboard is ready. Stay on track with your medications."
    ai_recommendations = [
        "Take your medications on time for better adherence.",
        "Schedule your next appointment if due.",
        "Upload your latest lab reports for AI analysis.",
    ]

    if llm_service.enabled and (appointments or medications or records):
        context = (
            f"Patient has {metrics['total_appointments']} appointments, "
            f"{len(medications)} active medications, "
            f"{len(records)} medical records. "
            f"Recent appointment reasons: {[a.get('reason','') for a in upcoming[:3]]}. "
            f"Active medications: {[m.get('medicine_name','') for m in medications[:5]]}."
        )
        try:
            result = llm_service.invoke_json(
                "You are a personal health AI assistant. Generate a brief, encouraging, personalized health summary.",
                f"Patient data: {context}\n\nReturn JSON: {{\"summary\": \"...\", \"recommendations\": [\"...\", \"...\", \"...\"]}}",
                {"summary": ai_summary, "recommendations": ai_recommendations},
            )
            ai_summary = result.get("summary", ai_summary)
            ai_recommendations = result.get("recommendations", ai_recommendations)
        except Exception:
            pass

    return {
        "metrics": metrics,
        "upcoming_appointments": upcoming[:5],
        "active_medications": medications,
        "recent_records": records,
        "recent_prescriptions": prescriptions,
        "notifications": notifications[:5],
        "ai_health_summary": ai_summary,
        "ai_recommendations": ai_recommendations,
    }


@patient_router.get("/appointments")
def list_appointments(status: str | None = None, user: dict = Depends(get_current_user)):
    return appointment_service.list_for_patient(user["sub"], status=status)


@patient_router.post("/appointments", status_code=201)
def book_appointment(payload: AppointmentCreateRequest, user: dict = Depends(get_current_user)):
    data = payload.model_dump()
    data["patient_id"] = user["sub"]
    
    # Verify doctor exists
    doctor = user_service.get_by_id(data["doctor_id"])
    if not doctor or doctor.get("role") != "doctor":
        raise HTTPException(status_code=404, detail="Doctor not found.")
    
    appt = appointment_service.create(data)
    
    # Notify doctor
    notification_service.create(
        recipient_id=data["doctor_id"],
        notif_type="new_appointment",
        title="New Appointment Request",
        message=f"A patient has requested an appointment on {payload.scheduled_at.strftime('%Y-%m-%d %H:%M')}.",
        data={"appointment_id": appt["id"]},
    )
    return appt


@patient_router.get("/appointments/{appointment_id}")
def get_appointment(appointment_id: str, user: dict = Depends(get_current_user)):
    appt = appointment_service.get(appointment_id)
    if not appt or appt["patient_id"] != user["sub"]:
        raise HTTPException(status_code=404, detail="Appointment not found.")
    return appt


@patient_router.delete("/appointments/{appointment_id}", response_model=MessageResponse)
def cancel_appointment(appointment_id: str, user: dict = Depends(get_current_user)):
    appt = appointment_service.get(appointment_id)
    if not appt or appt["patient_id"] != user["sub"]:
        raise HTTPException(status_code=404, detail="Appointment not found.")
    appointment_service.update(appointment_id, {"status": "cancelled"})
    return MessageResponse(message="Appointment cancelled.")


@patient_router.get("/prescriptions")
def list_prescriptions(user: dict = Depends(get_current_user)):
    return prescription_service.list_for_patient(user["sub"])


@patient_router.get("/prescriptions/{prescription_id}")
def get_prescription(prescription_id: str, user: dict = Depends(get_current_user)):
    rx = prescription_service.get(prescription_id)
    if not rx or rx["patient_id"] != user["sub"]:
        raise HTTPException(status_code=404, detail="Prescription not found.")
    return rx


@patient_router.get("/records")
def list_records(record_type: str | None = None, user: dict = Depends(get_current_user)):
    return medical_record_service.list_for_patient(user["sub"], record_type=record_type)


@patient_router.post("/records", status_code=201)
async def upload_record(
    title: str = Form(...),
    record_type: str = Form("lab_report"),
    content: str = Form(""),
    file: UploadFile | None = File(None),
    user: dict = Depends(get_current_user),
):
    file_url = None
    extracted_text = content

    if file:
        file_bytes = await file.read()
        if not file_service.validate_file_size(file_bytes):
            raise HTTPException(status_code=413, detail="File too large.")
        
        file_url, text_from_file, _ = file_service.process_report_file(file_bytes, file.filename)
        if text_from_file:
            extracted_text = text_from_file

    record = medical_record_service.create({
        "patient_id": user["sub"],
        "record_type": record_type,
        "title": title,
        "content": extracted_text,
        "file_url": file_url,
    })
    return record


@patient_router.get("/medications")
def list_medications(user: dict = Depends(get_current_user)):
    return medication_service.list_all(user["sub"])


@patient_router.post("/medications", status_code=201)
def add_medication(payload: MedicationTrackerRequest, user: dict = Depends(get_current_user)):
    return medication_service.create(user["sub"], payload.model_dump())


@patient_router.post("/medications/log", status_code=201)
def log_medication(payload: MedicationLogRequest, user: dict = Depends(get_current_user)):
    return medication_service.log_dose(
        payload.medication_id, user["sub"], payload.status, payload.taken_at
    )


@patient_router.get("/notifications")
def get_notifications(unread_only: bool = False, user: dict = Depends(get_current_user)):
    return notification_service.get_for_user(user["sub"], unread_only=unread_only)


@patient_router.patch("/notifications/{notif_id}/read", response_model=MessageResponse)
def mark_notification_read(notif_id: str, user: dict = Depends(get_current_user)):
    ok = notification_service.mark_read(notif_id, user["sub"])
    if not ok:
        raise HTTPException(status_code=404, detail="Notification not found.")
    return MessageResponse(message="Marked as read.")


@patient_router.post("/notifications/read-all", response_model=MessageResponse)
def mark_all_read(user: dict = Depends(get_current_user)):
    count = notification_service.mark_all_read(user["sub"])
    return MessageResponse(message=f"Marked {count} notifications as read.")


@patient_router.get("/doctors")
def search_doctors(specialty: str | None = None, name: str | None = None):
    filters = {}
    if specialty:
        filters["profile.specialty"] = {"$regex": specialty, "$options": "i"}
    if name:
        filters["name"] = {"$regex": name, "$options": "i"}
    doctors = user_service.list_by_role("doctor", filters)
    return [user_service.safe_user(d) for d in doctors]


# ─── Pharmacy & Orders ────────────────────────────────────────────────────────

@patient_router.post("/match-pharmacies")
def match_pharmacies_for_prescription(medicines: list[dict], user: dict = Depends(get_current_user)):
    """
    Match pharmacies that can fulfill a prescription.
    Input: list of {name, dosage, quantity}
    Output: list of pharmacies with availability and pricing
    """
    pharmacies = user_service.list_by_role("pharmacy", limit=100)
    matches = []
    
    for pharmacy in pharmacies:
        pharmacy_inventory = inventory_service.list_all(pharmacy["id"])
        available_medicines = []
        total_price = 0.0
        available_count = 0
        
        for med in medicines:
            med_name = med.get("name", "").lower()
            quantity = med.get("quantity", 1)
            
            # Find matching medicine in inventory
            inventory_item = None
            for item in pharmacy_inventory:
                if med_name in item.get("medicine_name", "").lower():
                    inventory_item = item
                    break
            
            if inventory_item and inventory_item.get("quantity", 0) >= quantity:
                price = inventory_item.get("price_per_unit", 0) * quantity
                available_medicines.append({
                    "name": med.get("name"),
                    "available": True,
                    "price": price,
                    "price_per_unit": inventory_item.get("price_per_unit", 0),
                    "inventory_id": inventory_item["id"],
                    "quantity": quantity,
                })
                total_price += price
                available_count += 1
            else:
                available_medicines.append({
                    "name": med.get("name"),
                    "available": False,
                    "price": 0,
                    "quantity": quantity,
                })
        
        availability_percentage = (available_count / len(medicines) * 100) if medicines else 0
        
        matches.append({
            "pharmacy_id": pharmacy["id"],
            "pharmacy_name": pharmacy.get("name", "Unknown Pharmacy"),
            "pharmacy_email": pharmacy.get("email", ""),
            "pharmacy_phone": pharmacy.get("phone", ""),
            "available_medicines": available_medicines,
            "total_price": round(total_price, 2),
            "availability_percentage": round(availability_percentage, 1),
        })
    
    # Sort by availability percentage (highest first)
    matches.sort(key=lambda x: x["availability_percentage"], reverse=True)
    return matches


@patient_router.post("/orders", status_code=201)
def create_order(payload: OrderCreateRequest, user: dict = Depends(get_current_user)):
    """Create a new pharmacy order."""
    data = payload.model_dump()
    data["patient_id"] = user["sub"]
    
    order = order_service.create(data)
    
    # Notify pharmacy
    notification_service.create(
        recipient_id=payload.pharmacy_id,
        notif_type="new_order",
        title="New Order Received",
        message=f"New order #{order['id'][:8]} with {len(payload.medicines)} medicine(s). Total: ${order['total']}",
        data={"order_id": order["id"]},
    )
    
    return order


@patient_router.get("/orders")
def list_orders(user: dict = Depends(get_current_user)):
    """List all orders for the current patient."""
    return order_service.list_for_patient(user["sub"])


@patient_router.get("/orders/{order_id}")
def get_order(order_id: str, user: dict = Depends(get_current_user)):
    """Get a specific order."""
    order = order_service.get(order_id)
    if not order or order["patient_id"] != user["sub"]:
        raise HTTPException(status_code=404, detail="Order not found.")
    return order


@patient_router.post("/orders/{order_id}/payment-intent")
def create_payment_intent(order_id: str, user: dict = Depends(get_current_user)):
    """Create a Stripe payment intent for an order."""
    from app.core.config import settings
    
    if not settings.stripe_secret_key:
        raise HTTPException(status_code=503, detail="Payment processing not configured.")
    
    order = order_service.get(order_id)
    if not order or order["patient_id"] != user["sub"]:
        raise HTTPException(status_code=404, detail="Order not found.")
    
    if order.get("payment_status") == "paid":
        raise HTTPException(status_code=400, detail="Order already paid.")
    
    try:
        import stripe
        stripe.api_key = settings.stripe_secret_key
        
        # Create payment intent
        intent = stripe.PaymentIntent.create(
            amount=int(order["total"] * 100),  # Convert to cents
            currency="usd",
            metadata={
                "order_id": order_id,
                "patient_id": user["sub"],
            },
        )
        
        # Update order with payment intent ID
        order_service.update(order_id, {"payment_intent_id": intent.id})
        
        return {
            "client_secret": intent.client_secret,
            "publishable_key": settings.stripe_publishable_key,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Payment intent creation failed: {str(e)}")


@patient_router.post("/orders/{order_id}/confirm-payment")
def confirm_payment(order_id: str, user: dict = Depends(get_current_user)):
    """Confirm payment completion for an order."""
    order = order_service.get(order_id)
    if not order or order["patient_id"] != user["sub"]:
        raise HTTPException(status_code=404, detail="Order not found.")
    
    # Update order status
    order_service.update(order_id, {
        "payment_status": "paid",
        "status": "confirmed",
    })
    
    # Notify pharmacy
    notification_service.create(
        recipient_id=order["pharmacy_id"],
        notif_type="order_paid",
        title="Order Payment Confirmed",
        message=f"Payment confirmed for order #{order_id[:8]}. Total: ${order['total']}",
        data={"order_id": order_id},
    )
    
    return MessageResponse(message="Payment confirmed successfully.")


@patient_router.get("/doctors")
def search_doctors(specialty: str | None = None, name: str | None = None):
    filters = {}
    if specialty:
        filters["profile.specialty"] = {"$regex": specialty, "$options": "i"}
    doctors = user_service.list_by_role("doctor", filters)
    return [user_service.safe_user(d) for d in doctors]


# ─── AI History & Records ─────────────────────────────────────────────────────

@patient_router.get("/ai/prescription-schedules")
def get_prescription_schedules(limit: int = 20, user: dict = Depends(get_current_user)):
    """Get all prescription schedules for the current user."""
    return ai_record_service.get_user_prescription_schedules(user["sub"], limit=limit)


@patient_router.get("/ai/prescription-schedules/{record_id}")
def get_prescription_schedule(record_id: str, user: dict = Depends(get_current_user)):
    """Get a specific prescription schedule."""
    schedules = ai_record_service.get_user_prescription_schedules(user["sub"], limit=100)
    schedule = next((s for s in schedules if s["id"] == record_id), None)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found.")
    return schedule


@patient_router.get("/ai/report-analyses")
def get_report_analyses(limit: int = 20, user: dict = Depends(get_current_user)):
    """Get all report analyses for the current user."""
    from app.services.data_service import ai_record_service
    docs = list(ai_record_service.report_col.find({"user_id": user["sub"]}).sort("created_at", -1).limit(limit))
    from app.db.mongo import serialize_docs
    return serialize_docs(docs)


@patient_router.get("/ai/report-analyses/{record_id}")
def get_report_analysis(record_id: str, user: dict = Depends(get_current_user)):
    """Get a specific report analysis."""
    from app.db.mongo import to_object_id, serialize_doc
    oid = to_object_id(record_id)
    if not oid:
        raise HTTPException(status_code=404, detail="Invalid record ID.")
    doc = ai_record_service.report_col.find_one({"_id": oid, "user_id": user["sub"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Report analysis not found.")
    return serialize_doc(doc)


@patient_router.get("/ai/symptom-checks")
def get_symptom_checks(limit: int = 20, user: dict = Depends(get_current_user)):
    """Get all symptom checks for the current user."""
    return ai_record_service.get_user_symptom_history(user["sub"], limit=limit)


@patient_router.get("/ai/medication-logs")
def get_medication_logs(limit: int = 50, user: dict = Depends(get_current_user)):
    """Get medication adherence logs."""
    from app.db.mongo import serialize_docs
    docs = list(ai_record_service.medication_logs_col.find({"user_id": user["sub"]}).sort("logged_at", -1).limit(limit))
    return serialize_docs(docs)


@patient_router.delete("/ai/prescription-schedules/{record_id}")
def delete_prescription_schedule(record_id: str, user: dict = Depends(get_current_user)):
    """Delete a prescription schedule."""
    from app.db.mongo import to_object_id
    oid = to_object_id(record_id)
    if not oid:
        raise HTTPException(status_code=404, detail="Invalid record ID.")
    result = ai_record_service.schedule_col.delete_one({"_id": oid, "user_id": user["sub"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Schedule not found.")
    return MessageResponse(message="Schedule deleted successfully.")


@patient_router.delete("/ai/report-analyses/{record_id}")
def delete_report_analysis(record_id: str, user: dict = Depends(get_current_user)):
    """Delete a report analysis."""
    from app.db.mongo import to_object_id
    oid = to_object_id(record_id)
    if not oid:
        raise HTTPException(status_code=404, detail="Invalid record ID.")
    result = ai_record_service.report_col.delete_one({"_id": oid, "user_id": user["sub"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Report analysis not found.")
    return MessageResponse(message="Report analysis deleted successfully.")
