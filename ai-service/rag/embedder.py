from __future__ import annotations

from langchain_google_genai import GoogleGenerativeAIEmbeddings
from config.settings import get_google_api_key, get_settings


def get_embeddings() -> GoogleGenerativeAIEmbeddings:
    settings = get_settings()
    api_key = get_google_api_key()

    return GoogleGenerativeAIEmbeddings(
        model=settings.embedding_model,
        google_api_key=api_key,
    )
