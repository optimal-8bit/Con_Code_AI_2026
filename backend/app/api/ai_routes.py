"""
AI feature routes: Symptom Checker, Prescription Analyzer, Report Explainer, Smart Chat.
All support multimodal inputs (text + image base64 + file upload).
"""
from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from app.core.security import get_current_user
from app.models.schemas import (
    PrescriptionAnalyzerRequest,
    PrescriptionAnalyzerResponse,
    PrescriptionDrug,
    PrescriptionScheduleRequest,
    PrescriptionScheduleResponse,
    MedicineScheduleItem,
    ReportExplainerRequest,
    ReportExplainerResponse,
    ReportParameter,
    SmartChatRequest,
    SmartChatResponse,
    SymptomCheckerRequest,
    SymptomCheckerResponse,
)
from app.services.data_service import ai_record_service
from app.services.file_service import file_service
from app.services.llm_service import llm_service

ai_router = APIRouter()

DISCLAIMER = (
    "⚠️ This AI analysis is for informational purposes only and does not constitute "
    "medical advice. Always consult a qualified healthcare professional."
)


# ─── Symptom Checker ──────────────────────────────────────────────────────────

@ai_router.post("/symptom-checker", response_model=SymptomCheckerResponse)
async def symptom_checker(
    symptom_text: str = Form(""),
    voice_transcript: str = Form(""),
    image_description: str = Form(""),
    patient_age: int | None = Form(None),
    patient_gender: str | None = Form(None),
    known_conditions: str = Form(""),  # comma-separated
    current_medications: str = Form(""),  # comma-separated
    duration_days: int | None = Form(None),
    image_file: UploadFile | None = File(None),
    user: dict = Depends(get_current_user),
):
    image_base64 = ""
    mime_type = "image/jpeg"

    if image_file:
        file_bytes = await image_file.read()
        if not file_service.validate_file_size(file_bytes):
            raise HTTPException(status_code=413, detail="Image too large.")
        image_base64 = file_service.file_to_base64(file_bytes)
        mime_type = file_service.detect_mime_type(file_bytes, image_file.filename)

    conditions_list = [c.strip() for c in known_conditions.split(",") if c.strip()]
    meds_list = [m.strip() for m in current_medications.split(",") if m.strip()]

    user_prompt = _build_symptom_prompt(
        symptom_text, voice_transcript, image_description,
        patient_age, patient_gender, conditions_list, meds_list, duration_days
    )
    
    # Add image analysis instruction if image is provided
    if image_base64:
        user_prompt += "\n\n**IMPORTANT: An image has been provided. Please carefully analyze the image for any visible symptoms, skin conditions, rashes, injuries, or other health-related visual indicators. Include your observations from the image in your analysis.**"

    fallback = {
        "possible_conditions": [{"name": "Unspecified condition", "probability": "unknown", "description": "Please describe symptoms more clearly."}],
        "severity": "moderate",
        "red_flags": [],
        "next_steps": ["Consult a doctor immediately if symptoms worsen.", "Track your symptoms for 24-48 hours."],
        "recommended_specialist": None,
        "home_care_tips": ["Stay hydrated.", "Rest adequately."],
        "disclaimer": DISCLAIMER,
    }

    system_prompt = (
        "You are an expert medical triage AI. Analyze symptoms from multiple input sources "
        "(text description, voice, and images) to provide a comprehensive, safe assessment. "
        "Be conservative and always recommend professional consultation."
    )

    result = llm_service.invoke_json(
        system_prompt,
        user_prompt + "\n\nReturn JSON with keys: possible_conditions (array of {name, probability, description}), "
        "severity (low|moderate|high|critical), red_flags (array), next_steps (array), "
        "recommended_specialist (string or null), home_care_tips (array), disclaimer (string).",
        fallback,
        image_base64=image_base64,
        mime_type=mime_type,
    )

    # Normalize severity to lowercase (AI sometimes returns capitalized values)
    if "severity" in result and isinstance(result["severity"], str):
        result["severity"] = result["severity"].lower()

    record_id = ai_record_service.save_symptom_check(
        user["sub"],
        {"symptom_text": symptom_text, "patient_age": patient_age, "patient_gender": patient_gender},
        result,
    )
    result["record_id"] = record_id
    result.setdefault("disclaimer", DISCLAIMER)
    return SymptomCheckerResponse(**result)


