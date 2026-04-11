from __future__ import annotations

from datetime import datetime, timezone
from typing import Any


def build_api_response(*, status: str, data: dict[str, Any], message: str | None = None) -> dict[str, Any]:
    return {
        "status": status,
        "data": data,
        "message": message,
    }


def utc_now_iso() -> str:
    return datetime.now(tz=timezone.utc).isoformat()


def compact_text(value: str) -> str:
    return " ".join(value.split()).strip()
