"""
Intelligent Smart Chat Service
Integrates with real database for doctor recommendations, medicine matching, appointments, etc.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any

from app.services.data_service import (
    user_service,
    appointment_service,
    prescription_service,
    medical_record_service,
    medication_service,
    inventory_service,
    doctor_availability_service,
)
from app.services.llm_service import llm_service

logger = logging.getLogger(__name__)


class SmartChatService:
    """
    Intelligent chat service that integrates with real database.
    Provides context-aware responses with actual data.
    """
    
    def __init__(self):
        self.llm = llm_service
    
    def detect_intent(self, message: str, has_file: bool = False) -> tuple[str, float]:
        """
        Detect user intent from message.
        Returns: (intent, confidence)
        """
        message_lower = message.lower()
        
        # Symptom keywords
        symptom_keywords = [
            "symptom", "pain", "fever", "headache", "cough", "sick", "feeling", 
            "hurt", "ache", "dizzy", "nausea", "vomit", "tired", "weak", "sore",
            "cold", "flu", "stomach", "chest", "back", "joint", "muscle"
        ]
        
        # Appointment keywords
        appointment_keywords = [
            "appointment", "book", "schedule", "doctor", "visit", "consultation",
            "meet", "see doctor", "available", "slot", "time", "date"
        ]
        
        # Report keywords
        report_keywords = [
            "report", "test result", "lab", "blood test", "scan", "x-ray", "mri",
            "ct scan", "ultrasound", "analysis", "result", "finding"
        ]
        
        # Prescription keywords
        prescription_keywords = [
            "prescription", "medicine", "medication", "drug", "pill", "tablet",
            "dose", "dosage", "take medicine", "my medicines"
        ]
        
        # Pharmacy keywords
        pharmacy_keywords = [
            "pharmacy", "order", "buy medicine", "purchase", "delivery",
            "price", "cost", "available", "stock"
        ]
        
        # Doctor search keywords
        doctor_keywords = [
            "find doctor", "recommend doctor", "specialist", "cardiologist",
            "dermatologist", "neurologist", "orthopedic", "gynecologist",
            "pediatrician", "psychiatrist", "dentist"
        ]
        
        # Count matches
        symptom_count = sum(1 for kw in symptom_keywords if kw in message_lower)
        appointment_count = sum(1 for kw in appointment_keywords if kw in message_lower)
        report_count = sum(1 for kw in report_keywords if kw in message_lower)
        prescription_count = sum(1 for kw in prescription_keywords if kw in message_lower)
        pharmacy_count = sum(1 for kw in pharmacy_keywords if kw in message_lower)
        doctor_count = sum(1 for kw in doctor_keywords if kw in message_lower)
        
        # File-based detection
        if has_file:
            if prescription_count > 0 or "prescription" in message_lower:
                return ("prescription_analysis", 0.95)
            elif report_count > 0 or "report" in message_lower:
                return ("report_analysis", 0.95)
            else:
                return ("symptom_check", 0.85)
        
        # Determine intent based on keyword counts
        counts = {
            "symptom_check": symptom_count,
            "appointment_booking": appointment_count + doctor_count,
            "report_analysis": report_count,
            "prescription_analysis": prescription_count,
            "pharmacy_order": pharmacy_count,
        }
        
        max_intent = max(counts, key=counts.get)
        max_count = counts[max_intent]
        
        if max_count == 0:
            return ("general_chat", 0.5)
        
        confidence = min(0.6 + (max_count * 0.15), 0.95)
        return (max_intent, confidence)
    
    def find_matching_doctors(
        self, 
        symptoms: list[str] = None,
        specialty: str = None,
        location: str = None,
        limit: int = 5
    ) -> list[dict]:
        """
        Find doctors based on symptoms, specialty, or location.
        Returns real doctors from database with availability.
        """
        filters = {}
        
        # Specialty mapping from symptoms
        if symptoms and not specialty:
            specialty = self._map_symptoms_to_specialty(symptoms)
        
        if specialty:
            filters["profile.specialty"] = {"$regex": specialty, "$options": "i"}
        
        if location:
            filters["profile.city"] = {"$regex": location, "$options": "i"}
        
        # Get doctors from database
        doctors = user_service.list_by_role("doctor", filters, limit=limit)
        
        # Enrich with availability and ratings
        enriched_doctors = []
        for doctor in doctors:
            # Get upcoming availability
            today = datetime.now().date()
            available_dates = []
            for i in range(7):  # Check next 7 days
                check_date = (today + timedelta(days=i)).isoformat()
                slots = doctor_availability_service.get_available_slots(doctor["id"], check_date)
                if slots:
                    available_dates.append({
                        "date": check_date,
                        "slots": slots[:3]  # First 3 slots
                    })
            
            # Get appointment count (as proxy for experience)
            appointments = appointment_service.list_for_doctor(doctor["id"], limit=100)
            completed = len([a for a in appointments if a.get("status") == "completed"])
            
            enriched_doctors.append({
                "id": doctor["id"],
                "name": doctor.get("name", "Dr. Unknown"),
                "email": doctor.get("email", ""),
                "phone": doctor.get("phone", ""),
                "specialty": doctor.get("profile", {}).get("specialty", "General Physician"),
                "experience_years": doctor.get("profile", {}).get("experience_years", 5),
                "qualifications": doctor.get("profile", {}).get("qualifications", "MBBS"),
                "city": doctor.get("profile", {}).get("city", ""),
                "rating": doctor.get("profile", {}).get("rating", 4.5),
                "consultation_fee": doctor.get("profile", {}).get("consultation_fee", 500),
                "available_dates": available_dates[:3],  # Next 3 available dates
                "total_patients": len(set(a.get("patient_id") for a in appointments)),
                "completed_appointments": completed,
            })
        
        return enriched_doctors
    
    def _map_symptoms_to_specialty(self, symptoms: list[str]) -> str:
        """Map symptoms to medical specialty."""
        symptoms_text = " ".join(symptoms).lower()
        
        # Specialty mapping
        if any(kw in symptoms_text for kw in ["heart", "chest pain", "palpitation", "blood pressure"]):
            return "Cardiology"
        elif any(kw in symptoms_text for kw in ["skin", "rash", "acne", "itch", "allergy"]):
            return "Dermatology"
        elif any(kw in symptoms_text for kw in ["bone", "joint", "fracture", "sprain", "back pain"]):
            return "Orthopedics"
        elif any(kw in symptoms_text for kw in ["headache", "migraine", "seizure", "numbness", "tremor"]):
            return "Neurology"
        elif any(kw in symptoms_text for kw in ["stomach", "digestion", "diarrhea", "constipation", "nausea"]):
            return "Gastroenterology"
        elif any(kw in symptoms_text for kw in ["breath", "asthma", "cough", "lung", "respiratory"]):
            return "Pulmonology"
        elif any(kw in symptoms_text for kw in ["kidney", "urine", "bladder", "urinary"]):
            return "Urology"
        elif any(kw in symptoms_text for kw in ["pregnancy", "menstrual", "gynecological", "women"]):
            return "Gynecology"
        elif any(kw in symptoms_text for kw in ["child", "baby", "infant", "pediatric"]):
            return "Pediatrics"
        elif any(kw in symptoms_text for kw in ["eye", "vision", "sight", "blind"]):
            return "Ophthalmology"
        elif any(kw in symptoms_text for kw in ["ear", "hearing", "throat", "nose", "ent"]):
            return "ENT"
        elif any(kw in symptoms_text for kw in ["mental", "depression", "anxiety", "stress", "psychiatric"]):
            return "Psychiatry"
        else:
            return "General Physician"
    
    def find_matching_pharmacies(self, medicines: list[dict]) -> list[dict]:
        """
        Find pharmacies that have the required medicines in stock.
        Returns real pharmacies with availability and pricing.
        """
        pharmacies = user_service.list_by_role("pharmacy", limit=100)
        matches = []
        
        for pharmacy in pharmacies:
            inventory = inventory_service.list_all(pharmacy["id"])
            available_medicines = []
            total_price = 0.0
            available_count = 0
            
            for med in medicines:
                med_name = med.get("name", "").lower()
                quantity = med.get("quantity", 1)
                
                # Find matching medicine in inventory
                inventory_item = None
                for item in inventory:
                    item_name = item.get("medicine_name", "").lower()
                    if med_name in item_name or item_name in med_name:
                        inventory_item = item
                        break
                
                if inventory_item and inventory_item.get("quantity", 0) >= quantity:
                    price = inventory_item.get("price_per_unit", 0) * quantity
                    available_medicines.append({
                        "name": med.get("name"),
                        "available": True,
                        "price": round(price, 2),
                        "price_per_unit": inventory_item.get("price_per_unit", 0),
                        "inventory_id": inventory_item["id"],
                        "quantity": quantity,
                        "in_stock": inventory_item.get("quantity", 0),
                    })
                    total_price += price
                    available_count += 1
                else:
                    available_medicines.append({
                        "name": med.get("name"),
                        "available": False,
                        "price": 0,
                        "quantity": quantity,
                    })
            
            availability_percentage = (available_count / len(medicines) * 100) if medicines else 0
            
            # Only include pharmacies with at least some medicines
            if available_count > 0:
                matches.append({
                    "pharmacy_id": pharmacy["id"],
                    "pharmacy_name": pharmacy.get("name", "Unknown Pharmacy"),
                    "pharmacy_email": pharmacy.get("email", ""),
                    "pharmacy_phone": pharmacy.get("phone", ""),
                    "pharmacy_address": pharmacy.get("profile", {}).get("address", ""),
                    "pharmacy_city": pharmacy.get("profile", {}).get("city", ""),
                    "available_medicines": available_medicines,
                    "total_price": round(total_price, 2),
                    "availability_percentage": round(availability_percentage, 1),
                    "available_count": available_count,
                    "total_count": len(medicines),
                })
        
        # Sort by availability percentage (highest first)
        matches.sort(key=lambda x: (x["availability_percentage"], -x["total_price"]), reverse=True)
        return matches[:5]  # Top 5 pharmacies
    
    def get_user_context(self, user_id: str) -> dict:
        """
        Get comprehensive user context for personalized responses.
        """
        # Get recent appointments
        appointments = appointment_service.list_for_patient(user_id, limit=5)
        
        # Get active medications
        medications = medication_service.list_active(user_id)
        
        # Get recent prescriptions
        prescriptions = prescription_service.list_for_patient(user_id, limit=3)
        
        # Get medical records
        records = medical_record_service.list_for_patient(user_id, limit=3)
        
        return {
            "recent_appointments": appointments,
            "active_medications": medications,
            "recent_prescriptions": prescriptions,
            "medical_records": records,
            "has_chronic_conditions": len(medications) > 0,
            "last_appointment": appointments[0] if appointments else None,
        }
    
    def generate_smart_response(
        self,
        intent: str,
        message: str,
        user_id: str,
        user_context: dict,
        chat_history: list[dict] = None,
    ) -> dict:
        """
        Generate intelligent response based on intent and real data.
        """
        if intent == "symptom_check":
            return self._handle_symptom_check(message, user_id, user_context)
        elif intent == "appointment_booking":
            return self._handle_appointment_booking(message, user_id, user_context)
        elif intent == "prescription_analysis":
            return self._handle_prescription_query(message, user_id, user_context)
        elif intent == "pharmacy_order":
            return self._handle_pharmacy_query(message, user_id, user_context)
        elif intent == "report_analysis":
            return self._handle_report_query(message, user_id, user_context)
        else:
            return self._handle_general_chat(message, user_id, user_context, chat_history)
    
    def _handle_symptom_check(self, message: str, user_id: str, user_context: dict) -> dict:
        """Handle symptom checking with real doctor recommendations."""
        # Extract symptoms using LLM
        if self.llm.enabled:
            extraction_prompt = f"""Extract symptoms from this message: "{message}"
            