def _build_symptom_prompt(
    text, voice, image_desc, age, gender, conditions, medications, duration
) -> str:
    parts = []
    if text:
        parts.append(f"Symptom Description: {text}")
    if voice:
        parts.append(f"Voice Transcript: {voice}")
    if image_desc:
        parts.append(f"Image Description: {image_desc}")
    if age:
        parts.append(f"Patient Age: {age}")
    if gender:
        parts.append(f"Patient Gender: {gender}")
    if conditions:
        parts.append(f"Known Medical Conditions: {', '.join(conditions)}")
    if medications:
        parts.append(f"Current Medications: {', '.join(medications)}")
    if duration:
        parts.append(f"Symptom Duration: {duration} days")
    return "\n".join(parts) if parts else "No symptom input provided."


# ─── Prescription Analyzer ────────────────────────────────────────────────────

@ai_router.post("/prescription-analyzer", response_model=PrescriptionAnalyzerResponse)
async def prescription_analyzer(
    prescription_text: str = Form(""),
    image_description: str = Form(""),
    patient_age: int | None = Form(None),
    patient_conditions: str = Form(""),
    prescription_file: UploadFile | None = File(None),
    user: dict = Depends(get_current_user),
):
    image_base64 = ""
    mime_type = "image/jpeg"
    file_url = None

    if prescription_file:
        file_bytes = await prescription_file.read()
        if not file_service.validate_file_size(file_bytes):
            raise HTTPException(status_code=413, detail="File too large.")
        
        mime = file_service.detect_mime_type(file_bytes, prescription_file.filename)
        if mime == "application/pdf":
            extracted = file_service.extract_pdf_text(file_bytes)
            if extracted:
                prescription_text = extracted + "\n" + prescription_text
            file_url = file_service.save_upload(file_bytes, prescription_file.filename, "prescriptions")
        else:
            file_url, image_base64 = file_service.process_prescription_image(file_bytes, prescription_file.filename)
            mime_type = mime

    conditions_list = [c.strip() for c in patient_conditions.split(",") if c.strip()]

    prompt = (
        f"Prescription Text:\n{prescription_text}\n\n"
        f"Image Description: {image_description}\n"
        f"Patient Age: {patient_age or 'unknown'}\n"
        f"Patient Conditions: {', '.join(conditions_list) or 'none'}\n\n"
        "Extract all medications and provide patient-friendly instructions."
    )
    
    # Add image analysis instruction if image is provided
    if image_base64:
        prompt += "\n\n**IMPORTANT: A prescription image has been provided. Please carefully read and extract all medicine names, dosages, frequencies, and instructions from the prescription image. Include all visible details.**"

    fallback = {
        "medicines": [{
            "name": "Unknown medicine",
            "generic_name": None,
            "dosage": "As prescribed",
            "frequency": "As prescribed",
            "duration": "As prescribed",
            "instructions": "Please verify with your pharmacist.",
            "side_effects": [],
            "interactions": [],
        }],
        "summary_instructions": ["Always take medicines as prescribed.", "Do not self-medicate."],
        "drug_interactions": [],
        "dietary_restrictions": [],
        "storage_instructions": ["Store at room temperature unless specified."],
    }

    result = llm_service.invoke_json(
        "You are a clinical pharmacist AI. Extract prescription data, explain medicines in simple language, "
        "and warn about interactions. Be thorough but patient-friendly.",
        prompt + "\n\nReturn JSON with keys: medicines (array of {name, generic_name, dosage, frequency, duration, "
        "instructions, side_effects (array), interactions (array)}), summary_instructions (array), "
        "drug_interactions (array), dietary_restrictions (array), storage_instructions (array).",
        fallback,
        image_base64=image_base64,
        mime_type=mime_type,
    )

    record_id = ai_record_service.save_prescription_analysis(
        user["sub"],
        {"prescription_text": prescription_text, "file_url": file_url},
        result,
    )
    result["record_id"] = record_id
    return PrescriptionAnalyzerResponse(**result)


# ─── Health Report Explainer ──────────────────────────────────────────────────

