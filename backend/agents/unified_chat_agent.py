"""
Unified Smart Health Chat Agent
Handles all platform features through conversational interface:
- Symptom analysis & doctor recommendations
- Appointment booking
- Report analysis
- Prescription processing
- Pharmacy ordering
"""
from __future__ import annotations

from typing import TypedDict, Literal
from datetime import datetime, timedelta
import json

from langgraph.graph import END, StateGraph

from app.services.llm_service import llm_service
from agents.base_agent import GraphAgent, TextRetrieval


class UnifiedChatState(TypedDict, total=False):
    user_id: str
    user_role: str
    message: str
    chat_history: list[dict]
    
    # Intent detection
    detected_intent: Literal[
        "symptom_check", "book_appointment", "report_analysis", 
        "prescription_analysis", "pharmacy_order", "general_chat",
        "medication_reminder", "doctor_search"
    ]
    confidence: float
    
    # Context from uploads
    uploaded_image: str  # base64
    uploaded_file_type: str
    extracted_text: str
    
    # Analysis results
    symptom_analysis: dict | None
    report_analysis: dict | None
    prescription_data: dict | None
    doctor_recommendations: list[dict]
    pharmacy_matches: list[dict]
    
    # Actions to perform
    suggested_actions: list[dict]
    
    # Final response
    response: str
    response_type: str
    metadata: dict


