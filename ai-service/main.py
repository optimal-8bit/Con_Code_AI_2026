from __future__ import annotations

import logging
from typing import Any

from fastapi import FastAPI, File, Form, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from agents.chat_agent import health_chat
from agents.prescription_agent import analyze_prescription_image
from agents.reminder_agent import generate_reminder_schedule
from agents.report_agent import explain_report
from agents.symptom_agent import analyze_symptoms
from config.settings import get_settings, validate_gemini_initialization
from db.mongo import (
    find_many,
    initialize_mongo,
    insert_one,
    upsert_patient,
    validate_mongo_connection,
)
from db.schemas import (
    chat_record,
    prescription_record,
    reminder_record,
    report_summary_record,
    symptom_record,
)
from schemas.request_response import ChatRequest, ReminderRequest, SymptomCheckRequest
from utils.helpers import build_api_response
from workflows.langgraph_flow import run_health_workflow


settings = get_settings()
logger = logging.getLogger("healthcare_ai.startup")

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.parsed_cors_origins,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _normalize_patient_id(patient_id: str | None) -> str:
    normalized = (patient_id or "anonymous").strip()
    return normalized or "anonymous"


def _serialize_reports_for_context(reports: list[dict[str, Any]]) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    for record in reports:
        summary = record.get("summary")
        if isinstance(summary, dict):
            results.append(summary)
    return results


def _serialize_chat_history_for_context(chats: list[dict[str, Any]]) -> list[dict[str, str]]:
    history: list[dict[str, str]] = []

    for record in reversed(chats):
        message = str(record.get("message", "")).strip()
        response_data = record.get("response")
        assistant_reply = ""
        if isinstance(response_data, dict):
            assistant_reply = str(response_data.get("response", "")).strip()

        if message:
            history.append({"role": "user", "content": message})
        if assistant_reply:
            history.append({"role": "assistant", "content": assistant_reply})

    return history


def _is_quota_exhausted_error(exc: Exception) -> bool:
    message = str(exc).lower()
    exc_name = type(exc).__name__.lower()
    return (
        "quota" in message
        or "resourceexhausted" in exc_name
        or "resource_exhausted" in exc_name
        or "rate limit" in message
        or ("429" in message and "gemini" in message)
    )


def _is_invalid_image_error(exc: Exception) -> bool:
    message = str(exc).lower()
    exc_name = type(exc).__name__.lower()
    return (
        "cannot identify image file" in message
        or "unidentifiedimageerror" in exc_name
        or "loadimageerror" in exc_name
        or "the img type" in message
        or "could not broadcast input array" in message
    )


def _is_missing_model_error(exc: Exception) -> bool:
    message = str(exc).lower()
    return "is not found for api version" in message and "model" in message


def _raise_handled_ai_exception(exc: Exception, operation: str) -> None:
    if isinstance(exc, HTTPException):
        raise exc

    if _is_quota_exhausted_error(exc):
        raise HTTPException(
            status_code=503,
            detail="Gemini quota exceeded. Please retry shortly or update your Gemini API billing/quota.",
        )

    if _is_invalid_image_error(exc):
        raise HTTPException(
            status_code=400,
            detail="Unable to read the uploaded image. Please upload a valid PNG or JPEG file.",
        )

    if _is_missing_model_error(exc):
        raise HTTPException(
            status_code=503,
            detail="Configured Gemini model is unavailable. Update LLM_MODEL in backend .env and retry.",
        )

    logger.exception("%s failed: %s", operation, exc)
    raise HTTPException(
        status_code=502,
        detail=f"{operation} failed due to an upstream AI service error.",
    )


async def _load_patient_context(patient_id: str) -> dict[str, Any]:
    report_records = await find_many(
        "reports",
        {"patient_id": patient_id, "record_type": "report_summary"},
        projection={"_id": 0, "summary": 1},
        limit=5,
    )
    chat_records = await find_many(
        "chats",
        {"patient_id": patient_id},
        projection={"_id": 0, "message": 1, "response": 1},
        limit=10,
    )

    return {
        "recent_reports": _serialize_reports_for_context(report_records),
        "recent_chat_history": _serialize_chat_history_for_context(chat_records),
    }


