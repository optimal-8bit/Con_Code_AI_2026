import os
import sys
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# Allow running this file directly: python3 main.py
BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

from app.api.auth_routes import auth_router
from app.api.patient_routes import patient_router
from app.api.doctor_routes import doctor_router
from app.api.pharmacy_routes import pharmacy_router
from app.api.ai_routes import ai_router
from app.api.admin_routes import admin_router
from app.core.config import settings
from app.db.mongo import mongo_service
from app.services.llm_service import llm_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    description="NextGen Health - AI-Driven Healthcare Platform API",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(patient_router, prefix="/api/v1/patient", tags=["Patient"])
app.include_router(doctor_router, prefix="/api/v1/doctor", tags=["Doctor"])
app.include_router(pharmacy_router, prefix="/api/v1/pharmacy", tags=["Pharmacy"])
app.include_router(ai_router, prefix="/api/v1/ai", tags=["AI Features"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["Admin"])

STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
UPLOADS_DIR = os.path.join(BACKEND_ROOT, "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(STATIC_DIR, exist_ok=True)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

WEB_DIR = os.path.join(BACKEND_ROOT, "web")
if os.path.isdir(WEB_DIR):
    app.mount("/web", StaticFiles(directory=WEB_DIR, html=True), name="web")


@app.get("/")
def ui() -> FileResponse:
    index = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index):
        return FileResponse(index)
    return FileResponse(index)


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "mongodb": mongo_service.ping(),
        "llm_configured": llm_service.enabled,
        "version": settings.api_version,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
