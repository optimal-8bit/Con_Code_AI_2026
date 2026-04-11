"""
Core data service - user management, appointments, prescriptions, records, medications.
"""
from __future__ import annotations

from datetime import timedelta
from typing import Any

from pymongo import DESCENDING

from app.core.security import hash_password, verify_password
from app.db.mongo import mongo_service, now_utc, serialize_doc, serialize_docs, to_object_id


class UserService:
    def __init__(self) -> None:
        self.col = mongo_service.collection("users")

    def create_user(self, payload: dict) -> dict | None:
        existing = self.col.find_one({"email": payload["email"]})
        if existing:
            return None  # Duplicate email

        doc = {
            "name": payload["name"],
            "email": payload["email"],
            "password_hash": hash_password(payload["password"]),
            "role": payload.get("role", "patient"),
            "phone": payload.get("phone"),
            "profile": payload.get("profile", {}),
            "active": True,
            "created_at": now_utc(),
            "updated_at": now_utc(),
        }
        result = self.col.insert_one(doc)
        return serialize_doc(self.col.find_one({"_id": result.inserted_id}))

    def authenticate(self, email: str, password: str) -> dict | None:
        user = self.col.find_one({"email": email, "active": True})
        if not user or not verify_password(password, user["password_hash"]):
            return None
        return serialize_doc(user)

    def get_by_id(self, user_id: str) -> dict | None:
        oid = to_object_id(user_id)
        if not oid:
            return None
        return serialize_doc(self.col.find_one({"_id": oid}))

    def update_user(self, user_id: str, updates: dict) -> dict | None:
        oid = to_object_id(user_id)
        if not oid:
            return None
        updates["updated_at"] = now_utc()
        self.col.update_one({"_id": oid}, {"$set": updates})
        return serialize_doc(self.col.find_one({"_id": oid}))

    def change_password(self, user_id: str, old_password: str, new_password: str) -> bool:
        user_doc = self.col.find_one({"_id": to_object_id(user_id)})
        if not user_doc or not verify_password(old_password, user_doc["password_hash"]):
            return False
        self.col.update_one(
            {"_id": to_object_id(user_id)},
            {"$set": {"password_hash": hash_password(new_password), "updated_at": now_utc()}},
        )
        return True

    def list_by_role(self, role: str, filters: dict | None = None, limit: int = 50) -> list[dict]:
        query: dict = {"role": role, "active": True}
        if filters:
            query.update(filters)
        docs = list(self.col.find(query).limit(limit))
        return serialize_docs(docs)

    def safe_user(self, user: dict) -> dict:
        """Strip sensitive fields from user dict."""
        return {k: v for k, v in user.items() if k not in ("password_hash",)}


class AppointmentService:
    def __init__(self) -> None:
        self.col = mongo_service.collection("appointments")

    def create(self, payload: dict) -> dict:
        doc = {
            "patient_id": payload["patient_id"],
            "doctor_id": payload["doctor_id"],
            "scheduled_at": payload["scheduled_at"],
            "reason": payload.get("reason", ""),
            "notes": payload.get("notes", ""),
            "status": "pending",
            "doctor_notes": None,
            "diagnosis": None,
            "prescription_id": None,
            "created_at": now_utc(),
            "updated_at": now_utc(),
        }
        result = self.col.insert_one(doc)
        return serialize_doc(self.col.find_one({"_id": result.inserted_id}))

    def get(self, appointment_id: str) -> dict | None:
        oid = to_object_id(appointment_id)
        return serialize_doc(self.col.find_one({"_id": oid})) if oid else None

    def update(self, appointment_id: str, updates: dict) -> dict | None:
        oid = to_object_id(appointment_id)
        if not oid:
            return None
        updates["updated_at"] = now_utc()
        self.col.update_one({"_id": oid}, {"$set": updates})
        return serialize_doc(self.col.find_one({"_id": oid}))

    def list_for_patient(self, patient_id: str, status: str | None = None, limit: int = 20) -> list[dict]:
        query: dict = {"patient_id": patient_id}
        if status:
            query["status"] = status
        docs = list(self.col.find(query).sort("scheduled_at", DESCENDING).limit(limit))
        return serialize_docs(docs)

    def list_for_doctor(self, doctor_id: str, status: str | None = None, limit: int = 50) -> list[dict]:
        query: dict = {"doctor_id": doctor_id}
        if status:
            query["status"] = status
        docs = list(self.col.find(query).sort("scheduled_at", DESCENDING).limit(limit))
        return serialize_docs(docs)

    def todays_for_doctor(self, doctor_id: str) -> list[dict]:
        from datetime import date
        today_start = now_utc().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        docs = list(
            self.col.find(
                {
                    "doctor_id": doctor_id,
                    "scheduled_at": {"$gte": today_start, "$lt": today_end},
                }
            ).sort("scheduled_at", 1)
        )
        return serialize_docs(docs)

    def count_by_status(self, field: str, value: str) -> dict:
        pipeline = [
            {"$match": {field: value}},
            {"$group": {"_id": "$status", "count": {"$sum": 1}}},
        ]
        result = {item["_id"]: item["count"] for item in self.col.aggregate(pipeline)}
        return result


