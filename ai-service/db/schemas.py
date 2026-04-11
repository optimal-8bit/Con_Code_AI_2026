from __future__ import annotations

from datetime import datetime, timezone
from typing import Any


def utc_now() -> datetime:
    return datetime.now(tz=timezone.utc)


def symptom_record(*, patient_id: str, user_input: str, result: dict[str, Any]) -> dict[str, Any]:
    return {
        "patient_id": patient_id,
        "user_input": user_input,
        "result": result,
        "created_at": utc_now(),
    }


def prescription_record(
    *,
    patient_id: str,
    extracted_text: str,
    medicines: list[dict[str, Any]],
    file_metadata: dict[str, Any],
    notes: str | None = None,
) -> dict[str, Any]:
    return {
        "patient_id": patient_id,
        "extracted_text": extracted_text,
        "medicines": medicines,
        "file_metadata": file_metadata,
        "notes": notes,
        "created_at": utc_now(),
    }


def report_summary_record(
    *,
    patient_id: str,
    question: str | None,
    summary: dict[str, Any],
    file_metadata: dict[str, Any],
) -> dict[str, Any]:
    return {
        "patient_id": patient_id,
        "record_type": "report_summary",
        "question": question,
        "summary": summary,
        "file_metadata": file_metadata,
        "created_at": utc_now(),
    }


def report_embedding_chunk_record(
    *,
    patient_id: str,
    report_ref: str,
    chunk_index: int,
    chunk_text: str,
    embedding: list[float],
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        "patient_id": patient_id,
        "record_type": "embedding_chunk",
        "report_ref": report_ref,
        "chunk_index": chunk_index,
        "chunk_text": chunk_text,
        "embedding": embedding,
        "metadata": metadata or {},
        "created_at": utc_now(),
    }


def chat_record(
    *,
    patient_id: str,
    message: str,
    response: dict[str, Any],
    input_history: list[dict[str, Any]],
    context: dict[str, Any],
) -> dict[str, Any]:
    return {
        "patient_id": patient_id,
        "message": message,
        "response": response,
        "input_history": input_history,
        "context": context,
        "created_at": utc_now(),
    }


def reminder_record(*, patient_id: str, timezone: str, schedule: dict[str, Any]) -> dict[str, Any]:
    return {
        "patient_id": patient_id,
        "timezone": timezone,
        "schedule": schedule,
        "created_at": utc_now(),
    }