@ai_router.post("/report-explainer", response_model=ReportExplainerResponse)
async def report_explainer(
    report_text: str = Form(""),
    question: str = Form("Explain this medical report in simple language."),
    patient_age: int | None = Form(None),
    patient_gender: str | None = Form(None),
    report_type: str = Form("general"),
    report_file: UploadFile | None = File(None),
    user: dict = Depends(get_current_user),
):
    image_base64 = ""
    mime_type = "image/jpeg"
    file_url = None

    if report_file:
        file_bytes = await report_file.read()
        if not file_service.validate_file_size(file_bytes):
            raise HTTPException(status_code=413, detail="File too large.")
        
        file_url, extracted_text, b64 = file_service.process_report_file(file_bytes, report_file.filename)
        if extracted_text:
            report_text = extracted_text + "\n" + report_text
        if b64:
            image_base64 = b64
            mime_type = file_service.detect_mime_type(file_bytes, report_file.filename)

    if not report_text and not image_base64:
        raise HTTPException(status_code=400, detail="Please provide report text or upload a report file.")

    prompt = (
        f"Report Type: {report_type}\n"
        f"Patient Age: {patient_age or 'unknown'}\n"
        f"Patient Gender: {patient_gender or 'unknown'}\n"
        f"Patient Question: {question}\n\n"
        f"Medical Report:\n{report_text}\n\n"
        "Analyze this report comprehensively."
    )
    
    # Add image analysis instruction if image is provided
    if image_base64:
        prompt += "\n\n**IMPORTANT: A medical report image has been provided. Please carefully read and extract all test parameters, values, reference ranges, and findings from the report image. Analyze all visible data and provide a comprehensive interpretation.**"

    fallback = {
        "plain_language_summary": "Medical report received. Please consult a doctor for interpretation.",
        "parameters": [],
        "abnormalities": [],
        "risk_factors": [],
        "actionable_insights": ["Share this report with your doctor.", "Track any concerning symptoms."],
        "lifestyle_recommendations": ["Maintain a healthy diet and exercise routine."],
        "follow_up_tests": [],
        "urgency": "routine",
    }

    system_prompt = (
        "You are an expert medical report interpreter. Explain all parameters in plain language, "
        "highlight abnormalities, and provide actionable, safe recommendations. "
        "Always include urgency level based on findings."
    )

    result = llm_service.invoke_json(
        system_prompt,
        prompt + "\n\nReturn JSON with keys: plain_language_summary (string), "
        "parameters (array of {name, value, unit, reference_range, status (normal|low|high|critical), interpretation}), "
        "abnormalities (array of strings), risk_factors (array), actionable_insights (array), "
        "lifestyle_recommendations (array), follow_up_tests (array), "
        "urgency (routine|soon|urgent|emergency).",
        fallback,
        image_base64=image_base64,
        mime_type=mime_type,
    )

    # Ensure all fields have proper defaults
    if not result.get("plain_language_summary"):
        result["plain_language_summary"] = "Report analysis completed. Please review the details below."
    
    if not result.get("parameters"):
        result["parameters"] = []
    
    for param in result.get("parameters", []):
        if param.get("interpretation") is None:
            param["interpretation"] = ""
        # Normalize parameter status to lowercase
        if "status" in param and isinstance(param["status"], str):
            param["status"] = param["status"].lower()
    
    if not result.get("abnormalities"):
        result["abnormalities"] = []
    
    if not result.get("risk_factors"):
        result["risk_factors"] = []
    
    if not result.get("actionable_insights"):
        result["actionable_insights"] = []
    
    if not result.get("lifestyle_recommendations"):
        result["lifestyle_recommendations"] = []
    
    if not result.get("follow_up_tests"):
        result["follow_up_tests"] = []
    
    if not result.get("urgency"):
        result["urgency"] = "routine"
    # Normalize urgency to lowercase
    elif isinstance(result["urgency"], str):
        result["urgency"] = result["urgency"].lower()

    record_id = ai_record_service.save_report_explanation(
        user["sub"],
        {"report_type": report_type, "patient_age": patient_age, "file_url": file_url},
        result,
    )
    result["record_id"] = record_id
    return ReportExplainerResponse(**result)


# ─── Smart Health Chat (Legacy - kept for backward compatibility) ────────────