class PrescriptionService:
    def __init__(self) -> None:
        self.col = mongo_service.collection("prescriptions")

    def create(self, payload: dict) -> dict:
        issued_at = now_utc()
        valid_until = issued_at + timedelta(days=payload.get("valid_days", 30))
        doc = {
            "patient_id": payload["patient_id"],
            "doctor_id": payload["doctor_id"],
            "pharmacy_id": None,
            "appointment_id": payload.get("appointment_id"),
            "medicines": payload["medicines"],
            "notes": payload.get("notes", ""),
            "status": "issued",
            "pharmacy_notes": None,
            "issued_at": issued_at,
            "valid_until": valid_until,
            "created_at": issued_at,
            "updated_at": issued_at,
        }
        result = self.col.insert_one(doc)
        return serialize_doc(self.col.find_one({"_id": result.inserted_id}))

    def get(self, prescription_id: str) -> dict | None:
        oid = to_object_id(prescription_id)
        return serialize_doc(self.col.find_one({"_id": oid})) if oid else None

    def update(self, prescription_id: str, updates: dict) -> dict | None:
        oid = to_object_id(prescription_id)
        if not oid:
            return None
        updates["updated_at"] = now_utc()
        self.col.update_one({"_id": oid}, {"$set": updates})
        return serialize_doc(self.col.find_one({"_id": oid}))

    def list_for_patient(self, patient_id: str, limit: int = 20) -> list[dict]:
        docs = list(self.col.find({"patient_id": patient_id}).sort("created_at", DESCENDING).limit(limit))
        return serialize_docs(docs)

    def list_for_doctor(self, doctor_id: str, limit: int = 50) -> list[dict]:
        docs = list(self.col.find({"doctor_id": doctor_id}).sort("created_at", DESCENDING).limit(limit))
        return serialize_docs(docs)

    def list_for_pharmacy(self, pharmacy_id: str | None = None, status: str | None = None, limit: int = 50) -> list[dict]:
        query: dict = {}
        if pharmacy_id:
            query["pharmacy_id"] = pharmacy_id
        if status:
            query["status"] = status
        else:
            # Default: show pending and issued
            query["status"] = {"$in": ["issued", "sent_to_pharmacy"]}
        docs = list(self.col.find(query).sort("created_at", DESCENDING).limit(limit))
        return serialize_docs(docs)


class MedicalRecordService:
    def __init__(self) -> None:
        self.col = mongo_service.collection("medical_records")

    def create(self, payload: dict) -> dict:
        doc = {
            "patient_id": payload["patient_id"],
            "record_type": payload.get("record_type", "lab_report"),
            "title": payload["title"],
            "content": payload.get("content", ""),
            "file_url": payload.get("file_url"),
            "report_date": payload.get("report_date"),
            "ai_summary": payload.get("ai_summary"),
            "created_at": now_utc(),
        }
        result = self.col.insert_one(doc)
        return serialize_doc(self.col.find_one({"_id": result.inserted_id}))

    def get(self, record_id: str) -> dict | None:
        oid = to_object_id(record_id)
        return serialize_doc(self.col.find_one({"_id": oid})) if oid else None

    def update_ai_summary(self, record_id: str, summary: str) -> None:
        oid = to_object_id(record_id)
        if oid:
            self.col.update_one({"_id": oid}, {"$set": {"ai_summary": summary}})

    def list_for_patient(self, patient_id: str, record_type: str | None = None, limit: int = 20) -> list[dict]:
        query: dict = {"patient_id": patient_id}
        if record_type:
            query["record_type"] = record_type
        docs = list(self.col.find(query).sort("created_at", DESCENDING).limit(limit))
        return serialize_docs(docs)


