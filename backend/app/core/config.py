import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv


BACKEND_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(BACKEND_ROOT / ".env")


@dataclass
class Settings:
    api_title: str = "NextGen Health API"
    api_version: str = "2.0.0"
    
    # AI
    gemini_api_key: str | None = os.getenv("GEMINI_API_KEY")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    gemini_vision_model: str = os.getenv("GEMINI_VISION_MODEL", "gemini-2.0-flash")
    
    # Database
    mongodb_uri: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    mongodb_db_name: str = os.getenv("MONGODB_DB_NAME", "nextgen_health")
    
    # JWT Auth
    jwt_secret: str = os.getenv("JWT_SECRET", "nextgen-health-super-secret-key-change-in-production-2026")
    jwt_algorithm: str = "HS256"
    jwt_access_expire_minutes: int = int(os.getenv("JWT_ACCESS_EXPIRE_MINUTES", "60"))
    jwt_refresh_expire_days: int = int(os.getenv("JWT_REFRESH_EXPIRE_DAYS", "30"))
    
    # CORS
    cors_origins: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:5500,http://127.0.0.1:5500,http://localhost:8000,http://127.0.0.1:8000,http://localhost:3000",
    )
    
    # File Upload
    max_upload_size_mb: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))
    upload_dir: str = str(BACKEND_ROOT / "uploads")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024


settings = Settings()