class UnifiedSmartChatAgent(GraphAgent):
    """
    Unified chat agent that routes to appropriate handlers based on intent.
    """
    
    def _build_graph(self):
        graph = StateGraph(UnifiedChatState)
        
        # Core flow
        graph.add_node("detect_intent", self._detect_intent)
        graph.add_node("route_handler", self._route_handler)
        
        # Specialized handlers
        graph.add_node("handle_symptom", self._handle_symptom)
        graph.add_node("handle_appointment", self._handle_appointment)
        graph.add_node("handle_report", self._handle_report)
        graph.add_node("handle_prescription", self._handle_prescription)
        graph.add_node("handle_pharmacy", self._handle_pharmacy)
        graph.add_node("handle_general", self._handle_general)
        
        # Response generation
        graph.add_node("generate_response", self._generate_response)
        
        # Flow
        graph.set_entry_point("detect_intent")
        graph.add_edge("detect_intent", "route_handler")
        
        # Conditional routing based on intent
        graph.add_conditional_edges(
            "route_handler",
            self._route_decision,
            {
                "symptom_check": "handle_symptom",
                "book_appointment": "handle_appointment",
                "report_analysis": "handle_report",
                "prescription_analysis": "handle_prescription",
                "pharmacy_order": "handle_pharmacy",
                "general_chat": "handle_general",
                "doctor_search": "handle_appointment",
                "medication_reminder": "handle_prescription",
            }
        )
        
        # All handlers lead to response generation
        for handler in ["handle_symptom", "handle_appointment", "handle_report", 
                       "handle_prescription", "handle_pharmacy", "handle_general"]:
            graph.add_edge(handler, "generate_response")
        
        graph.add_edge("generate_response", END)
        
        return graph.compile()
    
    def _detect_intent(self, state: UnifiedChatState) -> UnifiedChatState:
        """Detect user intent from message and context."""
        message = state.get("message", "").lower()
        has_image = bool(state.get("uploaded_image"))
        file_type = state.get("uploaded_file_type", "")
        
        # Rule-based intent detection with AI fallback
        intent = "general_chat"
        confidence = 0.5
        
        # Symptom keywords
        symptom_keywords = ["symptom", "pain", "fever", "headache", "cough", "sick", "feeling", "hurt", "ache"]
        if any(kw in message for kw in symptom_keywords):
            intent = "symptom_check"
            confidence = 0.8
        
        # Appointment keywords
        appointment_keywords = ["appointment", "book", "schedule", "doctor", "visit", "consultation", "meet"]
        if any(kw in message for kw in appointment_keywords):
            intent = "book_appointment"
            confidence = 0.8
        
        # Report keywords
        report_keywords = ["report", "test result", "lab", "blood test", "scan", "x-ray", "mri"]
        if any(kw in message for kw in report_keywords) or (has_image and "report" in file_type):
            intent = "report_analysis"
            confidence = 0.9
        
        # Prescription keywords
        prescription_keywords = ["prescription", "medicine", "medication", "drug", "pill", "tablet"]
        if any(kw in message for kw in prescription_keywords) or (has_image and "prescription" in file_type):
            intent = "prescription_analysis"
            confidence = 0.9
        
        # Pharmacy keywords
        pharmacy_keywords = ["pharmacy", "order", "buy medicine", "purchase", "delivery"]
        if any(kw in message for kw in pharmacy_keywords):
            intent = "pharmacy_order"
            confidence = 0.8
        
        # Doctor search keywords
        doctor_keywords = ["find doctor", "recommend doctor", "specialist", "cardiologist", "dermatologist"]
        if any(kw in message for kw in doctor_keywords):
            intent = "doctor_search"
            confidence = 0.8
        
        # Use AI for ambiguous cases
        if confidence < 0.7 and llm_service.enabled:
            try:
                prompt = f"""Analyze this user message and determine their intent.
                
Message: {state.get('message', '')}
Has uploaded image: {has_image}
File type: {file_type}

Return JSON with:
{{
    "intent": "symptom_check" | "book_appointment" | "report_analysis" | "prescription_analysis" | "pharmacy_order" | "general_chat" | "doctor_search",
    "confidence": 0.0-1.0,
    "reasoning": "brief explanation"
}}
"""
                result = llm_service.invoke_json(
                    "You are an intent classifier for a health platform.",
                    prompt,
                    {"intent": intent, "confidence": confidence, "reasoning": ""}
                )
                intent = result.get("intent", intent)
                confidence = result.get("confidence", confidence)
            except Exception:
                pass
        
        return {
            "detected_intent": intent,
            "confidence": confidence
        }
    
    def _route_decision(self, state: UnifiedChatState) -> str:
        """Decide which handler to route to."""
        return state.get("detected_intent", "general_chat")
    
    def _route_handler(self, state: UnifiedChatState) -> UnifiedChatState:
        """Prepare for routing - no-op node."""
        return {}
    
    def _handle_symptom(self, state: UnifiedChatState) -> UnifiedChatState:
        """Handle symptom checking and doctor recommendations."""
        message = state.get("message", "")
        
        if not llm_service.enabled:
            return {
                "response_type": "symptom_analysis",
                "suggested_actions": [
                    {"type": "upload_image", "label": "Upload symptom photo"},
                    {"type": "find_doctor", "label": "Find a doctor"}
                ],
                "metadata": {"offline": True}
            }
        
        # Analyze symptoms
        prompt = f"""Analyze these symptoms and provide recommendations:

Symptoms: {message}

Return JSON with:
{{
    "possible_conditions": [
        {{"name": "condition", "probability": "high|medium|low", "description": "brief"}}
    ],
    "severity": "low|moderate|high|critical",
    "recommended_specialists": ["specialty1", "specialty2"],
    "next_steps": ["step1", "step2"],
    "red_flags": ["flag1", "flag2"],
    "home_care": ["tip1", "tip2"]
}}
"""
        
        try:
            analysis = llm_service.invoke_json(
                "You are a medical triage AI. Be conservative and always recommend professional consultation.",
                prompt,
                {
                    "possible_conditions": [],
                    "severity": "moderate",
                    "recommended_specialists": ["General Physician"],
                    "next_steps": ["Consult a doctor"],
                    "red_flags": [],
                    "home_care": []
                }
            )
            
            # Generate suggested actions
            actions = [
                {"type": "book_appointment", "label": "Book appointment with recommended doctor", "data": {"specialists": analysis.get("recommended_specialists", [])}},
                {"type": "upload_image", "label": "Upload symptom photo for better analysis"},
            ]
            
            if analysis.get("severity") in ["high", "critical"]:
                actions.insert(0, {"type": "emergency", "label": "⚠️ Seek immediate medical attention", "urgent": True})
            
            return {
                "symptom_analysis": analysis,
                "response_type": "symptom_analysis",
                "suggested_actions": actions,
                "doctor_recommendations": analysis.get("recommended_specialists", []),
                "metadata": {"severity": analysis.get("severity")}
            }
        except Exception as e:
            return {
                "response_type": "error",
                "metadata": {"error": str(e)}
            }
    
    def _handle_appointment(self, state: UnifiedChatState) -> UnifiedChatState:
        """Handle appointment booking requests."""
        message = state.get("message", "")
        specialists = state.get("doctor_recommendations", [])
        
        # Extract appointment preferences
        actions = [
            {"type": "search_doctors", "label": "Search for doctors", "data": {"specialists": specialists}},
            {"type": "view_calendar", "label": "View available slots"},
        ]
        
        return {
            "response_type": "appointment_booking",
            "suggested_actions": actions,
            "metadata": {"specialists": specialists}
        }
    
    def _handle_report(self, state: UnifiedChatState) -> UnifiedChatState:
        """Handle medical report analysis."""
        extracted_text = state.get("extracted_text", "")
        message = state.get("message", "")
        
        if not extracted_text and not message:
            return {
                "response_type": "report_analysis",
                "suggested_actions": [
                    {"type": "upload_report", "label": "Upload medical report"}
                ],
                "metadata": {"needs_upload": True}
            }
        
        if not llm_service.enabled:
            return {
                "response_type": "report_analysis",
                "metadata": {"offline": True}
            }
        
        # Analyze report
        prompt = f"""Analyze this medical report and provide insights:

Report: {extracted_text or message}

Return JSON with:
{{
    "summary": "plain language summary",
    "abnormal_values": [
        {{"parameter": "name", "value": "X", "normal_range": "Y-Z", "status": "high|low|critical"}}
    ],
    "risk_factors": ["risk1", "risk2"],
    "recommended_specialists": ["specialty1"],
    "follow_up_actions": ["action1", "action2"],
    "urgency": "routine|soon|urgent|emergency"
}}
"""
        
        try:
            analysis = llm_service.invoke_json(
                "You are a medical report interpreter. Explain findings clearly and recommend appropriate specialists.",
                prompt,
                {
                    "summary": "Report received",
                    "abnormal_values": [],
                    "risk_factors": [],
                    "recommended_specialists": [],
                    "follow_up_actions": ["Consult your doctor"],
                    "urgency": "routine"
                }
            )
            
            actions = [
                {"type": "book_appointment", "label": "Book appointment with specialist", "data": {"specialists": analysis.get("recommended_specialists", [])}},
                {"type": "save_report", "label": "Save to medical records"},
            ]
            
            return {
                "report_analysis": analysis,
                "response_type": "report_analysis",
                "suggested_actions": actions,
                "doctor_recommendations": analysis.get("recommended_specialists", []),
                "metadata": {"urgency": analysis.get("urgency")}
            }
        except Exception as e:
            return {
                "response_type": "error",
                "metadata": {"error": str(e)}
            }
    
    def _handle_prescription(self, state: UnifiedChatState) -> UnifiedChatState:
        """Handle prescription analysis and medication reminders."""
        extracted_text = state.get("extracted_text", "")
        message = state.get("message", "")
        
        if not extracted_text and not message:
            return {
                "response_type": "prescription_analysis",
                "suggested_actions": [
                    {"type": "upload_prescription", "label": "Upload prescription"}
                ],
                "metadata": {"needs_upload": True}
            }
        
        if not llm_service.enabled:
            return {
                "response_type": "prescription_analysis",
                "metadata": {"offline": True}
            }
        
        # Extract prescription data
        prompt = f"""Extract medicine information from this prescription:

Prescription: {extracted_text or message}

Return JSON with:
{{
    "medicines": [
        {{
            "name": "medicine name",
            "dosage": "500mg",
            "frequency": "twice daily",
            "duration": "7 days",
            "timing": ["08:00", "20:00"],
            "instructions": "after meals"
        }}
    ],
    "total_medicines": 0,
    "schedule_summary": "brief summary"
}}
"""
        
        try:
            analysis = llm_service.invoke_json(
                "You are a clinical pharmacist. Extract prescription details accurately.",
                prompt,
                {
                    "medicines": [],
                    "total_medicines": 0,
                    "schedule_summary": "Unable to extract prescription details"
                }
            )
            
            actions = [
                {"type": "add_reminders", "label": "Add medication reminders", "data": {"medicines": analysis.get("medicines", [])}},
                {"type": "order_pharmacy", "label": "Order from pharmacy", "data": {"medicines": analysis.get("medicines", [])}},
                {"type": "save_prescription", "label": "Save prescription"},
            ]
            
            return {
                "prescription_data": analysis,
                "response_type": "prescription_analysis",
                "suggested_actions": actions,
                "metadata": {"medicine_count": analysis.get("total_medicines", 0)}
            }
        except Exception as e:
            return {
                "response_type": "error",
                "metadata": {"error": str(e)}
            }
    
    def _handle_pharmacy(self, state: UnifiedChatState) -> UnifiedChatState:
        """Handle pharmacy ordering."""
        prescription_data = state.get("prescription_data")
        
        if not prescription_data:
            return {
                "response_type": "pharmacy_order",
                "suggested_actions": [
                    {"type": "upload_prescription", "label": "Upload prescription first"}
                ],
                "metadata": {"needs_prescription": True}
            }
        
        actions = [
            {"type": "find_pharmacies", "label": "Find nearby pharmacies", "data": {"medicines": prescription_data.get("medicines", [])}},
            {"type": "compare_prices", "label": "Compare prices"},
        ]
        
        return {
            "response_type": "pharmacy_order",
            "suggested_actions": actions,
            "metadata": {"has_prescription": True}
        }
    
    def _handle_general(self, state: UnifiedChatState) -> UnifiedChatState:
        """Handle general health questions."""
        message = state.get("message", "")
        chat_history = state.get("chat_history", [])
        
        if not llm_service.enabled:
            return {
                "response_type": "general",
                "metadata": {"offline": True}
            }
        
        # Build context from history
        history_text = "\n".join([
            f"{m.get('role', 'user').upper()}: {m.get('content', '')}"
            for m in chat_history[-6:]
        ])
        
        prompt = f"""Answer this health question conversationally:

Chat History:
{history_text}

Current Question: {message}

Provide a helpful, accurate response. Recommend consulting healthcare professionals when appropriate.
"""
        
        try:
            response = llm_service.invoke(
                "You are a knowledgeable health assistant. Be helpful, accurate, and recommend professional consultation when needed.",
                prompt
            )
            
            return {
                "response_type": "general",
                "suggested_actions": [
                    {"type": "symptom_check", "label": "Check symptoms"},
                    {"type": "book_appointment", "label": "Book appointment"},
                    {"type": "upload_report", "label": "Analyze medical report"},
                ],
                "metadata": {"conversational": True}
            }
        except Exception as e:
            return {
                "response_type": "error",
                "metadata": {"error": str(e)}
            }
    
    def _generate_response(self, state: UnifiedChatState) -> UnifiedChatState:
        """Generate final conversational response."""
        response_type = state.get("response_type", "general")
        
        # Build response based on type
        if response_type == "symptom_analysis":
            analysis = state.get("symptom_analysis", {})
            conditions = analysis.get("possible_conditions", [])
            severity = analysis.get("severity", "moderate")
            specialists = analysis.get("recommended_specialists", [])
            
            response = f"Based on your symptoms, here's what I found:\n\n"
            
            if conditions:
                response += "**Possible Conditions:**\n"
                for cond in conditions[:3]:
                    response += f"• {cond.get('name')} ({cond.get('probability')} probability): {cond.get('description', '')}\n"
                response += "\n"
            
            response += f"**Severity:** {severity.capitalize()}\n\n"
            
            if specialists:
                response += f"**Recommended Specialists:** {', '.join(specialists)}\n\n"
            
            next_steps = analysis.get("next_steps", [])
            if next_steps:
                response += "**Next Steps:**\n"
                for step in next_steps:
                    response += f"• {step}\n"
            
            response += "\n⚠️ This is an AI analysis. Please consult a healthcare professional for proper diagnosis."
        
        elif response_type == "report_analysis":
            analysis = state.get("report_analysis", {})
            summary = analysis.get("summary", "")
            abnormal = analysis.get("abnormal_values", [])
            urgency = analysis.get("urgency", "routine")
            
            response = f"**Report Analysis:**\n\n{summary}\n\n"
            
            if abnormal:
                response += "**Abnormal Values:**\n"
                for val in abnormal:
                    response += f"• {val.get('parameter')}: {val.get('value')} (Normal: {val.get('normal_range')}) - {val.get('status').upper()}\n"
                response += "\n"
            
            response += f"**Urgency:** {urgency.capitalize()}\n\n"
            
            follow_up = analysis.get("follow_up_actions", [])
            if follow_up:
                response += "**Recommended Actions:**\n"
                for action in follow_up:
                    response += f"• {action}\n"
        
        elif response_type == "prescription_analysis":
            analysis = state.get("prescription_data", {})
            medicines = analysis.get("medicines", [])
            
            response = f"**Prescription Extracted:**\n\n"
            response += f"I found {len(medicines)} medicine(s) in your prescription:\n\n"
            
            for med in medicines:
                response += f"**{med.get('name')}**\n"
                response += f"• Dosage: {med.get('dosage')}\n"
                response += f"• Frequency: {med.get('frequency')}\n"
                response += f"• Duration: {med.get('duration')}\n"
                if med.get('instructions'):
                    response += f"• Instructions: {med.get('instructions')}\n"
                response += "\n"
            
            response += "I can help you set up medication reminders or order these from a pharmacy."
        
        elif response_type == "appointment_booking":
            specialists = state.get("metadata", {}).get("specialists", [])
            response = "I can help you book an appointment.\n\n"
            if specialists:
                response += f"Based on your needs, I recommend consulting: {', '.join(specialists)}\n\n"
            response += "Would you like me to search for available doctors?"
        
        elif response_type == "pharmacy_order":
            response = "I can help you order medicines from nearby pharmacies.\n\n"
            response += "I'll find pharmacies that have your medicines in stock and compare prices for you."
        
        elif response_type == "error":
            error = state.get("metadata", {}).get("error", "")
            response = f"I encountered an issue: {error}\n\nPlease try again or rephrase your question."
        
        else:
            # General response already generated by handler
            response = state.get("response", "How can I help you with your health today?")
        
        return {"response": response}


# Export
UnifiedChatAgent = UnifiedSmartChatAgent