class MedicationService:
    def __init__(self) -> None:
        self.col = mongo_service.collection("medications")
        self.logs_col = mongo_service.collection("medication_logs")

    def create(self, patient_id: str, payload: dict) -> dict:
        doc = {
            "patient_id": patient_id,
            "prescription_id": payload.get("prescription_id"),
            "medicine_name": payload["medicine_name"],
            "dosage": payload["dosage"],
            "frequency": payload["frequency"],
            "start_date": payload["start_date"],
            "end_date": payload.get("end_date"),
            "reminder_times": payload.get("reminder_times", []),
            "active": True,
            "adherence_rate": 0.0,
            "created_at": now_utc(),
        }
        result = self.col.insert_one(doc)
        return serialize_doc(self.col.find_one({"_id": result.inserted_id}))

    def log_dose(self, medication_id: str, patient_id: str, status: str, taken_at=None) -> dict:
        doc = {
            "medication_id": medication_id,
            "patient_id": patient_id,
            "status": status,
            "taken_at": taken_at or now_utc(),
            "logged_at": now_utc(),
        }
        result = self.logs_col.insert_one(doc)
        self._update_adherence(medication_id)
        return serialize_doc(self.logs_col.find_one({"_id": result.inserted_id}))

    def _update_adherence(self, medication_id: str) -> None:
        total = self.logs_col.count_documents({"medication_id": medication_id})
        taken = self.logs_col.count_documents({"medication_id": medication_id, "status": "taken"})
        rate = (taken / total * 100) if total > 0 else 0.0
        self.col.update_one(
            {"_id": to_object_id(medication_id)},
            {"$set": {"adherence_rate": round(rate, 1)}},
        )

    def list_active(self, patient_id: str) -> list[dict]:
        docs = list(self.col.find({"patient_id": patient_id, "active": True}))
        return serialize_docs(docs)

    def list_all(self, patient_id: str) -> list[dict]:
        docs = list(self.col.find({"patient_id": patient_id}).sort("created_at", DESCENDING))
        return serialize_docs(docs)


class InventoryService:
    def __init__(self) -> None:
        self.col = mongo_service.collection("inventory")

    def add_item(self, pharmacy_id: str, payload: dict) -> dict:
        doc = {
            "pharmacy_id": pharmacy_id,
            "medicine_name": payload["medicine_name"],
            "generic_name": payload.get("generic_name"),
            "category": payload.get("category", "general"),
            "quantity": payload["quantity"],
            "unit": payload.get("unit", "tablets"),
            "price_per_unit": payload["price_per_unit"],
            "reorder_level": payload.get("reorder_level", 50),
            "expiry_date": payload.get("expiry_date"),
            "manufacturer": payload.get("manufacturer"),
            "batch_number": payload.get("batch_number"),
            "created_at": now_utc(),
            "updated_at": now_utc(),
        }
        result = self.col.insert_one(doc)
        return serialize_doc(self.col.find_one({"_id": result.inserted_id}))

    def update_quantity(self, item_id: str, delta: int) -> dict | None:
        oid = to_object_id(item_id)
        if not oid:
            return None
        self.col.update_one(
            {"_id": oid},
            {"$inc": {"quantity": delta}, "$set": {"updated_at": now_utc()}},
        )
        return serialize_doc(self.col.find_one({"_id": oid}))

    def get_low_stock(self, pharmacy_id: str) -> list[dict]:
        docs = list(
            self.col.find({
                "pharmacy_id": pharmacy_id,
                "$expr": {"$lte": ["$quantity", "$reorder_level"]},
            })
        )
        return serialize_docs(docs)

    def list_all(self, pharmacy_id: str, search: str | None = None) -> list[dict]:
        query: dict = {"pharmacy_id": pharmacy_id}
        if search:
            import re
            pattern = re.compile(search, re.IGNORECASE)
            query["medicine_name"] = {"$regex": pattern}
        docs = list(self.col.find(query).sort("medicine_name", 1))
        result = serialize_docs(docs)
        # Add is_low_stock flag
        for item in result:
            item["is_low_stock"] = item.get("quantity", 0) <= item.get("reorder_level", 50)
        return result


