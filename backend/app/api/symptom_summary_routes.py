from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.llm_service import llm_service

router = APIRouter(prefix="/symptom-summary", tags=["symptom-summary"])

class SymptomSummaryRequest(BaseModel):
    symptom_text: str
    possible_conditions: list = []
    severity: str = ""
    red_flags: list = []
    next_steps: list = []
    recommended_specialist: str = ""
    home_care_tips: list = []

@router.post("/generate")
def generate_symptom_summary(request: SymptomSummaryRequest):
    """Generate a concise summary of symptom analysis for doctor's notes"""
    try:
        if not llm_service.enabled:
            # Fallback if LLM not available
            summary = f"Symptoms: {request.symptom_text[:100]}"
            if request.severity:
                summary += f" | Severity: {request.severity}"
            if request.possible_conditions:
                cond = request.possible_conditions[0]
                cond_name = cond.get('name', str(cond)) if isinstance(cond, dict) else str(cond)
                summary += f" | Possible: {cond_name}"
            return {"summary": summary}
        
        # Build comprehensive context from AI analysis OUTPUT
        analysis_parts = []
        
        # Start with severity assessment
        if request.severity:
            analysis_parts.append(f"AI Assessment - Severity: {request.severity.upper()}")
        
        # Add possible conditions (most important)
        if request.possible_conditions:
            conditions_list = []
            for i, cond in enumerate(request.possible_conditions[:3]):
                if isinstance(cond, dict):
                    name = cond.get('name', '')
                    desc = cond.get('description', '')
                    prob = cond.get('probability', '')
                    cond_str = name
                    if prob:
                        cond_str += f" ({prob})"
                    if desc:
                        cond_str += f": {desc[:80]}"
                    conditions_list.append(cond_str)
                else:
                    conditions_list.append(str(cond))
            
            if conditions_list:
                analysis_parts.append(f"Possible Conditions: {' | '.join(conditions_list)}")
        
        # Add red flags (critical)
        if request.red_flags:
            flags_str = "; ".join(request.red_flags[:3])
            analysis_parts.append(f"⚠️ Red Flags: {flags_str}")
        
        # Add recommended specialist
        if request.recommended_specialist:
            analysis_parts.append(f"Recommended: {request.recommended_specialist}")
        
        # Add key next steps
        if request.next_steps:
            steps_str = "; ".join(request.next_steps[:2])
            analysis_parts.append(f"Recommended Actions: {steps_str}")
        
        # Add original symptoms for context
        analysis_parts.append(f"Patient's Reported Symptoms: {request.symptom_text[:150]}")
        
        full_analysis = "\n\n".join(analysis_parts)
        
        system_prompt = """You are writing clinical notes for a doctor who will see this patient.
Write a brief, direct clinical summary as if YOU are the triage system reporting to the doctor.

DO NOT mention:
- "AI assessment" or "AI identified"
- "Consultation recommended" (the doctor already knows they're being consulted)
- "In-person evaluation needed" (obvious since patient is booking)

DO include:
- Severity level
- Differential diagnoses with key features
- Red flags or urgent concerns
- Patient's chief complaints

Write in present tense, clinical style, 3-4 sentences. Be direct and factual."""
        
        user_prompt = f"""Write clinical notes for the doctor based on this triage assessment:

{full_analysis}

Format: Direct clinical summary for doctor's review before appointment."""
        
        summary = llm_service.invoke(system_prompt, user_prompt)
        
        # Ensure summary is not too long
        if len(summary) > 400:
            summary = summary[:397] + "..."
        
        return {"summary": summary.strip()}
        
    except Exception as e:
        print(f"Error generating symptom summary: {e}")
        import traceback
        traceback.print_exc()
        
        # Better fallback summary with analysis results
        fallback_parts = []
        if request.severity:
            fallback_parts.append(f"Severity: {request.severity}")
        if request.possible_conditions:
            cond = request.possible_conditions[0]
            cond_name = cond.get('name', str(cond)) if isinstance(cond, dict) else str(cond)
            fallback_parts.append(f"Possible condition: {cond_name}")
        if request.red_flags:
            fallback_parts.append(f"Red flags: {', '.join(request.red_flags[:2])}")
        
        fallback_parts.append(f"Symptoms: {request.symptom_text[:100]}")
        
        return {"summary": " | ".join(fallback_parts)}
