from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.collection import Collection
from pymongo.database import Database

from app.core.config import settings


class MongoService:
    """Synchronous MongoDB service with async motor client available."""

    def __init__(self) -> None:
        # Sync client for synchronous operations
        self._client = MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=5000)
        self._db: Database = self._client[settings.mongodb_db_name]
        
        # Async client for streaming/async endpoints
        self._async_client = AsyncIOMotorClient(settings.mongodb_uri, serverSelectionTimeoutMS=5000)
        self._async_db: AsyncIOMotorDatabase = self._async_client[settings.mongodb_db_name]
        
        self._ensure_indexes()

    def _ensure_indexes(self) -> None:
        """Create indexes on startup for performance."""
        try:
            self._db["users"].create_index([("email", ASCENDING)], unique=True)
            self._db["users"].create_index([("phone", ASCENDING)])
            self._db["users"].create_index([("role", ASCENDING)])
            
            self._db["appointments"].create_index([("patient_id", ASCENDING)])
            self._db["appointments"].create_index([("doctor_id", ASCENDING)])
            self._db["appointments"].create_index([("scheduled_at", ASCENDING)])
            self._db["appointments"].create_index([("status", ASCENDING)])
            
            self._db["prescriptions"].create_index([("patient_id", ASCENDING)])
            self._db["prescriptions"].create_index([("doctor_id", ASCENDING)])
            self._db["prescriptions"].create_index([("pharmacy_id", ASCENDING)])
            self._db["prescriptions"].create_index([("status", ASCENDING)])
            
            self._db["medical_records"].create_index([("patient_id", ASCENDING)])
            self._db["medical_records"].create_index([("created_at", DESCENDING)])
            
            self._db["symptom_checks"].create_index([("patient_id", ASCENDING)])
            self._db["symptom_checks"].create_index([("created_at", DESCENDING)])
            
            self._db["chat_sessions"].create_index([("user_id", ASCENDING)])
            self._db["chat_sessions"].create_index([("created_at", DESCENDING)])
            
            self._db["notifications"].create_index([("recipient_id", ASCENDING)])
            self._db["notifications"].create_index([("read", ASCENDING)])
            self._db["notifications"].create_index([("created_at", DESCENDING)])
            
            self._db["medications"].create_index([("patient_id", ASCENDING)])
        except Exception:
            pass  # Indexes might already exist

    @property
    def db(self) -> Database:
        return self._db

    @property
    def async_db(self) -> AsyncIOMotorDatabase:
        return self._async_db

    def collection(self, name: str) -> Collection:
        return self._db[name]

    def ping(self) -> bool:
        try:
            self._client.admin.command("ping")
            return True
        except Exception:
            return False


def now_utc() -> datetime:
    return datetime.now(UTC)


def to_object_id(raw_id: str) -> ObjectId | None:
    try:
        return ObjectId(raw_id)
    except Exception:
        return None


def serialize_doc(doc: dict[str, Any] | None) -> dict[str, Any] | None:
    if not doc:
        return None

    serialized: dict[str, Any] = {}
    for key, value in doc.items():
        new_key = "id" if key == "_id" else key
        if isinstance(value, ObjectId):
            serialized[new_key] = str(value)
        elif isinstance(value, datetime):
            serialized[new_key] = value.isoformat()
        elif isinstance(value, list):
            serialized[new_key] = [
                serialize_doc(item) if isinstance(item, dict) else item
                for item in value
            ]
        elif isinstance(value, dict):
            serialized[new_key] = serialize_doc(value)
        else:
            serialized[new_key] = value
    return serialized


def serialize_docs(docs) -> list[dict[str, Any]]:
    return [serialize_doc(d) for d in docs if d]


mongo_service = MongoService()
