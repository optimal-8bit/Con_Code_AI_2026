from __future__ import annotations

import os
from functools import lru_cache
from typing import Any

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Healthcare AI Service"
    app_version: str = "1.0.0"
    api_prefix: str = "/api"

    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
    )
    cors_origin_regex: str | None = r"^https://.*\.vercel\.app$"

    llm_model: str = "gemini-pro"
    embedding_model: str = "models/embedding-001"

    google_api_key: str | None = None
    mongo_uri: str | None = None
    mongo_db_name: str = "healthcare_ai"

    temperature: float = 0.3
    llm_max_retries: int = 1

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def parsed_cors_origins(self) -> list[str]:
        if not self.cors_origins:
            return []
        if isinstance(self.cors_origins, list):
            return self.cors_origins
        return []


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


def get_google_api_key() -> str:
    value = (os.getenv("GOOGLE_API_KEY") or "").strip()
    if not value:
        value = (get_settings().google_api_key or "").strip()
    if not value:
        raise ValueError("Missing required environment variable: GOOGLE_API_KEY")
    return value


def get_mongo_uri() -> str:
    value = (os.getenv("MONGO_URI") or "").strip()
    if not value:
        value = (get_settings().mongo_uri or "").strip()
    if not value:
        raise ValueError("Missing required environment variable: MONGO_URI")
    return value


def validate_gemini_initialization() -> None:
    from langchain_google_genai import (
        ChatGoogleGenerativeAI,
        GoogleGenerativeAIEmbeddings,
    )

    settings = get_settings()
    api_key = get_google_api_key()

    ChatGoogleGenerativeAI(
        model=settings.llm_model,
        google_api_key=api_key,
        temperature=settings.temperature,
        max_retries=settings.llm_max_retries,
    )
    GoogleGenerativeAIEmbeddings(
        model=settings.embedding_model,
        google_api_key=api_key,
    )


def get_chat_model(*, temperature: float | None = None) -> Any:
    from langchain_google_genai import ChatGoogleGenerativeAI

    settings = get_settings()
    model_temperature = settings.temperature if temperature is None else temperature
    api_key = get_google_api_key()

    return ChatGoogleGenerativeAI(
        model=settings.llm_model,
        google_api_key=api_key,
        temperature=model_temperature,
        max_retries=settings.llm_max_retries,
    )
