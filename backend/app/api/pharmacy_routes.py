"""
Pharmacy dashboard routes: prescription fulfillment, inventory management.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user
from app.models.schemas import (
    InventoryItemRequest,
    MessageResponse,
    PrescriptionUpdateRequest,
)
from app.services.data_service import (
    inventory_service,
    prescription_service,
    user_service,
)
from app.services.notification_service import notification_service
from app.services.llm_service import llm_service

pharmacy_router = APIRouter()


@pharmacy_router.get("/dashboard")
def pharmacy_dashboard(user: dict = Depends(get_current_user)):
    if user.get("role") not in ("pharmacy", "admin"):
        raise HTTPException(status_code=403, detail="Pharmacy access required.")
    
    uid = user["sub"]
    
    pending_rx = prescription_service.list_for_pharmacy(status="sent_to_pharmacy", limit=20)
    issued_rx = prescription_service.list_for_pharmacy(status="issued", limit=20)
    all_pending = pending_rx + issued_rx
    
    dispensed = prescription_service.col.count_documents({"pharmacy_id": uid, "status": "dispensed"})
    low_stock = inventory_service.get_low_stock(uid)
    inventory = inventory_service.list_all(uid)
    notifications = notification_service.get_for_user(uid, limit=10)

    metrics = {
        "pending_prescriptions": len(all_pending),
        "dispensed_total": dispensed,
        "total_inventory_items": len(inventory),
        "low_stock_alerts": len(low_stock),
        "unread_notifications": notification_service.count_unread(uid),
    }

    ai_summary = "Monitor your prescription queue and replenish low-stock items."
    ai_recommendations = [
        "Review pending prescriptions and dispense promptly.",
        "Order stock for items below reorder level.",
        "Verify drug interactions before dispensing.",
    ]

    if llm_service.enabled and low_stock:
        medicines_low = [item.get("medicine_name", "") for item in low_stock[:5]]
        try:
            result = llm_service.invoke_json(
                "You are an AI assistant for pharmacy management.",
                f"Pending prescriptions: {len(all_pending)}. Low stock items: {medicines_low}. "
                f"Return JSON: {{\"summary\": \"...\", \"recommendations\": [\"...\"]}}",
                {"summary": ai_summary, "recommendations": ai_recommendations},
            )
            ai_summary = result.get("summary", ai_summary)
            ai_recommendations = result.get("recommendations", ai_recommendations)
        except Exception:
            pass

    return {
        "metrics": metrics,
        "pending_prescriptions": all_pending[:10],
        "dispensed_today": [],  # TODO: filter by today
        "low_stock_alerts": low_stock,
        "notifications": notifications[:5],
        "ai_inventory_summary": ai_summary,
        "ai_recommendations": ai_recommendations,
    }


@pharmacy_router.get("/prescriptions")
def list_prescriptions(status: str | None = None, user: dict = Depends(get_current_user)):
    if user.get("role") not in ("pharmacy", "admin"):
        raise HTTPException(status_code=403, detail="Pharmacy access required.")
    return prescription_service.list_for_pharmacy(pharmacy_id=user["sub"], status=status)


@pharmacy_router.get("/prescriptions/all-pending")
def all_pending_prescriptions(user: dict = Depends(get_current_user)):
    """Get all prescriptions that are issued/pending to be dispensed."""
    if user.get("role") not in ("pharmacy", "admin"):
        raise HTTPException(status_code=403, detail="Pharmacy access required.")
    return prescription_service.list_for_pharmacy(status=None, limit=100)


@pharmacy_router.patch("/prescriptions/{prescription_id}")
def update_prescription(
    prescription_id: str,
    payload: PrescriptionUpdateRequest,
    user: dict = Depends(get_current_user),
):
    if user.get("role") not in ("pharmacy", "admin"):
        raise HTTPException(status_code=403, detail="Pharmacy access required.")
    
    rx = prescription_service.get(prescription_id)
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found.")

    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if payload.status == "dispensed":
        updates["pharmacy_id"] = user["sub"]
    
    updated = prescription_service.update(prescription_id, updates)
    
    # Notify patient
    if payload.status == "dispensed":
        notification_service.create(
            recipient_id=rx["patient_id"],
            notif_type="prescription_dispensed",
            title="Prescription Ready",
            message="Your prescription has been dispensed by the pharmacy. Please collect it.",
            data={"prescription_id": prescription_id},
        )
    elif payload.status == "rejected":
        notification_service.create(
            recipient_id=rx["patient_id"],
            notif_type="prescription_rejected",
            title="Prescription Issue",
            message="There was an issue with your prescription. Please contact your doctor.",
            data={"prescription_id": prescription_id},
        )
    return updated


@pharmacy_router.get("/inventory")
def list_inventory(search: str | None = None, user: dict = Depends(get_current_user)):
    if user.get("role") not in ("pharmacy", "admin"):
        raise HTTPException(status_code=403, detail="Pharmacy access required.")
    return inventory_service.list_all(user["sub"], search=search)


@pharmacy_router.post("/inventory", status_code=201)
def add_inventory_item(payload: InventoryItemRequest, user: dict = Depends(get_current_user)):
    if user.get("role") not in ("pharmacy", "admin"):
        raise HTTPException(status_code=403, detail="Pharmacy access required.")
    return inventory_service.add_item(user["sub"], payload.model_dump())


@pharmacy_router.patch("/inventory/{item_id}/quantity")
def update_stock_quantity(item_id: str, delta: int, user: dict = Depends(get_current_user)):
    if user.get("role") not in ("pharmacy", "admin"):
        raise HTTPException(status_code=403, detail="Pharmacy access required.")
    item = inventory_service.update_quantity(item_id, delta)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found.")
    return item


@pharmacy_router.get("/inventory/low-stock")
def low_stock_alerts(user: dict = Depends(get_current_user)):
    if user.get("role") not in ("pharmacy", "admin"):
        raise HTTPException(status_code=403, detail="Pharmacy access required.")
    return inventory_service.get_low_stock(user["sub"])


@pharmacy_router.get("/notifications")
def get_notifications(user: dict = Depends(get_current_user)):
    if user.get("role") not in ("pharmacy", "admin"):
        raise HTTPException(status_code=403, detail="Pharmacy access required.")
    return notification_service.get_for_user(user["sub"])
