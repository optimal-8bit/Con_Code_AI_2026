from __future__ import annotations

import asyncio
from typing import Any

from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
from pymongo.errors import PyMongoError

from config.settings import get_mongo_uri


_client: MongoClient | None = None
_db: Database | None = None


def _get_database_sync() -> Database:
    global _client
    global _db

    if _db is not None:
        return _db

    mongo_uri = get_mongo_uri()

    _client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
    try:
        _client.admin.command("ping")
    except PyMongoError as exc:
        raise ConnectionError(f"MongoDB connection failed: {exc}") from exc

    _db = _client["healthcare_ai"]
    return _db


def get_collection(collection_name: str) -> Collection:
    db = _get_database_sync()
    return db[collection_name]


def _initialize_mongo_sync() -> None:
    db = _get_database_sync()

    db["patients"].create_index([("patient_id", ASCENDING)], unique=True)
    db["reports"].create_index([("patient_id", ASCENDING), ("created_at", DESCENDING)])
    db["prescriptions"].create_index([("patient_id", ASCENDING), ("created_at", DESCENDING)])
    db["chats"].create_index([("patient_id", ASCENDING), ("created_at", DESCENDING)])
    db["reminders"].create_index([("patient_id", ASCENDING), ("created_at", DESCENDING)])


def validate_mongo_connection() -> None:
    _get_database_sync()


async def initialize_mongo() -> None:
    await asyncio.to_thread(_initialize_mongo_sync)


async def insert_one(collection_name: str, document: dict[str, Any]) -> str:
    collection = get_collection(collection_name)
    result = await asyncio.to_thread(collection.insert_one, document)
    return str(result.inserted_id)


async def update_one(
    collection_name: str,
    query: dict[str, Any],
    update: dict[str, Any],
    *,
    upsert: bool = False,
) -> None:
    collection = get_collection(collection_name)
    await asyncio.to_thread(collection.update_one, query, update, upsert)


async def find_many(
    collection_name: str,
    query: dict[str, Any],
    *,
    projection: dict[str, int] | None = None,
    limit: int = 10,
    sort_field: str = "created_at",
    descending: bool = True,
) -> list[dict[str, Any]]:
    collection = get_collection(collection_name)
    sort_direction = DESCENDING if descending else ASCENDING

    def _find_sync() -> list[dict[str, Any]]:
        cursor = collection.find(query, projection or {}).sort(sort_field, sort_direction).limit(limit)
        return list(cursor)

    return await asyncio.to_thread(_find_sync)


async def upsert_patient(patient_id: str, update_fields: dict[str, Any]) -> None:
    update_payload = {
        "$set": {**update_fields},
        "$setOnInsert": {"patient_id": patient_id},
    }
    await update_one("patients", {"patient_id": patient_id}, update_payload, upsert=True)