class AIRecordService:
    """Stores AI analysis results for history tracking."""

    def __init__(self) -> None:
        self.symptom_col = mongo_service.collection("symptom_checks")
        self.prescription_col = mongo_service.collection("prescription_analyses")
        self.report_col = mongo_service.collection("report_explanations")
        self.chat_col = mongo_service.collection("chat_sessions")
        self.schedule_col = mongo_service.collection("prescription_schedules")
        self.medication_logs_col = mongo_service.collection("medication_adherence_logs")

    def save_symptom_check(self, user_id: str, input_data: dict, output: dict) -> str:
        doc = {"user_id": user_id, "input": input_data, "output": output, "created_at": now_utc()}
        result = self.symptom_col.insert_one(doc)
        return str(result.inserted_id)

    def save_prescription_analysis(self, user_id: str, input_data: dict, output: dict) -> str:
        doc = {"user_id": user_id, "input": input_data, "output": output, "created_at": now_utc()}
        result = self.prescription_col.insert_one(doc)
        return str(result.inserted_id)

    def save_report_explanation(self, user_id: str, input_data: dict, output: dict) -> str:
        doc = {"user_id": user_id, "input": input_data, "output": output, "created_at": now_utc()}
        result = self.report_col.insert_one(doc)
        return str(result.inserted_id)

    def save_chat(self, user_id: str, session_id: str, question: str, answer: str, context: dict) -> str:
        doc = {
            "user_id": user_id,
            "session_id": session_id,
            "question": question,
            "answer": answer,
            "context": context,
            "created_at": now_utc(),
        }
        result = self.chat_col.insert_one(doc)
        return str(result.inserted_id)

    def get_chat_history(self, session_id: str, limit: int = 20) -> list[dict]:
        docs = list(self.chat_col.find({"session_id": session_id}).sort("created_at", 1).limit(limit))
        return serialize_docs(docs)

    def get_user_symptom_history(self, user_id: str, limit: int = 10) -> list[dict]:
        docs = list(self.symptom_col.find({"user_id": user_id}).sort("created_at", DESCENDING).limit(limit))
        return serialize_docs(docs)

    def save_prescription_schedule(self, user_id: str, input_data: dict, output: dict) -> str:
        doc = {"user_id": user_id, "input": input_data, "output": output, "created_at": now_utc()}
        result = self.schedule_col.insert_one(doc)
        return str(result.inserted_id)

    def get_user_prescription_schedules(self, user_id: str, limit: int = 10) -> list[dict]:
        docs = list(self.schedule_col.find({"user_id": user_id}).sort("created_at", DESCENDING).limit(limit))
        return serialize_docs(docs)

    def save_medication_log(self, log_entry: dict) -> str:
        result = self.medication_logs_col.insert_one(log_entry)
        return str(result.inserted_id)


