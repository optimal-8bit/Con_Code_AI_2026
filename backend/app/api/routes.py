from fastapi import APIRouter, HTTPException

from agents.analysis_agent import ReportExplainerAgent
from agents.chat_agent import SmartHealthChatAgent
from agents.prescription_agent import PrescriptionAnalyzerAgent
from agents.symptom_agent import MultimodalSymptomCheckerAgent
from agents.workflow_agents import (
    DoctorDashboardAgent,
    PatientDashboardAgent,
    PharmacyDashboardAgent,
)
from app.models.schemas import (
    DashboardRequest,
    DashboardResponse,
    DashboardSnapshotResponse,
    PrescriptionAnalyzerRequest,
    PrescriptionAnalyzerResponse,
    ReportExplainerRequest,
    ReportExplainerResponse,
    StakeholderCreateRequest,
    StakeholderResponse,
    SmartChatRequest,
    SmartChatResponse,
    SymptomCheckerRequest,
    SymptomCheckerResponse,
)
from app.services.data_service import data_service

router = APIRouter()

symptom_agent = MultimodalSymptomCheckerAgent()
prescription_agent = PrescriptionAnalyzerAgent()
report_agent = ReportExplainerAgent()
chat_agent = SmartHealthChatAgent()
patient_agent = PatientDashboardAgent()
doctor_agent = DoctorDashboardAgent()
pharmacy_agent = PharmacyDashboardAgent()


@router.post("/agents/symptom-checker", response_model=SymptomCheckerResponse)
def run_symptom_checker(payload: SymptomCheckerRequest) -> SymptomCheckerResponse:
    result = symptom_agent.invoke(payload.model_dump())
    saved = data_service.save_symptom_check(payload.model_dump(), result["output"])
    response = {**result["output"], "record_id": saved["record_id"]}
    return SymptomCheckerResponse(**response)


@router.post("/agents/prescription-analyzer", response_model=PrescriptionAnalyzerResponse)
def run_prescription_analyzer(payload: PrescriptionAnalyzerRequest) -> PrescriptionAnalyzerResponse:
    result = prescription_agent.invoke(payload.model_dump())
    saved = data_service.save_prescription_analysis(payload.model_dump(), result["output"])
    response = {**result["output"], "record_id": saved["record_id"]}
    return PrescriptionAnalyzerResponse(**response)


@router.post("/agents/report-explainer", response_model=ReportExplainerResponse)
def run_report_explainer(payload: ReportExplainerRequest) -> ReportExplainerResponse:
    result = report_agent.invoke(payload.model_dump())
    saved = data_service.save_report_explanation(payload.model_dump(), result["output"])
    response = {**result["output"], "record_id": saved["record_id"]}
    return ReportExplainerResponse(**response)


@router.post("/agents/smart-chat", response_model=SmartChatResponse)
def run_smart_chat(payload: SmartChatRequest) -> SmartChatResponse:
    result = chat_agent.invoke(
        {
            "question": payload.question,
            "report_context": payload.report_context,
            "chat_history": [m.model_dump() for m in payload.chat_history],
        }
    )
    stored = data_service.save_chat_message(
        {
            "patient_id": payload.patient_id,
            "doctor_id": payload.doctor_id,
            "pharmacy_id": payload.pharmacy_id,
            "question": payload.question,
            "report_context": payload.report_context,
            "chat_history": [m.model_dump() for m in payload.chat_history],
        },
        result["answer"],
    )
    return SmartChatResponse(answer=result["answer"], record_id=stored["record_id"])


@router.post("/stakeholders", response_model=StakeholderResponse)
def create_stakeholder(payload: StakeholderCreateRequest) -> StakeholderResponse:
    created = data_service.register_stakeholder(payload.model_dump())
    if not created:
        raise HTTPException(status_code=500, detail="Unable to create stakeholder")

    return StakeholderResponse(
        id=created.get("_id", ""),
        name=created.get("name", ""),
        role=created.get("role", ""),
        email=created.get("email"),
        phone=created.get("phone"),
        profile=created.get("profile") or {},
        created_at=created.get("created_at", ""),
        updated_at=created.get("updated_at", ""),
    )


@router.get("/stakeholders/{stakeholder_id}", response_model=StakeholderResponse)
def get_stakeholder(stakeholder_id: str) -> StakeholderResponse:
    found = data_service.get_stakeholder(stakeholder_id)
    if not found:
        raise HTTPException(status_code=404, detail="Stakeholder not found")

    return StakeholderResponse(
        id=found.get("_id", ""),
        name=found.get("name", ""),
        role=found.get("role", ""),
        email=found.get("email"),
        phone=found.get("phone"),
        profile=found.get("profile") or {},
        created_at=found.get("created_at", ""),
        updated_at=found.get("updated_at", ""),
    )


@router.post("/dashboards/patient", response_model=DashboardResponse)
def patient_dashboard(payload: DashboardRequest) -> DashboardResponse:
    result = patient_agent.invoke(payload.model_dump())
    return DashboardResponse(**result["output"])


@router.post("/dashboards/doctor", response_model=DashboardResponse)
def doctor_dashboard(payload: DashboardRequest) -> DashboardResponse:
    result = doctor_agent.invoke(payload.model_dump())
    return DashboardResponse(**result["output"])


@router.post("/dashboards/pharmacy", response_model=DashboardResponse)
def pharmacy_dashboard(payload: DashboardRequest) -> DashboardResponse:
    result = pharmacy_agent.invoke(payload.model_dump())
    return DashboardResponse(**result["output"])


@router.get("/dashboards/{role}/{stakeholder_id}", response_model=DashboardSnapshotResponse)
def get_dashboard_snapshot(role: str, stakeholder_id: str) -> DashboardSnapshotResponse:
    if role not in {"patient", "doctor", "pharmacy"}:
        raise HTTPException(status_code=400, detail="role must be one of: patient, doctor, pharmacy")

    dashboard_data = data_service.get_role_dashboard_data(role, stakeholder_id)
    records = dashboard_data.get("records", [])
    metrics = dashboard_data.get("metrics", {})

    payload = DashboardRequest(
        stakeholder_id=stakeholder_id,
        profile={"role": role},
        records=records,
    )

    if role == "patient":
        ai = patient_agent.invoke(payload.model_dump())
    elif role == "doctor":
        ai = doctor_agent.invoke(payload.model_dump())
    else:
        ai = pharmacy_agent.invoke(payload.model_dump())

    output = ai.get("output", {})

    return DashboardSnapshotResponse(
        role=role,
        stakeholder_id=stakeholder_id,
        metrics=metrics,
        recent_records=records,
        ai_summary=output.get("summary", "Dashboard summary unavailable."),
        ai_actions=output.get("action_items", []),
    )