@ai_router.post("/smart-chat", response_model=SmartChatResponse)
def smart_chat(payload: SmartChatRequest, user: dict = Depends(get_current_user)):
    session_id = payload.session_id or str(uuid.uuid4())

    # Build context from chat history
    history_text = "\n".join(
        [f"{m.role.upper()}: {m.content}" for m in payload.chat_history[-8:]]
    )

    system_prompt = (
        "You are NextGen Health's Smart Health Assistant — an empathetic, knowledgeable AI that helps "
        "patients, doctors, and pharmacists understand medical information. "
        "Use the provided medical context when available. "
        "Always recommend consulting a healthcare professional for critical decisions. "
        "Keep responses clear, accurate, and appropriately detailed. "
        "Provide follow-up questions to help the user explore further."
    )

    user_prompt = ""
    if payload.report_context:
        user_prompt += f"Medical Report/Context:\n{payload.report_context}\n\n"
    if payload.medical_history:
        user_prompt += f"Patient Medical History:\n{payload.medical_history}\n\n"
    if history_text:
        user_prompt += f"Conversation History:\n{history_text}\n\n"
    user_prompt += f"Current Question: {payload.question}\n\n"
    user_prompt += (
        "Respond with JSON: {\"answer\": \"...\", \"follow_up_questions\": [\"...\", \"...\"], "
        "\"sources\": [\"...\"], \"disclaimer\": \"...\" or null}"
    )

    fallback = {
        "answer": (
            "I'd be happy to help, but I need more information. "
            "Could you share your specific symptoms, medical report, or question in more detail?"
        ),
        "follow_up_questions": [
            "Can you describe your symptoms in more detail?",
            "How long have you been experiencing this?",
            "Do you have any relevant medical history?",
        ],
        "sources": [],
        "disclaimer": DISCLAIMER,
    }

    result = llm_service.invoke_json(system_prompt, user_prompt, fallback)

    record_id = ai_record_service.save_chat(
        user["sub"],
        session_id,
        payload.question,
        result.get("answer", ""),
        {"context_type": payload.context_type, "has_report": bool(payload.report_context)},
    )

    return SmartChatResponse(
        answer=result.get("answer", fallback["answer"]),
        session_id=session_id,
        follow_up_questions=result.get("follow_up_questions", []),
        sources=result.get("sources", []),
        disclaimer=result.get("disclaimer", DISCLAIMER),
        record_id=record_id,
    )


# ─── Smart Chat Orchestrator (New Enhanced Version) ───────────────────────────

