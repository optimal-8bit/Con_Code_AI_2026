"""
Notification service for real-time alerts.
"""
from __future__ import annotations

from typing import Any

from app.db.mongo import mongo_service, now_utc, serialize_docs


class NotificationService:
    def __init__(self) -> None:
        self.col = mongo_service.collection("notifications")

    def create(
        self,
        recipient_id: str,
        notif_type: str,
        title: str,
        message: str,
        data: dict[str, Any] | None = None,
    ) -> str:
        doc = {
            "recipient_id": recipient_id,
            "type": notif_type,
            "title": title,
            "message": message,
            "read": False,
            "data": data or {},
            "created_at": now_utc(),
        }
        result = self.col.insert_one(doc)
        return str(result.inserted_id)

    def get_for_user(self, user_id: str, limit: int = 20, unread_only: bool = False) -> list[dict]:
        query: dict = {"recipient_id": user_id}
        if unread_only:
            query["read"] = False
        docs = list(self.col.find(query).sort("created_at", -1).limit(limit))
        return serialize_docs(docs)

    def mark_read(self, notification_id: str, user_id: str) -> bool:
        from app.db.mongo import to_object_id
        oid = to_object_id(notification_id)
        if not oid:
            return False
        result = self.col.update_one(
            {"_id": oid, "recipient_id": user_id},
            {"$set": {"read": True}},
        )
        return result.modified_count > 0

    def mark_all_read(self, user_id: str) -> int:
        result = self.col.update_many(
            {"recipient_id": user_id, "read": False},
            {"$set": {"read": True}},
        )
        return result.modified_count

    def count_unread(self, user_id: str) -> int:
        return self.col.count_documents({"recipient_id": user_id, "read": False})


notification_service = NotificationService()
