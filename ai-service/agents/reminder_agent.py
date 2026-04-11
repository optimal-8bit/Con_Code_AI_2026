from __future__ import annotations

from typing import Any


def _fallback_timings(index: int) -> list[str]:
    defaults = {
        1: ["09:00"],
        2: ["09:00", "21:00"],
        3: ["08:00", "14:00", "20:00"],
    }
    return defaults.get(index, ["09:00"])


def generate_reminder_schedule(medicines: list[dict[str, Any]], timezone: str = "UTC") -> dict[str, Any]:
    schedule: list[dict[str, Any]] = []

    for medicine in medicines:
        medicine_name = str(medicine.get("medicine_name", "")).strip()
        dosage = str(medicine.get("dosage", "")).strip()
        instructions = str(medicine.get("instructions", "")).strip()
        timings = medicine.get("timings") or []

        if not isinstance(timings, list):
            timings = []

        normalized_timings = [str(t).strip() for t in timings if str(t).strip()]
        if not normalized_timings:
            normalized_timings = _fallback_timings(1)

        for time_value in normalized_timings:
            schedule.append(
                {
                    "medicine_name": medicine_name,
                    "dosage": dosage,
                    "time": time_value,
                    "instructions": instructions,
                    "timezone": timezone,
                }
            )

    return {
        "total_reminders": len(schedule),
        "schedule": schedule,
    }