class OrderService:
    """Manages pharmacy orders and payments."""

    def __init__(self) -> None:
        self.col = mongo_service.collection("orders")

    def create(self, payload: dict) -> dict:
        medicines = payload.get("medicines", [])
        subtotal = sum(item["quantity"] * item["price_per_unit"] for item in medicines)
        tax = round(subtotal * 0.08, 2)  # 8% tax
        total = round(subtotal + tax, 2)

        doc = {
            "patient_id": payload["patient_id"],
            "pharmacy_id": payload["pharmacy_id"],
            "prescription_id": payload.get("prescription_id"),
            "medicines": medicines,
            "subtotal": subtotal,
            "tax": tax,
            "total": total,
            "status": "pending",  # pending, confirmed, preparing, ready, delivered, cancelled
            "payment_status": "pending",  # pending, paid, failed, refunded
            "payment_intent_id": None,
            "delivery_address": payload.get("delivery_address", ""),
            "notes": payload.get("notes", ""),
            "created_at": now_utc(),
            "updated_at": now_utc(),
        }
        result = self.col.insert_one(doc)
        return serialize_doc(self.col.find_one({"_id": result.inserted_id}))

    def get(self, order_id: str) -> dict | None:
        oid = to_object_id(order_id)
        return serialize_doc(self.col.find_one({"_id": oid})) if oid else None

    def update(self, order_id: str, updates: dict) -> dict | None:
        oid = to_object_id(order_id)
        if not oid:
            return None
        updates["updated_at"] = now_utc()
        self.col.update_one({"_id": oid}, {"$set": updates})
        return serialize_doc(self.col.find_one({"_id": oid}))

    def list_for_patient(self, patient_id: str, limit: int = 20) -> list[dict]:
        docs = list(self.col.find({"patient_id": patient_id}).sort("created_at", DESCENDING).limit(limit))
        return serialize_docs(docs)

    def list_for_pharmacy(self, pharmacy_id: str, status: str | None = None, limit: int = 50) -> list[dict]:
        query: dict = {"pharmacy_id": pharmacy_id}
        if status:
            query["status"] = status
        docs = list(self.col.find(query).sort("created_at", DESCENDING).limit(limit))
        return serialize_docs(docs)

    def count_by_status(self, pharmacy_id: str) -> dict:
        pipeline = [
            {"$match": {"pharmacy_id": pharmacy_id}},
            {"$group": {"_id": "$status", "count": {"$sum": 1}}},
        ]
        result = {item["_id"]: item["count"] for item in self.col.aggregate(pipeline)}
        return result


class DoctorAvailabilityService:
    """Manages doctor availability slots."""

    def __init__(self) -> None:
        self.col = mongo_service.collection("doctor_availability")

    def set_availability(self, doctor_id: str, date: str, slots: list[str]) -> dict:
        """Set available time slots for a specific date."""
        from datetime import datetime
        
        # Remove existing availability for this date
        self.col.delete_many({"doctor_id": doctor_id, "date": date})
        
        # Insert new slots
        docs = []
        for slot in slots:
            docs.append({
                "doctor_id": doctor_id,
                "date": date,
                "time": slot,
                "is_booked": False,
                "created_at": now_utc(),
            })
        
        if docs:
            self.col.insert_many(docs)
        
        return {"date": date, "slots": slots}

    def get_available_slots(self, doctor_id: str, date: str) -> list[str]:
        """Get available (unbooked) slots for a specific date."""
        docs = list(self.col.find({
            "doctor_id": doctor_id,
            "date": date,
            "is_booked": False,
        }).sort("time", 1))
        return [doc["time"] for doc in docs]

    def book_slot(self, doctor_id: str, date: str, time: str, appointment_id: str) -> bool:
        """Mark a slot as booked."""
        result = self.col.update_one(
            {
                "doctor_id": doctor_id,
                "date": date,
                "time": time,
                "is_booked": False,
            },
            {
                "$set": {
                    "is_booked": True,
                    "appointment_id": appointment_id,
                    "booked_at": now_utc(),
                }
            }
        )
        return result.modified_count > 0

    def release_slot(self, appointment_id: str) -> bool:
        """Release a booked slot (when appointment is cancelled)."""
        result = self.col.update_one(
            {"appointment_id": appointment_id},
            {
                "$set": {
                    "is_booked": False,
                    "appointment_id": None,
                    "booked_at": None,
                }
            }
        )
        return result.modified_count > 0


# Singleton instances
user_service = UserService()
appointment_service = AppointmentService()
prescription_service = PrescriptionService()
medical_record_service = MedicalRecordService()
medication_service = MedicationService()
inventory_service = InventoryService()
ai_record_service = AIRecordService()
order_service = OrderService()
doctor_availability_service = DoctorAvailabilityService()
