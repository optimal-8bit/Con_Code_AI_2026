"""
Core data service - user management, appointments, prescriptions, records, medications.
"""
from __future__ import annotations

from datetime import datetime, timedelta
import json
from typing import Any
import re

from pymongo import DESCENDING

from app.core.security import hash_password, verify_password
from app.db.mongo import mongo_service, now_utc, serialize_doc, serialize_docs, to_object_id


class UserService:
    def __init__(self) -> None:
        self.col = mongo_service.collection("users")

    def create_user(self, payload: dict, skip_password_hash: bool = False) -> dict | None:
        existing = self.col.find_one({"email": payload["email"]})
        if existing:
            return None  # Duplicate email

        doc = {
            "name": payload["name"],
            "email": payload["email"],
            "password_hash": "" if skip_password_hash else hash_password(payload["password"]),
            "role": payload.get("role", "patient"),
            "phone": payload.get("phone"),
            "profile": payload.get("profile", {}),
            "active": True,
            "created_at": now_utc(),
            "updated_at": now_utc(),
        }
        result = self.col.insert_one(doc)
        return serialize_doc(self.col.find_one({"_id": result.inserted_id}))

    def get_by_email(self, email: str) -> dict | None:
        user = self.col.find_one({"email": email, "active": True})
        return serialize_doc(user) if user else None

    def authenticate(self, email: str, password: str) -> dict | None:
        user = self.col.find_one({"email": email, "active": True})
        if not user:
            return None
        # Check if OAuth user (no password)
        if not user.get("password_hash"):
            return None  # OAuth users cannot login with password
        if not verify_password(password, user["password_hash"]):
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
            "prescription_file_url": payload.get("prescription_file_url"),
            "prescription_file_public_id": payload.get("prescription_file_public_id"),
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
            "linked_schedule_id": payload.get("linked_schedule_id"),
            "created_at": now_utc(),
        }

        # Persist structured content consistently when callers provide dictionaries/lists.
        if isinstance(doc["content"], (dict, list)):
            doc["content"] = json.dumps(doc["content"], ensure_ascii=True)

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
        self.records_col = mongo_service.collection("medical_records")

    def _safe_int(self, value: Any, fallback: int) -> int:
        try:
            parsed = int(value)
            return parsed if parsed > 0 else fallback
        except Exception:
            return fallback

    def _parse_frequency_for_times_per_day(self, frequency: str) -> int:
        freq = (frequency or "").strip().lower()
        if not freq:
            return 1

        every_hours_match = re.search(r"every\s*(\d+)\s*hour", freq)
        if every_hours_match:
            hours = self._safe_int(every_hours_match.group(1), 24)
            if hours <= 0:
                return 1
            return max(1, round(24 / hours))

        number_match = re.search(r"(\d+)\s*(x|times?)\s*(daily|per\s*day)", freq)
        if number_match:
            return self._safe_int(number_match.group(1), 1)

        if "once" in freq or "od" in freq:
            return 1
        if "twice" in freq or "bd" in freq:
            return 2
        if "thrice" in freq or "tds" in freq:
            return 3
        if "four" in freq or "qid" in freq:
            return 4
        return 1

    def _default_times(self, times_per_day: int) -> list[str]:
        defaults: dict[int, list[str]] = {
            1: ["08:00"],
            2: ["08:00", "20:00"],
            3: ["06:00", "14:00", "22:00"],
            4: ["06:00", "12:00", "18:00", "22:00"],
        }
        if times_per_day in defaults:
            return defaults[times_per_day]

        # Spread doses throughout the day for uncommon schedules.
        step = max(1, round(24 / max(1, times_per_day)))
        return [f"{((6 + i * step) % 24):02d}:00" for i in range(times_per_day)]

    def _normalize_time(self, time_value: str) -> str | None:
        if not time_value:
            return None
        raw = str(time_value).strip()
        match = re.fullmatch(r"([01]?\d|2[0-3]):([0-5]\d)", raw)
        if not match:
            return None
        hour = int(match.group(1))
        minute = match.group(2)
        return f"{hour:02d}:{minute}"

    def _sanitize_reminder_times(self, reminder_times: list[str] | None, times_per_day: int) -> list[str]:
        normalized: list[str] = []
        for time_value in reminder_times or []:
            normalized_time = self._normalize_time(time_value)
            if normalized_time and normalized_time not in normalized:
                normalized.append(normalized_time)

        if not normalized:
            normalized = self._default_times(times_per_day)

        return normalized[: max(1, times_per_day)]

    def _duration_days_from_dates(self, start_date: Any, end_date: Any) -> int:
        if not start_date or not end_date:
            return 1
        if isinstance(start_date, str):
            start_date = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
        if isinstance(end_date, str):
            end_date = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
        try:
            delta_days = (end_date.date() - start_date.date()).days + 1
            return max(1, delta_days)
        except Exception:
            return 1

    def _backfill_medication_plan_if_needed(self, med_doc: dict) -> dict:
        if med_doc.get("total_doses") and med_doc.get("times_per_day") and med_doc.get("reminder_times"):
            return med_doc

        current_reminder_times = med_doc.get("reminder_times", []) or []
        inferred_times_per_day = self._safe_int(
            med_doc.get("times_per_day"),
            len(current_reminder_times) or self._parse_frequency_for_times_per_day(med_doc.get("frequency", "")),
        )
        if len(current_reminder_times) > inferred_times_per_day:
            inferred_times_per_day = len(current_reminder_times)

        inferred_duration_days = self._safe_int(
            med_doc.get("duration_days"),
            self._duration_days_from_dates(med_doc.get("start_date"), med_doc.get("end_date")),
        )
        normalized_times = self._sanitize_reminder_times(current_reminder_times, inferred_times_per_day)
        inferred_times_per_day = max(inferred_times_per_day, len(normalized_times))
        inferred_total_doses = self._safe_int(
            med_doc.get("total_doses"),
            max(1, inferred_times_per_day * inferred_duration_days),
        )

        update_fields = {
            "times_per_day": inferred_times_per_day,
            "duration_days": inferred_duration_days,
            "reminder_times": normalized_times,
            "total_doses": inferred_total_doses,
        }
        self.col.update_one({"_id": med_doc["_id"]}, {"$set": update_fields})
        med_doc.update(update_fields)
        return med_doc

    def _today_statuses(self, medication_id: str, reminder_times: list[str]) -> dict[str, str]:
        today = now_utc().date().isoformat()
        logs = list(self.logs_col.find({"medication_id": medication_id, "dose_date": today}))

        status_by_time: dict[str, str] = {time_slot: "pending" for time_slot in reminder_times}
        for log in logs:
            slot = log.get("scheduled_time")
            if slot:
                status_by_time[slot] = log.get("status", "pending")

        return status_by_time

    def _update_batch_completion_record(self, patient_id: str, prescription_id: str) -> None:
        if not prescription_id:
            return

        batch_meds = list(self.col.find({"patient_id": patient_id, "prescription_id": prescription_id}))
        if not batch_meds:
            return

        if not all(bool(med.get("completed")) for med in batch_meds):
            return

        existing = self.records_col.find_one({
            "patient_id": patient_id,
            "record_type": "medication_batch_completion",
            "linked_batch_id": prescription_id,
        })
        if existing:
            return

        summary = {
            "source": "medication_tracker",
            "batch_id": prescription_id,
            "medications": [
                {
                    "medicine_name": med.get("medicine_name"),
                    "total_doses": med.get("total_doses", 0),
                    "doses_taken": med.get("doses_taken", 0),
                    "doses_skipped": med.get("doses_skipped", 0),
                    "completed_at": med.get("completed_at"),
                }
                for med in batch_meds
            ],
        }

        self.records_col.insert_one({
            "patient_id": patient_id,
            "record_type": "medication_batch_completion",
            "title": f"Medication Batch Completed ({len(batch_meds)} medicines)",
            "content": json.dumps(summary, ensure_ascii=True),
            "linked_batch_id": prescription_id,
            "created_at": now_utc(),
        })

    def create(self, patient_id: str, payload: dict) -> dict:
        raw_reminder_times = payload.get("reminder_times", []) or []
        times_per_day = self._safe_int(
            payload.get("times_per_day"),
            len(raw_reminder_times) or self._parse_frequency_for_times_per_day(payload.get("frequency", "")),
        )
        if len(raw_reminder_times) > times_per_day:
            times_per_day = len(raw_reminder_times)

        duration_days = self._safe_int(payload.get("duration_days"), 1)
        reminder_times = self._sanitize_reminder_times(raw_reminder_times, times_per_day)
        times_per_day = max(times_per_day, len(reminder_times))
        total_doses = self._safe_int(payload.get("total_doses"), max(1, times_per_day * duration_days))

        start_date = payload.get("start_date") or now_utc()
        if isinstance(start_date, str):
            start_date = datetime.fromisoformat(start_date.replace("Z", "+00:00"))

        end_date = payload.get("end_date")
        if isinstance(end_date, str):
            end_date = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
        if end_date is None:
            end_date = start_date + timedelta(days=max(0, duration_days - 1))

        doc = {
            "patient_id": patient_id,
            "prescription_id": payload.get("prescription_id"),
            "medicine_name": payload["medicine_name"],
            "dosage": payload["dosage"],
            "frequency": payload["frequency"],
            "instructions": payload.get("instructions", ""),
            "start_date": start_date,
            "end_date": end_date,
            "reminder_times": reminder_times,
            "times_per_day": times_per_day,
            "duration_days": duration_days,
            "total_doses": total_doses,
            "doses_taken": 0,
            "doses_skipped": 0,
            "doses_logged": 0,
            "doses_remaining": total_doses,
            "completion_percentage": 0.0,
            "active": True,
            "adherence_rate": 0.0,
            "completed": False,
            "completed_at": None,
            "created_at": now_utc(),
        }
        result = self.col.insert_one(doc)
        created = serialize_doc(self.col.find_one({"_id": result.inserted_id}))
        if created:
            created["today_statuses"] = self._today_statuses(created["id"], created.get("reminder_times", []))
            created["today_pending_times"] = [
                time_slot
                for time_slot, slot_status in created["today_statuses"].items()
                if slot_status == "pending"
            ]
        return created

    def log_dose(self, medication_id: str, patient_id: str, status: str, taken_at=None, scheduled_time: str | None = None) -> dict | None:
        medication_oid = to_object_id(medication_id)
        if not medication_oid:
            return None

        medication = self.col.find_one({"_id": medication_oid, "patient_id": patient_id})
        if not medication:
            return None

        medication = self._backfill_medication_plan_if_needed(medication)

        if medication.get("completed"):
            return None

        logged_at = taken_at or now_utc()
        if isinstance(logged_at, str):
            logged_at = datetime.fromisoformat(logged_at.replace("Z", "+00:00"))

        reminder_times = medication.get("reminder_times", [])
        normalized_time = self._normalize_time(scheduled_time) if scheduled_time else None
        if normalized_time not in reminder_times:
            normalized_time = reminder_times[0] if reminder_times else "08:00"

        dose_date = logged_at.date().isoformat()
        unique_selector = {
            "medication_id": medication_id,
            "patient_id": patient_id,
            "dose_date": dose_date,
            "scheduled_time": normalized_time,
        }

        existing_log = self.logs_col.find_one(unique_selector)
        if existing_log:
            self.logs_col.update_one(
                {"_id": existing_log["_id"]},
                {
                    "$set": {
                        "status": status,
                        "taken_at": logged_at if status in ("taken", "late") else None,
                        "logged_at": now_utc(),
                    }
                },
            )
            log_id = existing_log["_id"]
        else:
            result = self.logs_col.insert_one(
                {
                    **unique_selector,
                    "status": status,
                    "taken_at": logged_at if status in ("taken", "late") else None,
                    "logged_at": now_utc(),
                }
            )
            log_id = result.inserted_id

        self._update_adherence(medication_id)

        updated_med = self.col.find_one({"_id": medication_oid})
        if updated_med and updated_med.get("completed") and updated_med.get("prescription_id"):
            self._update_batch_completion_record(patient_id, updated_med.get("prescription_id"))

        return serialize_doc(self.logs_col.find_one({"_id": log_id}))

    def _update_adherence(self, medication_id: str) -> None:
        medication_oid = to_object_id(medication_id)
        if not medication_oid:
            return

        medication = self.col.find_one({"_id": medication_oid})
        if not medication:
            return

        total_doses = self._safe_int(medication.get("total_doses"), 1)
        logs = list(self.logs_col.find({"medication_id": medication_id}))
        unique_slots = {
            (log.get("dose_date"), log.get("scheduled_time"))
            for log in logs
            if log.get("dose_date") and log.get("scheduled_time")
        }

        doses_logged = min(total_doses, len(unique_slots) if unique_slots else len(logs))
        doses_taken = min(
            total_doses,
            sum(1 for log in logs if log.get("status") in ("taken", "late")),
        )
        doses_skipped = min(
            total_doses,
            sum(1 for log in logs if log.get("status") == "skipped"),
        )

        adherence_rate = (doses_taken / total_doses * 100) if total_doses > 0 else 0.0
        completion_percentage = (doses_logged / total_doses * 100) if total_doses > 0 else 0.0
        doses_remaining = max(total_doses - doses_logged, 0)
        completed = doses_remaining == 0

        update_fields: dict[str, Any] = {
            "doses_taken": doses_taken,
            "doses_skipped": doses_skipped,
            "doses_logged": doses_logged,
            "doses_remaining": doses_remaining,
            "adherence_rate": round(adherence_rate, 1),
            "completion_percentage": round(completion_percentage, 1),
            "completed": completed,
            "active": not completed,
        }

        if completed and not medication.get("completed_at"):
            update_fields["completed_at"] = now_utc()

        self.col.update_one(
            {"_id": medication_oid},
            {"$set": update_fields},
        )

    def list_active(self, patient_id: str) -> list[dict]:
        docs = list(self.col.find({"patient_id": patient_id, "active": True}))
        return serialize_docs(docs)

    def list_all(self, patient_id: str) -> list[dict]:
        docs = list(self.col.find({"patient_id": patient_id}).sort("created_at", DESCENDING))
        for med_doc in docs:
            self._backfill_medication_plan_if_needed(med_doc)
            self._update_adherence(str(med_doc.get("_id")))

        docs = list(self.col.find({"patient_id": patient_id}).sort("created_at", DESCENDING))
        serialized = serialize_docs(docs)
        for med in serialized:
            today_statuses = self._today_statuses(med["id"], med.get("reminder_times", []))
            med["today_statuses"] = today_statuses
            med["today_pending_times"] = [
                time_slot for time_slot, slot_status in today_statuses.items() if slot_status == "pending"
            ]
        return serialized


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
