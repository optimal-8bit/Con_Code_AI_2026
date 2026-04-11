"""
Smart Chat Orchestrator Service
Routes user requests to appropriate agents without modifying existing agent logic.
"""
from __future__ import annotations

import logging
from typing import Any, Literal

from app.services.llm_service import llm_service

logger = logging.getLogger(__name__)


class ChatOrchestratorService:
    """
    Central orchestrator that routes chat requests to appropriate agents.
    Does NOT modify existing agent logic - only routes to them.
    """
    
    def __init__(self):
        self.llm = llm_service
    
    async def process_chat_request(
        self,
        user_message: str,
        file_data: dict[str, Any] | None = None,
        upload_intent: Literal["symptom", "prescription", "report", "none"] = "none",
        chat_history: list[dict] = None,
        user_id: str = None,
    ) -> dict[str, Any]:
        """
        Main orchestration method.
        
        Args:
            user_message: Text input from user
            file_data: Optional file with base64 data and mime type
            upload_intent: Explicit intent from which upload button was used
            chat_history: Previous conversation context
            user_id: Current user ID
            
        Returns:
            Structured response with answer, agent_used, and metadata
        """
        chat_history = chat_history or []
        
        # Determine routing based on explicit intent
        agent_type = self._determine_agent(user_message, file_data, upload_intent)
        
        logger.info(f"Routing to agent: {agent_type}, upload_intent: {upload_intent}")
        
        # Route to appropriate handler
        if agent_type == "symptom":
            return await self._route_to_symptom_agent(user_message, file_data, chat_history)
        elif agent_type == "prescription":
            return await self._route_to_prescription_agent(user_message, file_data, chat_history)
        elif agent_type == "report":
            return await self._route_to_report_agent(user_message, file_data, chat_history)
        else:
            # Default fallback - general health chat
            return await self._route_to_general_chat(user_message, chat_history)
    
    def _determine_agent(
        self,
        message: str,
        file_data: dict | None,
        upload_intent: str,
    ) -> str:
        """
        Determine which agent to route to based on explicit button context.
        
        Rules:
        1. If upload_intent is set (button was used), use that explicitly
        2. If no explicit intent, default to symptom checker (as per requirements)
        3. General chat is only used for edge cases
        """
        # Explicit intent from upload buttons takes precedence
        if upload_intent == "symptom":
            return "symptom"
        elif upload_intent == "prescription":
            return "prescription"
        elif upload_intent == "report":
            return "report"
        
        # Default behavior: route to symptom checker
        # This handles both text-only and file uploads without explicit intent
        return "symptom"
    
    async def _route_to_symptom_agent(
        self,
        message: str,
        file_data: dict | None,
        chat_history: list[dict],
    ) -> dict[str, Any]:
        """Route to symptom checker agent (existing logic)."""
        # Build context from chat history
        history_context = self._build_history_context(chat_history)
        
        # Prepare prompt for symptom analysis
        system_prompt = (
            "You are an expert medical triage AI assistant. Analyze symptoms from user input "
            "(text and/or images) to provide a comprehensive, safe assessment. "
            "Be conservative and always recommend professional consultation when appropriate."
        )
        
        user_prompt = f"{history_context}\n\nCurrent Input: {message}\n\n"
        
        if file_data:
            user_prompt += "**Note: User has uploaded an image showing symptoms or health concerns. Analyze the image carefully.**\n\n"
        
        user_prompt += (
            "Provide a detailed response covering:\n"
            "1. Possible conditions or concerns\n"
            "2. Severity assessment\n"
            "3. Recommended next steps\n"
            "4. When to seek immediate medical attention\n"
            "5. Home care tips if applicable\n\n"
            "Always include appropriate medical disclaimers."
        )
        
        # Call LLM with or without image
        if file_data and file_data.get("base64"):
            response = self.llm.invoke_with_image(
                system_prompt,
                user_prompt,
                file_data["base64"],
                file_data.get("mime_type", "image/jpeg"),
            )
        else:
            response = self.llm.invoke(system_prompt, user_prompt)
        
        return {
            "answer": response,
            "agent_used": "symptom_checker",
            "supports_actions": True,
            "suggested_actions": [
                {"label": "Book Doctor Appointment", "action": "book_appointment"},
                {"label": "View Symptom History", "action": "view_history"},
            ],
            "disclaimer": "⚠️ This AI analysis is for informational purposes only and does not constitute medical advice. Always consult a qualified healthcare professional.",
        }
    
    async def _route_to_prescription_agent(
        self,
        message: str,
        file_data: dict | None,
        chat_history: list[dict],
    ) -> dict[str, Any]:
        """Route to prescription analyzer agent (existing logic)."""
        history_context = self._build_history_context(chat_history)
        
        system_prompt = (
            "You are a clinical pharmacist AI. Extract prescription data from images or text, "
            "explain medicines in simple language, and warn about interactions. "
            "Be thorough but patient-friendly."
        )
        
        user_prompt = f"{history_context}\n\nCurrent Input: {message}\n\n"
        
        if file_data:
            user_prompt += "**Note: User has uploaded a prescription image. Extract all medicine names, dosages, frequencies, and instructions.**\n\n"
        
        user_prompt += (
            "Provide a detailed analysis covering:\n"
            "1. List of all medicines with dosages and instructions\n"
            "2. How to take each medicine (timing, with/without food, etc.)\n"
            "3. Potential side effects to watch for\n"
            "4. Drug interactions if multiple medicines\n"
            "5. Storage instructions\n"
            "6. Important warnings or precautions"
        )
        
        if file_data and file_data.get("base64"):
            response = self.llm.invoke_with_image(
                system_prompt,
                user_prompt,
                file_data["base64"],
                file_data.get("mime_type", "image/jpeg"),
            )
        else:
            response = self.llm.invoke(system_prompt, user_prompt)
        
        return {
            "answer": response,
            "agent_used": "prescription_analyzer",
            "supports_actions": True,
            "suggested_actions": [
                {"label": "Set Medication Reminders", "action": "set_reminders"},
                {"label": "Find Nearby Pharmacy", "action": "find_pharmacy"},
                {"label": "Order Medicines", "action": "order_medicines"},
            ],
            "disclaimer": None,
        }
    
    async def _route_to_report_agent(
        self,
        message: str,
        file_data: dict | None,
        chat_history: list[dict],
    ) -> dict[str, Any]:
        """Route to medical report explainer agent (existing logic)."""
        history_context = self._build_history_context(chat_history)
        
        system_prompt = (
            "You are an expert medical report interpreter. Explain all parameters in plain language, "
            "highlight abnormalities, and provide actionable, safe recommendations. "
            "Make complex medical data understandable for patients."
        )
        
        user_prompt = f"{history_context}\n\nCurrent Input: {message}\n\n"
        
        if file_data:
            user_prompt += "**Note: User has uploaded a medical report. Read and extract all test parameters, values, and findings.**\n\n"
        
        user_prompt += (
            "Provide a comprehensive analysis covering:\n"
            "1. Plain language summary of the report\n"
            "2. Explanation of each parameter and what it means\n"
            "3. Which values are normal, high, or low\n"
            "4. What abnormalities might indicate\n"
            "5. Lifestyle recommendations based on results\n"
            "6. Whether follow-up tests are needed\n"
            "7. Urgency level (routine, soon, urgent, emergency)"
        )
        
        if file_data and file_data.get("base64"):
            response = self.llm.invoke_with_image(
                system_prompt,
                user_prompt,
                file_data["base64"],
                file_data.get("mime_type", "image/jpeg"),
            )
        else:
            response = self.llm.invoke(system_prompt, user_prompt)
        
        return {
            "answer": response,
            "agent_used": "report_explainer",
            "supports_actions": True,
            "suggested_actions": [
                {"label": "Book Follow-up Appointment", "action": "book_appointment"},
                {"label": "Save to Medical Records", "action": "save_record"},
                {"label": "Share with Doctor", "action": "share_doctor"},
            ],
            "disclaimer": "⚠️ This analysis is for informational purposes. Please discuss results with your healthcare provider.",
        }
    
    async def _route_to_general_chat(
        self,
        message: str,
        chat_history: list[dict],
    ) -> dict[str, Any]:
        """Handle general health questions without specific agent routing."""
        history_context = self._build_history_context(chat_history)
        
        system_prompt = (
            "You are NextGen Health's Smart Health Assistant — an empathetic, knowledgeable AI that helps "
            "patients understand medical information. Provide clear, accurate, and appropriately detailed responses. "
            "Always recommend consulting a healthcare professional for critical decisions."
        )
        
        user_prompt = f"{history_context}\n\nCurrent Question: {message}\n\n"
        user_prompt += "Provide a helpful, accurate response. Include follow-up suggestions if relevant."
        
        response = self.llm.invoke(system_prompt, user_prompt)
        
        return {
            "answer": response,
            "agent_used": "general_chat",
            "supports_actions": False,
            "suggested_actions": [],
            "disclaimer": "⚠️ This information is for educational purposes. Always consult a qualified healthcare professional for medical advice.",
        }
    
    def _build_history_context(self, chat_history: list[dict]) -> str:
        """Build context string from chat history."""
        if not chat_history:
            return ""
        
        # Take last 6 messages for context
        recent = chat_history[-6:]
        context_lines = []
        
        for msg in recent:
            role = msg.get("role", "user").upper()
            content = msg.get("content", "")
            context_lines.append(f"{role}: {content}")
        
        return "Previous Conversation:\n" + "\n".join(context_lines) if context_lines else ""


# Singleton instance
chat_orchestrator = ChatOrchestratorService()
