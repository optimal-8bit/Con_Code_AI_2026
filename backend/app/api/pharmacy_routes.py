"""
Pharmacy dashboard routes: prescription fulfillment, inventory management.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.db.mongo import now_utc
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
    order_service,
)
from app.services.notification_service import notification_service
from app.services.llm_service import llm_service

pharmacy_router = APIRouter()


@pharmacy_router.get("/dashboard")
def pharmacy_dashboard(user: dict = Depends(get_current_user)):
    if user.get("role") not in ("pharmacy", "admin"):
        raise HTTPException(status_code=403, detail="Pharmacy access required.")
    
    uid = user["sub"]
    
    # Get orders
    all_orders = order_service.list_for_pharmacy(uid, limit=100)
    pending_orders = [o for o in all_orders if o.get("status") in ("pending", "confirmed")]
    completed_orders = [o for o in all_orders if o.get("status") in ("ready", "delivered")]
    
    # Get prescriptions
    pending_rx = prescription_service.list_for_pharmacy(status="sent_to_pharmacy", limit=20)
    issued_rx = prescription_service.list_for_pharmacy(status="issued", limit=20)
    all_pending = pending_rx + issued_rx
    
    dispensed = prescription_service.col.count_documents({"pharmacy_id": uid, "status": "dispensed"})
    low_stock = inventory_service.get_low_stock(uid)
    inventory = inventory_service.list_all(uid)
    notifications = notification_service.get_for_user(uid, limit=10)
    
    # Calculate revenue
    total_revenue = sum(o.get("total", 0) for o in all_orders if o.get("payment_status") == "paid")
    today_revenue = sum(
        o.get("total", 0) for o in all_orders 
        if o.get("payment_status") == "paid" and o.get("created_at", "")[:10] == str(now_utc())[:10]
    )

    metrics = {
        "pending_orders": len(pending_orders),
        "completed_orders": len(completed_orders),
        "total_orders": len(all_orders),
        "total_revenue": round(total_revenue, 2),
        "today_revenue": round(today_revenue, 2),
        "pending_prescriptions": len(all_pending),
        "dispensed_total": dispensed,
        "total_inventory_items": len(inventory),
        "low_stock_alerts": len(low_stock),
        "unread_notifications": notification_service.count_unread(uid),
    }

    ai_summary = "Monitor your order queue and replenish low-stock items."
    ai_recommendations = [
        "Process pending orders promptly.",
        "Order stock for items below reorder level.",
        "Verify drug interactions before dispensing.",
    ]

    if llm_service.enabled and (pending_orders or low_stock):
        medicines_low = [item.get("medicine_name", "") for item in low_stock[:5]]
        try:
            result = llm_service.invoke_json(
                "You are an AI assistant for pharmacy management.",
                f"Pending orders: {len(pending_orders)}. Low stock items: {medicines_low}. "
                f"Return JSON: {{\"summary\": \"...\", \"recommendations\": [\"...\"]}}",
                {"summary": ai_summary, "recommendations": ai_recommendations},
            )
            ai_summary = result.get("summary", ai_summary)
            ai_recommendations = result.get("recommendations", ai_recommendations)
        except Exception:
            pass

    return {
        "metrics": metrics,
        "pending_orders": pending_orders[:10],
        "completed_orders": completed_orders[:10],
        "pending_prescriptions": all_pending[:10],
        "dispensed_today": [],
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


# ─── Order Management ─────────────────────────────────────────────────────────

@pharmacy_router.get("/orders")
def list_orders(status: str | None = None, user: dict = Depends(get_current_user)):
    """List all orders for this pharmacy."""
    if user.get("role") not in ("pharmacy", "admin"):
        raise HTTPException(status_code=403, detail="Pharmacy access required.")
    return order_service.list_for_pharmacy(user["sub"], status=status)


@pharmacy_router.get("/orders/{order_id}")
def get_order(order_id: str, user: dict = Depends(get_current_user)):
    """Get a specific order."""
    if user.get("role") not in ("pharmacy", "admin"):
        raise HTTPException(status_code=403, detail="Pharmacy access required.")
    
    order = order_service.get(order_id)
    if not order or order["pharmacy_id"] != user["sub"]:
        raise HTTPException(status_code=404, detail="Order not found.")
    return order


@pharmacy_router.patch("/orders/{order_id}/status")
def update_order_status(
    order_id: str,
    status: str,
    user: dict = Depends(get_current_user)
):
    """Update order status (preparing, ready, delivered, cancelled)."""
    if user.get("role") not in ("pharmacy", "admin"):
        raise HTTPException(status_code=403, detail="Pharmacy access required.")
    
    order = order_service.get(order_id)
    if not order or order["pharmacy_id"] != user["sub"]:
        raise HTTPException(status_code=404, detail="Order not found.")
    
    updated = order_service.update(order_id, {"status": status})
    
    # Notify patient
    status_messages = {
        "confirmed": "Your order has been confirmed and is being prepared.",
        "preparing": "Your order is being prepared.",
        "ready": "Your order is ready for pickup!",
        "delivered": "Your order has been delivered.",
        "cancelled": "Your order has been cancelled.",
    }
    
    msg = status_messages.get(status)
    if msg:
        notification_service.create(
            recipient_id=order["patient_id"],
            notif_type="order_update",
            title=f"Order {status.capitalize()}",
            message=msg,
            data={"order_id": order_id},
        )
    
    return updated