@ai_router.post("/chat-orchestrator")
async def chat_orchestrator_endpoint(
    message: str = Form(""),
    upload_intent: str = Form("none"),  # "symptom", "prescription", "report", "none"
    chat_history: str = Form("[]"),  # JSON string of chat history
    session_id: str = Form(None),
    file: UploadFile | None = File(None),
    user: dict = Depends(get_current_user),
):
    """
    Smart Chat Orchestrator - Routes requests to appropriate agents.
    
    This endpoint intelligently routes user input to:
    - Symptom Checker (for health concerns and symptoms)
    - Prescription Analyzer (for prescription-related queries)
    - Report Explainer (for medical report analysis)
    - General Health Chat (for other health questions)
    
    Routing is determined by the upload_intent parameter (which button was used).
    """
    from app.services.chat_orchestrator import chat_orchestrator
    import json
    
    # Generate session ID if not provided
    if not session_id:
        session_id = str(uuid.uuid4())
    
    # Parse chat history
    try:
        history = json.loads(chat_history) if chat_history else []
    except json.JSONDecodeError:
        history = []
    
    # Process uploaded file if present
    file_data = None
    if file:
        file_bytes = await file.read()
        if not file_service.validate_file_size(file_bytes):
            raise HTTPException(status_code=413, detail="File too large.")
        
        file_base64 = file_service.file_to_base64(file_bytes)
        mime_type = file_service.detect_mime_type(file_bytes, file.filename)
        
        file_data = {
            "base64": file_base64,
            "mime_type": mime_type,
            "filename": file.filename,
        }
    
    # Route to orchestrator
    try:
        result = await chat_orchestrator.process_chat_request(
            user_message=message,
            file_data=file_data,
            upload_intent=upload_intent,
            chat_history=history,
            user_id=user["sub"],
        )
        
        # Save to database
        record_id = ai_record_service.save_chat(
            user["sub"],
            session_id,
            message,
            result["answer"],
            {
                "agent_used": result.get("agent_used"),
                "upload_intent": upload_intent,
                "has_file": file is not None,
            },
        )
        
        return {
            "answer": result["answer"],
            "session_id": session_id,
            "agent_used": result.get("agent_used", "general_chat"),
            "supports_actions": result.get("supports_actions", False),
            "suggested_actions": result.get("suggested_actions", []),
            "disclaimer": result.get("disclaimer"),
            "record_id": record_id,
        }
        
    except Exception as exc:
        logger.error(f"Chat orchestrator error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@ai_router.post("/smart-chat/stream")
def smart_chat_stream(payload: SmartChatRequest, user: dict = Depends(get_current_user)):
    """SSE streaming endpoint for real-time chat responses."""
    session_id = payload.session_id or str(uuid.uuid4())

    history_text = "\n".join(
        [f"{m.role.upper()}: {m.content}" for m in payload.chat_history[-6:]]
    )

    system_prompt = (
        "You are NextGen Health's Smart Health Assistant. Be concise, empathetic, and medically accurate. "
        "Always recommend professional consultation for critical decisions."
    )

    user_prompt = ""
    if payload.report_context:
        user_prompt += f"Context:\n{payload.report_context}\n\n"
    if history_text:
        user_prompt += f"History:\n{history_text}\n\n"
    user_prompt += f"Question: {payload.question}"

    def generate():
        yield f"data: {{\"session_id\": \"{session_id}\"}}\n\n"
        for token in llm_service.invoke_stream(system_prompt, user_prompt):
            yield f"data: {{\"token\": {repr(token)}}}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@ai_router.get("/chat-history/{session_id}")
def get_chat_history(session_id: str, user: dict = Depends(get_current_user)):
    return ai_record_service.get_chat_history(session_id)


@ai_router.get("/symptom-history")
def get_symptom_history(user: dict = Depends(get_current_user)):
    return ai_record_service.get_user_symptom_history(user["sub"])


# ─── Prescription Schedule Extractor ──────────────────────────────────────────

@ai_router.post("/prescription-schedule", response_model=PrescriptionScheduleResponse)
async def prescription_schedule(
    prescription_text: str = Form(""),
    image_description: str = Form(""),
    prescription_file: UploadFile | None = File(None),
    user: dict = Depends(get_current_user),
):
    """
    Upload a prescription image and get a structured daily medication schedule.
    Extracts medicine names, dosages, frequency, duration, and generates timing.
    """
    image_base64 = ""
    mime_type = "image/jpeg"
    file_url = None

    if prescription_file:
        file_bytes = await prescription_file.read()
        if not file_service.validate_file_size(file_bytes):
            raise HTTPException(status_code=413, detail="File too large.")
        
        mime = file_service.detect_mime_type(file_bytes, prescription_file.filename)
        if mime == "application/pdf":
            extracted = file_service.extract_pdf_text(file_bytes)
            if extracted:
                prescription_text = extracted + "\n" + prescription_text
            file_url = file_service.save_upload(file_bytes, prescription_file.filename, "prescriptions")
        else:
            file_url, image_base64 = file_service.process_prescription_image(file_bytes, prescription_file.filename)
            mime_type = mime

    if not prescription_text and not image_base64:
        raise HTTPException(status_code=400, detail="Please provide prescription text or upload a prescription image.")

    prompt = (
        f"Prescription Text:\n{prescription_text}\n\n"
        f"Image Description: {image_description}\n\n"
        "Extract all medicines from this prescription and create a structured daily schedule. "
        "For each medicine, identify:\n"
        "1. Medicine name\n"
        "2. Dosage (e.g., '500mg', '1 tablet')\n"
        "3. Times per day (e.g., 2 for twice daily, 3 for thrice daily)\n"
        "4. Duration in days (e.g., 7, 14, 30)\n"
        "5. Suggested timing in 24-hour format (e.g., ['08:00', '20:00'] for twice daily)\n"
        "6. Special instructions (e.g., 'Take after meals', 'Take on empty stomach')\n\n"
        "Use standard timing conventions:\n"
        "- Once daily: ['08:00']\n"
        "- Twice daily: ['08:00', '20:00']\n"
        "- Thrice daily: ['08:00', '14:00', '20:00']\n"
        "- Four times daily: ['08:00', '12:00', '16:00', '20:00']\n"
    )
    
    # Add image analysis instruction if image is provided
    if image_base64:
        prompt += "\n\n**IMPORTANT: A prescription image has been provided. Please carefully read and extract all medicine names, dosages, frequencies (BD/TDS/QID), and durations from the prescription image. Create a complete medication schedule based on the visible prescription.**"

    fallback = {
        "medicines": [{
            "name": "Unable to extract medicine name",
            "dosage": "As prescribed",
            "times_per_day": 1,
            "duration_days": 7,
            "timing": ["08:00"],
            "instructions": "Please verify with your doctor or pharmacist.",
            "next_dose": None,
        }],
        "schedule_summary": "Unable to fully extract prescription details. Please consult your healthcare provider.",
        "total_medicines": 0,
        "next_upcoming_dose": None,
    }

    system_prompt = (
        "You are a clinical pharmacist AI specializing in prescription interpretation. "
        "Extract medicine information from handwritten or printed prescriptions accurately. "
        "Convert medical abbreviations (e.g., 'BD' = twice daily, 'TDS' = thrice daily, 'QID' = four times daily). "
        "Create a clear, patient-friendly medication schedule with specific times."
    )

    result = llm_service.invoke_json(
        system_prompt,
        prompt + "\n\nReturn JSON with keys: medicines (array of {name, dosage, times_per_day, duration_days, "
        "timing (array of time strings in HH:MM format), instructions, next_dose (null initially)}), "
        "schedule_summary (string), total_medicines (int), next_upcoming_dose (null initially).",
        fallback,
        image_base64=image_base64,
        mime_type=mime_type,
    )

    # Calculate next upcoming dose
    from datetime import datetime, timedelta
    now = datetime.now()
    current_time = now.strftime("%H:%M")
    
    next_dose = None
    min_time_diff = float('inf')
    
    for med in result.get("medicines", []):
        for time_str in med.get("timing", []):
            try:
                dose_time = datetime.strptime(time_str, "%H:%M").replace(
                    year=now.year, month=now.month, day=now.day
                )
                if dose_time < now:
                    dose_time += timedelta(days=1)
                
                time_diff = (dose_time - now).total_seconds()
                if time_diff < min_time_diff:
                    min_time_diff = time_diff
                    next_dose = {
                        "medicine": med.get("name"),
                        "dosage": med.get("dosage"),
                        "time": time_str,
                        "instructions": med.get("instructions"),
                    }
                    med["next_dose"] = time_str
            except ValueError:
                continue
    
    result["next_upcoming_dose"] = next_dose
    result["total_medicines"] = len(result.get("medicines", []))

    # Ensure all medicine fields have proper defaults
    for med in result.get("medicines", []):
        if med.get("duration_days") is None:
            med["duration_days"] = 7  # Default 7 days
        if med.get("instructions") is None:
            med["instructions"] = ""
        if "next_dose" not in med:
            med["next_dose"] = None

    # Save to database
    record_id = ai_record_service.save_prescription_schedule(
        user["sub"],
        {"prescription_text": prescription_text, "file_url": file_url},
        result,
    )
    result["record_id"] = record_id

    return PrescriptionScheduleResponse(**result)


@ai_router.get("/prescription-schedules")
def get_prescription_schedules(user: dict = Depends(get_current_user)):
    """Get all prescription schedules for the current user."""
    return ai_record_service.get_user_prescription_schedules(user["sub"])


@ai_router.post("/medication-adherence")
async def log_medication_adherence(
    medicine_name: str = Form(...),
    scheduled_time: str = Form(...),
    status: str = Form("taken"),
    user: dict = Depends(get_current_user),
):
    """Log when a user takes or skips a medication."""
    from datetime import datetime
    
    log_entry = {
        "user_id": user["sub"],
        "medicine_name": medicine_name,
        "scheduled_time": scheduled_time,
        "taken_at": datetime.utcnow().isoformat() if status == "taken" else None,
        "status": status,
        "logged_at": datetime.utcnow().isoformat(),
    }
    
    record_id = ai_record_service.save_medication_log(log_entry)
    
    return {
        "success": True,
        "message": f"Medication {status}",
        "record_id": record_id,
    }
