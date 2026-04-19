#!/usr/bin/env python3
"""
Symptom Checker Diagnostic Script
Tests the main components to identify why the symptom checker is not working.
"""

import os
import sys
import json
from pathlib import Path

# Add backend to path
BACKEND_ROOT = Path(__file__).parent
sys.path.insert(0, str(BACKEND_ROOT))

def test_environment():
    """Test environment variables and configuration."""
    print("=== ENVIRONMENT TEST ===")
    
    # Load environment
    from dotenv import load_dotenv
    load_dotenv(BACKEND_ROOT / ".env")
    
    # Check critical environment variables
    gemini_key = os.getenv("GEMINI_API_KEY")
    mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    
    print(f"✓ GEMINI_API_KEY: {'SET' if gemini_key else 'MISSING'}")
    if gemini_key:
        print(f"  Key starts with: {gemini_key[:20]}...")
    
    print(f"✓ MONGODB_URI: {mongodb_uri}")
    
    return bool(gemini_key)

def test_mongodb_connection():
    """Test MongoDB connection."""
    print("\n=== MONGODB CONNECTION TEST ===")
    
    try:
        from app.db.mongo import mongo_service
        
        # Test ping
        ping_result = mongo_service.ping()
        print(f"✓ MongoDB Ping: {'SUCCESS' if ping_result else 'FAILED'}")
        
        if ping_result:
            # Test collection access
            users_count = mongo_service.collection("users").count_documents({})
            print(f"✓ Users collection accessible: {users_count} documents")
            
            symptom_count = mongo_service.collection("symptom_checks").count_documents({})
            print(f"✓ Symptom checks collection: {symptom_count} documents")
        
        return ping_result
        
    except Exception as e:
        print(f"✗ MongoDB Error: {e}")
        return False

def test_llm_service():
    """Test LLM service configuration and basic functionality."""
    print("\n=== LLM SERVICE TEST ===")
    
    try:
        from app.services.llm_service import llm_service
        
        print(f"✓ LLM Service Enabled: {llm_service.enabled}")
        
        if not llm_service.enabled:
            print("✗ LLM Service is disabled - check GEMINI_API_KEY")
            return False
        
        # Test basic invocation
        try:
            response = llm_service.invoke(
                "You are a test assistant.",
                "Respond with exactly: 'LLM_TEST_SUCCESS'"
            )
            print(f"✓ Basic LLM Test: {response.strip()}")
            
            # Test JSON invocation
            json_response = llm_service.invoke_json(
                "You are a test assistant.",
                "Return JSON: {\"status\": \"success\", \"message\": \"JSON test passed\"}",
                {"status": "fallback", "message": "JSON test failed"}
            )
            print(f"✓ JSON LLM Test: {json_response}")
            
            return True
            
        except Exception as e:
            print(f"✗ LLM Invocation Error: {e}")
            return False
            
    except Exception as e:
        print(f"✗ LLM Service Import Error: {e}")
        return False

def test_symptom_checker_endpoint():
    """Test the symptom checker logic without HTTP."""
    print("\n=== SYMPTOM CHECKER LOGIC TEST ===")
    
    try:
        from app.services.llm_service import llm_service
        from app.services.data_service import ai_record_service
        
        if not llm_service.enabled:
            print("✗ Skipping - LLM service not enabled")
            return False
        
        # Test symptom analysis
        test_prompt = """
        Symptom Description: I have a headache and feel tired
        Patient Age: 30
        Patient Gender: male
        
        **IMPORTANT: Analyze these symptoms and provide a medical assessment.**
        """
        
        system_prompt = (
            "You are an expert medical triage AI. Analyze symptoms from multiple input sources "
            "(text description, voice, and images) to provide a comprehensive, safe assessment. "
            "Be conservative and always recommend professional consultation."
        )
        
        fallback = {
            "possible_conditions": [{"name": "Unspecified condition", "probability": "unknown", "description": "Please describe symptoms more clearly."}],
            "severity": "moderate",
            "red_flags": [],
            "next_steps": ["Consult a doctor immediately if symptoms worsen.", "Track your symptoms for 24-48 hours."],
            "recommended_specialist": None,
            "home_care_tips": ["Stay hydrated.", "Rest adequately."],
            "disclaimer": "⚠️ This AI analysis is for informational purposes only and does not constitute medical advice. Always consult a qualified healthcare professional.",
        }
        
        result = llm_service.invoke_json(
            system_prompt,
            test_prompt + "\n\nReturn JSON with keys: possible_conditions (array of {name, probability, description}), "
            "severity (low|moderate|high|critical), red_flags (array), next_steps (array), "
            "recommended_specialist (string or null), home_care_tips (array), disclaimer (string).",
            fallback,
        )
        
        print(f"✓ Symptom Analysis Result:")
        print(json.dumps(result, indent=2))
        
        # Test saving to database
        try:
            record_id = ai_record_service.save_symptom_check(
                "test_user_id",
                {"symptom_text": "headache and tired", "patient_age": 30, "patient_gender": "male"},
                result,
            )
            print(f"✓ Database Save: Record ID {record_id}")
            return True
            
        except Exception as e:
            print(f"✗ Database Save Error: {e}")
            return False
            
    except Exception as e:
        print(f"✗ Symptom Checker Test Error: {e}")
        return False

def test_file_service():
    """Test file upload and processing capabilities."""
    print("\n=== FILE SERVICE TEST ===")
    
    try:
        from app.services.file_service import file_service
        
        # Test file size validation
        test_bytes = b"test data" * 100
        size_valid = file_service.validate_file_size(test_bytes)
        print(f"✓ File Size Validation: {size_valid}")
        
        # Test base64 conversion
        base64_result = file_service.file_to_base64(test_bytes)
        print(f"✓ Base64 Conversion: {len(base64_result)} characters")
        
        # Test MIME type detection
        mime_type = file_service.detect_mime_type(test_bytes, "test.txt")
        print(f"✓ MIME Type Detection: {mime_type}")
        
        return True
        
    except Exception as e:
        print(f"✗ File Service Error: {e}")
        return False

def main():
    """Run all diagnostic tests."""
    print("🔍 SYMPTOM CHECKER DIAGNOSTIC TOOL")
    print("=" * 50)
    
    tests = [
        ("Environment", test_environment),
        ("MongoDB", test_mongodb_connection),
        ("LLM Service", test_llm_service),
        ("File Service", test_file_service),
        ("Symptom Checker", test_symptom_checker_endpoint),
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"\n✗ {test_name} Test CRASHED: {e}")
            results[test_name] = False
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 DIAGNOSTIC SUMMARY")
    print("=" * 50)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name:20} {status}")
    
    # Recommendations
    print("\n🔧 RECOMMENDATIONS:")
    
    if not results.get("Environment"):
        print("1. ❗ Set GEMINI_API_KEY in .env file")
    
    if not results.get("MongoDB"):
        print("2. ❗ Start MongoDB service: mongod")
        print("   Or check MONGODB_URI in .env")
    
    if not results.get("LLM Service"):
        print("3. ❗ Fix LLM configuration - check API key validity")
    
    if not results.get("File Service"):
        print("4. ❗ Install missing dependencies: pip install Pillow PyMuPDF")
    
    if not results.get("Symptom Checker"):
        print("5. ❗ Fix symptom checker logic - check logs for errors")
    
    if all(results.values()):
        print("🎉 All tests passed! Symptom checker should be working.")
        print("   If still having issues, check:")
        print("   - Frontend is sending requests to correct endpoint")
        print("   - Authentication tokens are valid")
        print("   - Network connectivity between frontend and backend")
    
    return all(results.values())

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)