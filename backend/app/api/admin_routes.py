"""
Admin routes: user management, platform statistics.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user
from app.db.mongo import mongo_service
from app.services.data_service import user_service

admin_router = APIRouter()


def _require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")
    return user


@admin_router.get("/stats")
def platform_stats(admin: dict = Depends(_require_admin)):
    db = mongo_service.db
    return {
        "users": {
            "total": db["users"].count_documents({}),
            "patients": db["users"].count_documents({"role": "patient"}),
            "doctors": db["users"].count_documents({"role": "doctor"}),
            "pharmacies": db["users"].count_documents({"role": "pharmacy"}),
        },
        "appointments": {
            "total": db["appointments"].count_documents({}),
            "pending": db["appointments"].count_documents({"status": "pending"}),
            "completed": db["appointments"].count_documents({"status": "completed"}),
        },
        "prescriptions": {
            "total": db["prescriptions"].count_documents({}),
            "issued": db["prescriptions"].count_documents({"status": "issued"}),
            "dispensed": db["prescriptions"].count_documents({"status": "dispensed"}),
        },
        "ai_interactions": {
            "symptom_checks": db["symptom_checks"].count_documents({}),
            "prescription_analyses": db["prescription_analyses"].count_documents({}),
            "report_explanations": db["report_explanations"].count_documents({}),
            "chat_sessions": db["chat_sessions"].count_documents({}),
        },
    }


@admin_router.get("/users")
def list_users(role: str | None = None, admin: dict = Depends(_require_admin)):
    query = {}
    if role:
        query["role"] = role
    docs = list(mongo_service.collection("users").find(query).limit(100))
    from app.db.mongo import serialize_docs
    result = serialize_docs(docs)
    return [user_service.safe_user(u) for u in result]


@admin_router.delete("/users/{user_id}")
def deactivate_user(user_id: str, admin: dict = Depends(_require_admin)):
    user_service.update_user(user_id, {"active": False})
    return {"message": "User deactivated."}