Return JSON with:
{{
    "symptoms": ["symptom1", "symptom2"],
    "severity_indicators": ["indicator1"],
    "duration": "X days/hours"
}}"""
            
            extracted = self.llm.invoke_json(
                "You are a medical symptom extractor.",
                extraction_prompt,
                {"symptoms": [message], "severity_indicators": [], "duration": "unknown"}
            )
            
            symptoms = extracted.get("symptoms", [message])
        else:
            symptoms = [message]
        
        # Find matching doctors
        doctors = self.find_matching_doctors(symptoms=symptoms, limit=5)
        
        # Generate analysis using LLM
        if self.llm.enabled:
            context = f"""Patient symptoms: {', '.join(symptoms)}
Patient has active medications: {len(user_context.get('active_medications', []))}
Patient medical history: {len(user_context.get('medical_records', []))} records

Available doctors:
"""
            for i, doc in enumerate(doctors[:3], 1):
                context += f"{i}. Dr. {doc['name']} - {doc['specialty']} ({doc['experience_years']} years exp, Rating: {doc['rating']})\n"
            
            analysis_prompt = f"""{context}

Provide a medical triage analysis with:
1. Possible conditions (with probability)
2. Severity assessment
3. Recommended next steps
4. Which of the available doctors would be best suited

Be conservative and professional."""
            
            response = self.llm.invoke(
                "You are an expert medical triage AI assistant.",
                analysis_prompt
            )
        else:
            response = f"Based on your symptoms, I recommend consulting a {doctors[0]['specialty'] if doctors else 'General Physician'}."
        
        return {
            "response": response,
            "doctors": doctors,
            "symptoms": symptoms,
            "suggested_actions": [
                {"type": "book_appointment", "label": f"Book {doctors[0]['specialty']}" if doctors else "Book Appointment", "data": {"doctors": doctors}},
                {"type": "upload_image", "label": "Upload Symptom Photo"},
            ]
        }
    
    def _handle_appointment_booking(self, message: str, user_id: str, user_context: dict) -> dict:
        """Handle appointment booking with real doctor availability."""
        # Extract specialty or doctor preference
        specialty = None
        if self.llm.enabled:
            extraction = self.llm.invoke_json(
                "Extract the medical specialty or doctor type from this message.",
                f"Message: {message}\n\nReturn JSON: {{\"specialty\": \"specialty name or null\"}}",
                {"specialty": None}
            )
            specialty = extraction.get("specialty")
        
        # Find doctors
        doctors = self.find_matching_doctors(specialty=specialty, limit=5)
        
        if not doctors:
            return {
                "response": "I couldn't find any doctors matching your criteria. Let me show you our available general physicians.",
                "doctors": self.find_matching_doctors(limit=5),
                "suggested_actions": [
                    {"type": "search_doctors", "label": "Search All Doctors"},
                ]
            }
        
        # Generate response
        response = f"I found {len(doctors)} available doctors"
        if specialty:
            response += f" specializing in {specialty}"
        response += ":\n\n"
        
        for i, doc in enumerate(doctors[:3], 1):
            response += f"**{i}. Dr. {doc['name']}** - {doc['specialty']}\n"
            response += f"   • Experience: {doc['experience_years']} years\n"
            response += f"   • Rating: {doc['rating']}/5.0\n"
            response += f"   • Fee: ₹{doc['consultation_fee']}\n"
            
            if doc['available_dates']:
                response += f"   • Next available: {doc['available_dates'][0]['date']} at {', '.join(doc['available_dates'][0]['slots'][:2])}\n"
            response += "\n"
        
        return {
            "response": response,
            "doctors": doctors,
            "suggested_actions": [
                {"type": "book_appointment", "label": "Book Appointment", "data": {"doctors": doctors}},
                {"type": "view_calendar", "label": "View All Slots"},
            ]
        }
    
    def _handle_prescription_query(self, message: str, user_id: str, user_context: dict) -> dict:
        """Handle prescription-related queries."""
        active_meds = user_context.get("active_medications", [])
        
        if active_meds:
            response = f"You currently have {len(active_meds)} active medications:\n\n"
            for med in active_meds[:5]:
                response += f"• **{med.get('medicine_name')}** - {med.get('dosage')}, {med.get('frequency')}\n"
                response += f"  Adherence: {med.get('adherence_rate', 0)}%\n"
            
            response += "\n Would you like to upload a new prescription or order these medicines?"
        else:
            response = "You don't have any active medications. Would you like to upload a prescription to get started?"
        
        return {
            "response": response,
            "medications": active_meds,
            "suggested_actions": [
                {"type": "upload_prescription", "label": "Upload Prescription"},
                {"type": "order_pharmacy", "label": "Order Medicines"},
                {"type": "add_reminders", "label": "Set Reminders"},
            ]
        }
    
    def _handle_pharmacy_query(self, message: str, user_id: str, user_context: dict) -> dict:
        """Handle pharmacy ordering queries."""
        active_meds = user_context.get("active_medications", [])
        
        if active_meds:
            # Convert medications to medicine list
            medicines = [
                {"name": med.get("medicine_name"), "quantity": 30}
                for med in active_meds[:5]
            ]
            
            # Find matching pharmacies
            pharmacies = self.find_matching_pharmacies(medicines)
            
            if pharmacies:
                response = f"I found {len(pharmacies)} pharmacies with your medicines:\n\n"
                for i, pharm in enumerate(pharmacies[:3], 1):
                    response += f"**{i}. {pharm['pharmacy_name']}**\n"
                    response += f"   • Availability: {pharm['availability_percentage']}% ({pharm['available_count']}/{pharm['total_count']} medicines)\n"
                    response += f"   • Total Price: ₹{pharm['total_price']}\n"
                    if pharm.get('pharmacy_city'):
                        response += f"   • Location: {pharm['pharmacy_city']}\n"
                    response += "\n"
                
                return {
                    "response": response,
                    "pharmacies": pharmacies,
                    "medicines": medicines,
                    "suggested_actions": [
                        {"type": "order_pharmacy", "label": "Order Now", "data": {"pharmacies": pharmacies, "medicines": medicines}},
                        {"type": "compare_prices", "label": "Compare All Prices"},
                    ]
                }
        
        return {
            "response": "To order medicines, please upload your prescription first so I can find the best pharmacies for you.",
            "suggested_actions": [
                {"type": "upload_prescription", "label": "Upload Prescription"},
            ]
        }
    
    def _handle_report_query(self, message: str, user_id: str, user_context: dict) -> dict:
        """Handle medical report queries."""
        records = user_context.get("medical_records", [])
        
        if records:
            response = f"You have {len(records)} medical records on file. Would you like to:\n\n"
            response += "• Upload a new report for analysis\n"
            response += "• View your existing reports\n"
            response += "• Get a second opinion on a report\n"
        else:
            response = "Upload your medical report and I'll analyze it for you, explaining all parameters in simple language."
        
        return {
            "response": response,
            "records": records,
            "suggested_actions": [
                {"type": "upload_report", "label": "Upload Report"},
                {"type": "view_records", "label": "View Records"},
            ]
        }
    
    def _handle_general_chat(self, message: str, user_id: str, user_context: dict, chat_history: list[dict]) -> dict:
        """Handle general health questions with context."""
        # Build context
        context_parts = []
        
        if user_context.get("active_medications"):
            meds = [m.get("medicine_name") for m in user_context["active_medications"][:3]]
            context_parts.append(f"Patient is currently taking: {', '.join(meds)}")
        
        if user_context.get("last_appointment"):
            last_appt = user_context["last_appointment"]
            context_parts.append(f"Last appointment: {last_appt.get('reason', 'General checkup')}")
        
        context_text = "\n".join(context_parts) if context_parts else "No specific patient context."
        
        # Build chat history
        history_text = ""
        if chat_history:
            history_text = "\n".join([
                f"{m.get('role', 'user').upper()}: {m.get('content', '')}"
                for m in chat_history[-4:]
            ])
        
        # Generate response
        if self.llm.enabled:
            prompt = f"""Patient Context:
{context_text}

Recent Conversation:
{history_text}

Current Question: {message}

Provide a helpful, accurate, and empathetic response. Include relevant suggestions."""
            
            response = self.llm.invoke(
                "You are a knowledgeable and empathetic health assistant. Provide accurate information and always recommend consulting healthcare professionals for medical decisions.",
                prompt
            )
        else:
            response = "I'm here to help with your health questions. Could you provide more details?"
        
        return {
            "response": response,
            "suggested_actions": [
                {"type": "symptom_check", "label": "Check Symptoms"},
                {"type": "book_appointment", "label": "Book Appointment"},
                {"type": "upload_report", "label": "Analyze Report"},
            ]
        }


# Singleton instance
smart_chat_service = SmartChatService()
