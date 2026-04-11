"""
Comprehensive Pydantic schemas for NextGen Health Platform.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Literal
from pydantic import BaseModel, EmailStr, Field, field_validator


# ─── Auth ────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: Literal["patient", "doctor", "pharmacy"] = "patient"
    phone: str | None = None
    profile: dict[str, Any] = Field(default_factory=dict)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict[str, Any]


class RefreshRequest(BaseModel):
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6)


# ─── User / Profile ───────────────────────────────────────────────────────────

class UserProfileUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    profile: dict[str, Any] | None = None


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    phone: str | None = None
    profile: dict[str, Any] = Field(default_factory=dict)
    created_at: str
    updated_at: str


# ─── Appointments ─────────────────────────────────────────────────────────────

class AppointmentCreateRequest(BaseModel):
    doctor_id: str
    patient_id: str | None = None  # Set from token if not provided
    scheduled_at: datetime
    reason: str = ""
    notes: str = ""


class AppointmentUpdateRequest(BaseModel):
    scheduled_at: datetime | None = None
    reason: str | None = None
    notes: str | None = None
    status: Literal["pending", "confirmed", "cancelled", "completed"] | None = None
    doctor_notes: str | None = None
    diagnosis: str | None = None


class AppointmentResponse(BaseModel):
    id: str
    patient_id: str
    doctor_id: str
    scheduled_at: str
    reason: str
    notes: str
    status: str
    doctor_notes: str | None = None
    diagnosis: str | None = None
    prescription_id: str | None = None
    created_at: str
    updated_at: str


# ─── Prescriptions ────────────────────────────────────────────────────────────

class MedicineItem(BaseModel):
    name: str
    dosage: str
    frequency: str
    duration: str
    instructions: str = ""
    quantity: int | None = None


class PrescriptionCreateRequest(BaseModel):
    patient_id: str
    appointment_id: str | None = None
    medicines: list[MedicineItem]
    notes: str = ""
    valid_days: int = 30


class PrescriptionUpdateRequest(BaseModel):
    status: Literal["issued", "sent_to_pharmacy", "dispensed", "rejected"] | None = None
    pharmacy_id: str | None = None
    pharmacy_notes: str | None = None


class PrescriptionResponse(BaseModel):
    id: str
    patient_id: str
    doctor_id: str
    pharmacy_id: str | None = None
    appointment_id: str | None = None
    medicines: list[dict]
    notes: str
    status: str
    pharmacy_notes: str | None = None
    issued_at: str
    valid_until: str
    created_at: str
    updated_at: str


# ─── Medical Records ──────────────────────────────────────────────────────────

class MedicalRecordCreateRequest(BaseModel):
    patient_id: str | None = None  # Set from token
    record_type: Literal["lab_report", "imaging", "diagnosis", "vaccination", "surgery", "other"] = "lab_report"
    title: str
    content: str = ""
    file_url: str | None = None
    report_date: datetime | None = None


class MedicalRecordResponse(BaseModel):
    id: str
    patient_id: str
    record_type: str
    title: str
    content: str
    file_url: str | None = None
    report_date: str | None = None
    ai_summary: str | None = None
    created_at: str


# ─── Medications / Tracker ────────────────────────────────────────────────────

class MedicationTrackerRequest(BaseModel):
    prescription_id: str | None = None
    medicine_name: str
    dosage: str
    frequency: str
    start_date: datetime
    end_date: datetime | None = None
    reminder_times: list[str] = Field(default_factory=list)  # e.g. ["08:00", "20:00"]


class MedicationLogRequest(BaseModel):
    medication_id: str
    taken_at: datetime | None = None
    status: Literal["taken", "skipped", "late"] = "taken"


class MedicationResponse(BaseModel):
    id: str
    patient_id: str
    prescription_id: str | None = None
    medicine_name: str
    dosage: str
    frequency: str
    start_date: str
    end_date: str | None = None
    reminder_times: list[str]
    adherence_rate: float = 0.0
    created_at: str


# ─── Notifications ────────────────────────────────────────────────────────────

class NotificationResponse(BaseModel):
    id: str
    recipient_id: str
    type: str
    title: str
    message: str
    read: bool
    data: dict[str, Any] = Field(default_factory=dict)
    created_at: str


# ─── AI Features ─────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class SymptomCheckerRequest(BaseModel):
    symptom_text: str = ""
    voice_transcript: str = ""
    image_base64: str = ""  # Base64 encoded image
    image_description: str = ""
    patient_age: int | None = None
    patient_gender: str | None = None
    known_conditions: list[str] = Field(default_factory=list)
    current_medications: list[str] = Field(default_factory=list)
    duration_days: int | None = None


class SymptomCheckerResponse(BaseModel):
    possible_conditions: list[dict[str, Any]]  # name, probability, description
    severity: Literal["low", "moderate", "high", "critical"]
    red_flags: list[str]
    next_steps: list[str]
    recommended_specialist: str | None = None
    home_care_tips: list[str]
    disclaimer: str
    record_id: str | None = None


class PrescriptionAnalyzerRequest(BaseModel):
    prescription_text: str = ""
    image_base64: str = ""  # Base64 encoded prescription image
    image_description: str = ""
    patient_age: int | None = None
    patient_conditions: list[str] = Field(default_factory=list)


class PrescriptionDrug(BaseModel):
    name: str
    generic_name: str | None = None
    dosage: str
    frequency: str
    duration: str
    instructions: str
    side_effects: list[str] = Field(default_factory=list)
    interactions: list[str] = Field(default_factory=list)


class PrescriptionAnalyzerResponse(BaseModel):
    medicines: list[PrescriptionDrug]
    summary_instructions: list[str]
    drug_interactions: list[str]
    dietary_restrictions: list[str]
    storage_instructions: list[str]
    record_id: str | None = None


# ─── Prescription Schedule ────────────────────────────────────────────────────

class MedicineScheduleItem(BaseModel):
    name: str
    dosage: str
    times_per_day: int
    duration_days: int | None = None
    timing: list[str]  # e.g., ["08:00", "14:00", "20:00"]
    instructions: str | None = None
    next_dose: str | None = None


class PrescriptionScheduleRequest(BaseModel):
    prescription_text: str = ""
    image_description: str = ""


class PrescriptionScheduleResponse(BaseModel):
    medicines: list[MedicineScheduleItem]
    schedule_summary: str
    total_medicines: int
    next_upcoming_dose: dict[str, Any] | None = None
    record_id: str | None = None


class MedicationAdherenceLog(BaseModel):
    medicine_name: str
    scheduled_time: str
    taken_at: datetime | None = None
    status: Literal["taken", "skipped", "pending"] = "pending"


class ReportExplainerRequest(BaseModel):
    report_text: str
    image_base64: str = ""  # for image-based reports
    patient_age: int | None = None
    patient_gender: str | None = None
    question: str = "Explain this report in simple language."
    report_type: str = "general"  # lab, CBC, lipid, etc.


class ReportParameter(BaseModel):
    name: str
    value: str | int | float
    unit: str | None = None
    reference_range: str | None = None
    status: Literal["normal", "low", "high", "critical"] = "normal"
    interpretation: str | None = None
    
    @field_validator('value', mode='before')
    @classmethod
    def convert_value_to_string(cls, v):
        if v is None:
            return ""
        return str(v)


class ReportExplainerResponse(BaseModel):
    plain_language_summary: str = ""
    parameters: list[ReportParameter] = Field(default_factory=list)
    abnormalities: list[str] = Field(default_factory=list)
    risk_factors: list[str] = Field(default_factory=list)
    actionable_insights: list[str] = Field(default_factory=list)
    lifestyle_recommendations: list[str] = Field(default_factory=list)
    follow_up_tests: list[str] = Field(default_factory=list)
    urgency: Literal["routine", "soon", "urgent", "emergency"] = "routine"
    record_id: str | None = None


class SmartChatRequest(BaseModel):
    question: str
    report_context: str = ""
    medical_history: str = ""
    chat_history: list[ChatMessage] = Field(default_factory=list)
    session_id: str | None = None
    context_type: Literal["general", "report", "prescription", "symptom"] = "general"


class SmartChatResponse(BaseModel):
    answer: str
    session_id: str
    follow_up_questions: list[str]
    sources: list[str]
    disclaimer: str | None = None
    record_id: str | None = None


# ─── Dashboard ────────────────────────────────────────────────────────────────

class DashboardMetrics(BaseModel):
    total_appointments: int = 0
    pending_appointments: int = 0
    completed_appointments: int = 0
    total_prescriptions: int = 0
    active_medications: int = 0
    unread_notifications: int = 0
    symptom_checks: int = 0
    medical_records: int = 0


class PatientDashboardResponse(BaseModel):
    metrics: DashboardMetrics
    upcoming_appointments: list[dict]
    active_medications: list[dict]
    recent_records: list[dict]
    recent_prescriptions: list[dict]
    notifications: list[dict]
    ai_health_summary: str
    ai_recommendations: list[str]


class DoctorDashboardResponse(BaseModel):
    metrics: DashboardMetrics
    todays_appointments: list[dict]
    pending_appointments: list[dict]
    recent_patients: list[dict]
    recent_prescriptions: list[dict]
    notifications: list[dict]
    ai_workload_summary: str
    ai_recommendations: list[str]


class PharmacyDashboardResponse(BaseModel):
    metrics: dict[str, Any]
    pending_prescriptions: list[dict]
    dispensed_today: list[dict]
    low_stock_alerts: list[dict]
    notifications: list[dict]
    ai_inventory_summary: str
    ai_recommendations: list[str]


# ─── Pharmacy Inventory ───────────────────────────────────────────────────────

class InventoryItemRequest(BaseModel):
    medicine_name: str
    generic_name: str | None = None
    category: str = "general"
    quantity: int
    unit: str = "tablets"
    price_per_unit: float
    reorder_level: int = 50
    expiry_date: datetime | None = None
    manufacturer: str | None = None
    batch_number: str | None = None


class InventoryItemResponse(BaseModel):
    id: str
    pharmacy_id: str
    medicine_name: str
    generic_name: str | None = None
    category: str
    quantity: int
    unit: str
    price_per_unit: float
    reorder_level: int
    is_low_stock: bool
    expiry_date: str | None = None
    manufacturer: str | None = None
    batch_number: str | None = None
    created_at: str
    updated_at: str


# ─── Doctor Management ────────────────────────────────────────────────────────

class DoctorSearchRequest(BaseModel):
    specialty: str | None = None
    name: str | None = None
    city: str | None = None


class DoctorListResponse(BaseModel):
    id: str
    name: str
    email: str
    specialty: str | None = None
    experience_years: int | None = None
    rating: float | None = None
    available: bool = True
    city: str | None = None


# ─── Common ───────────────────────────────────────────────────────────────────

class PaginatedResponse(BaseModel):
    items: list[Any]
    total: int
    page: int
    per_page: int
    total_pages: int


class MessageResponse(BaseModel):
    message: str
    success: bool = True
    data: Any = None