@app.on_event("startup")
async def startup_event() -> None:
    try:
        validate_mongo_connection()
        await initialize_mongo()
        logger.info("MongoDB connected successfully")

        validate_gemini_initialization()
        logger.info("Gemini initialized successfully")
    except Exception as exc:
        raise RuntimeError(f"Startup validation failed: {exc}") from exc


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content=build_api_response(status="error", data={}, message=str(exc.detail)),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content=build_api_response(
            status="error", data={}, message=f"Internal server error: {str(exc)}"
        ),
    )


@app.get("/health")
async def health_check():
    return build_api_response(
        status="success",
        data={"service": settings.app_name, "version": settings.app_version},
        message="Service is healthy",
    )


@app.post(f"{settings.api_prefix}/symptom-check")
async def symptom_check(payload: SymptomCheckRequest):
    patient_id = _normalize_patient_id(payload.patient_id)
    patient_context = await _load_patient_context(patient_id)

    try:
        result = await analyze_symptoms(payload.text, patient_context=patient_context)
    except Exception as exc:
        _raise_handled_ai_exception(exc, "Symptom analysis")

    await upsert_patient(
        patient_id,
        {
            "last_activity": "symptom-check",
            "last_symptom_check": symptom_record(
                patient_id=patient_id,
                user_input=payload.text,
                result=result,
            ),
        },
    )

    return build_api_response(status="success", data=result)


