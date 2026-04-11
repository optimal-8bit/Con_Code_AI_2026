"""
Enhanced LLM Service with multimodal support (text + image) via Gemini.
"""
from __future__ import annotations

import base64
import json
import logging
from typing import Any

import google.generativeai as genai
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from app.core.config import settings

logger = logging.getLogger(__name__)


class LLMService:
    def __init__(self) -> None:
        self._enabled = bool(settings.gemini_api_key)
        self._llm: ChatGoogleGenerativeAI | None = None
        self._vision_llm: ChatGoogleGenerativeAI | None = None
        
        if self._enabled:
            # Configure google-generativeai SDK
            genai.configure(api_key=settings.gemini_api_key)
            
            # Text LLM
            self._llm = ChatGoogleGenerativeAI(
                model=settings.gemini_model,
                temperature=0.2,
                google_api_key=settings.gemini_api_key,
                convert_system_message_to_human=False,
            )
            # Vision LLM (same model, different config for vision tasks)
            self._vision_llm = ChatGoogleGenerativeAI(
                model=settings.gemini_vision_model,
                temperature=0.1,
                google_api_key=settings.gemini_api_key,
            )

    @property
    def enabled(self) -> bool:
        return self._enabled

    def invoke(self, system_prompt: str, user_prompt: str) -> str:
        if not self._llm:
            raise RuntimeError("LLM is not configured. Set GEMINI_API_KEY.")
        try:
            response = self._llm.invoke(
                [
                    SystemMessage(content=system_prompt),
                    HumanMessage(content=user_prompt),
                ]
            )
            return response.content if isinstance(response.content, str) else str(response.content)
        except Exception as exc:
            logger.error("LLM invocation error: %s", exc)
            raise

    def invoke_with_image(self, system_prompt: str, user_prompt: str, image_base64: str, mime_type: str = "image/jpeg") -> str:
        """Invoke LLM with an image for multimodal analysis."""
        if not self._vision_llm:
            raise RuntimeError("Vision LLM is not configured.")
        
        try:
            message = HumanMessage(
                content=[
                    {"type": "text", "text": f"{system_prompt}\n\n{user_prompt}"},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{mime_type};base64,{image_base64}"},
                    },
                ]
            )
            response = self._vision_llm.invoke([message])
            return response.content if isinstance(response.content, str) else str(response.content)
        except Exception as exc:
            logger.error("Vision LLM invocation error: %s", exc)
            raise

    def invoke_json(
        self,
        system_prompt: str,
        user_prompt: str,
        fallback: dict[str, Any],
        image_base64: str = "",
        mime_type: str = "image/jpeg",
    ) -> dict[str, Any]:
        if not self.enabled:
            return fallback

        try:
            if image_base64:
                raw = self.invoke_with_image(
                    system_prompt,
                    user_prompt + "\n\nReturn ONLY strict JSON without any markdown fences or extra text.",
                    image_base64,
                    mime_type,
                )
            else:
                raw = self.invoke(
                    system_prompt,
                    user_prompt + "\n\nReturn ONLY strict JSON without any markdown fences or extra text.",
                )
        except Exception as exc:
            logger.warning("LLM invocation failed; returning fallback: %s", exc)
            return fallback

        return self._parse_json(raw, fallback)

    def invoke_stream(self, system_prompt: str, user_prompt: str):
        """Generator that yields streaming tokens."""
        if not self._llm:
            yield "LLM not configured."
            return
        try:
            for chunk in self._llm.stream(
                [
                    SystemMessage(content=system_prompt),
                    HumanMessage(content=user_prompt),
                ]
            ):
                if chunk.content:
                    yield chunk.content
        except Exception as exc:
            logger.error("LLM streaming error: %s", exc)
            yield f"\n[Error: {exc}]"

    def _parse_json(self, raw: str, fallback: dict[str, Any]) -> dict[str, Any]:
        # Clean up common LLM JSON issues
        raw = raw.strip()
        if raw.startswith("```"):
            lines = raw.split("\n")
            raw = "\n".join(lines[1:-1]) if len(lines) > 2 else raw
        
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            start = raw.find("{")
            end = raw.rfind("}")
            if start != -1 and end != -1 and end > start:
                try:
                    return json.loads(raw[start: end + 1])
                except json.JSONDecodeError:
                    return fallback
            return fallback


llm_service = LLMService()