@app.post(f"{settings.api_prefix}/prescription-analyze")
async def prescription_analyze(
    file: UploadFile = File(...),
    patient_id: str = Form(default="anonymous"),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Upload a valid image file")

    normalized_patient_id = _normalize_patient_id(patient_id)
    patient_context = await _load_patient_context(normalized_patient_id)

    content = await file.read()
    try:
        result = await analyze_prescription_image(content, patient_context=patient_context)
    except Exception as exc:
        _raise_handled_ai_exception(exc, "Prescription analysis")

    await insert_one(
        "prescriptions",
        prescription_record(
            patient_id=normalized_patient_id,
            extracted_text=str(result.get("extracted_text", "")),
            medicines=result.get("medicines", []),
            file_metadata={
                "filename": file.filename,
                "content_type": file.content_type,
                "size_bytes": len(content),
            },
            notes=result.get("notes"),
        ),
    )
    await upsert_patient(normalized_patient_id, {"last_activity": "prescription-analyze"})

    return build_api_response(status="success", data=result)


@app.post(f"{settings.api_prefix}/report-explain")
async def report_explain(
    file: UploadFile = File(...),
    question: str | None = Form(default=None),
    patient_id: str = Form(default="anonymous"),
):
    if file.content_type not in {"application/pdf", "application/octet-stream"}:
        raise HTTPException(status_code=400, detail="Upload a valid PDF report")

    normalized_patient_id = _normalize_patient_id(patient_id)
    patient_context = await _load_patient_context(normalized_patient_id)

    content = await file.read()
    try:
        result = await explain_report(
            content,
            patient_id=normalized_patient_id,
            question=question,
            patient_context=patient_context,
        )
    except Exception as exc:
        _raise_handled_ai_exception(exc, "Report explanation")

    await insert_one(
        "reports",
        report_summary_record(
            patient_id=normalized_patient_id,
            question=question,
            summary=result,
            file_metadata={
                "filename": file.filename,
                "content_type": file.content_type,
                "size_bytes": len(content),
            },
        ),
    )
    await upsert_patient(normalized_patient_id, {"last_activity": "report-explain"})

    return build_api_response(status="success", data=result)


@app.post(f"{settings.api_prefix}/chat")
async def chat(payload: ChatRequest):
    patient_id = _normalize_patient_id(payload.patient_id)
    patient_context = await _load_patient_context(patient_id)
    persisted_history = patient_context.get("recent_chat_history", [])
    request_history = [item.model_dump() for item in payload.history]
    combined_history = (persisted_history + request_history)[-20:]

    if payload.use_workflow and payload.symptom_text:
        try:
            result = await run_health_workflow(
                patient_id=patient_id,
                symptom_text=payload.symptom_text,
                chat_message=payload.message,
                report_result=payload.report_result,
                patient_context=patient_context,
            )
        except Exception as exc:
            _raise_handled_ai_exception(exc, "Workflow chat")

        await insert_one(
            "chats",
            chat_record(
                patient_id=patient_id,
                message=payload.message,
                response=result.get("chat_result", {}),
                input_history=combined_history,
                context={
                    "workflow": True,
                    "report_context": patient_context.get("recent_reports", []),
                },
            ),
        )
        await upsert_patient(patient_id, {"last_activity": "chat"})
        return build_api_response(status="success", data=result)

    merged_contexts = dict(payload.contexts)
    merged_contexts["patient_reports"] = patient_context.get("recent_reports", [])

    try:
        chat_result = await health_chat(
            message=payload.message,
            history=combined_history,
            contexts=merged_contexts,
            rag_context=payload.rag_context,
            patient_context=patient_context,
        )
    except Exception as exc:
        _raise_handled_ai_exception(exc, "Chat")

    await insert_one(
        "chats",
        chat_record(
            patient_id=patient_id,
            message=payload.message,
            response=chat_result,
            input_history=combined_history,
            context={
                "workflow": False,
                "report_context": patient_context.get("recent_reports", []),
            },
        ),
    )
    await upsert_patient(patient_id, {"last_activity": "chat"})

    return build_api_response(status="success", data=chat_result)


@app.post(f"{settings.api_prefix}/generate-reminder")
async def generate_reminder(payload: ReminderRequest):
    patient_id = _normalize_patient_id(payload.patient_id)

    result = generate_reminder_schedule(
        medicines=[medicine.model_dump() for medicine in payload.medicines],
        timezone=payload.timezone,
    )

    await insert_one(
        "reminders",
        reminder_record(
            patient_id=patient_id,
            timezone=payload.timezone,
            schedule=result,
        ),
    )
    await upsert_patient(patient_id, {"last_activity": "generate-reminder"})

    return build_api_response(status="success", data=result)


@app.get(f"{settings.api_prefix}/history/reports")
async def history_reports(
    patient_id: str = Query(default="anonymous"),
    limit: int = Query(default=20, ge=1, le=100),
):
    normalized_patient_id = _normalize_patient_id(patient_id)
    records = await find_many(
        "reports",
        {"patient_id": normalized_patient_id, "record_type": "report_summary"},
        projection={"_id": 0, "patient_id": 1, "question": 1, "summary": 1, "file_metadata": 1, "created_at": 1},
        limit=limit,
    )
    return build_api_response(status="success", data=records)


@app.get(f"{settings.api_prefix}/history/prescriptions")
async def history_prescriptions(
    patient_id: str = Query(default="anonymous"),
    limit: int = Query(default=20, ge=1, le=100),
):
    normalized_patient_id = _normalize_patient_id(patient_id)
    records = await find_many(
        "prescriptions",
        {"patient_id": normalized_patient_id},
        projection={"_id": 0, "patient_id": 1, "medicines": 1, "file_metadata": 1, "notes": 1, "created_at": 1},
        limit=limit,
    )
    return build_api_response(status="success", data=records)


@app.get(f"{settings.api_prefix}/history/chat")
async def history_chat(
    patient_id: str = Query(default="anonymous"),
    limit: int = Query(default=30, ge=1, le=200),
):
    normalized_patient_id = _normalize_patient_id(patient_id)
    records = await find_many(
        "chats",
        {"patient_id": normalized_patient_id},
        projection={"_id": 0, "patient_id": 1, "message": 1, "response": 1, "input_history": 1, "context": 1, "created_at": 1},
        limit=limit,
    )
    return build_api_response(status="success", data=records)


@app.get(f"{settings.api_prefix}/history/reminders")
async def history_reminders(
    patient_id: str = Query(default="anonymous"),
    limit: int = Query(default=20, ge=1, le=100),
):
    normalized_patient_id = _normalize_patient_id(patient_id)
    records = await find_many(
        "reminders",
        {"patient_id": normalized_patient_id},
        projection={"_id": 0, "patient_id": 1, "timezone": 1, "schedule": 1, "created_at": 1},
        limit=limit,
    )
    return build_api_response(status="success", data=records)
