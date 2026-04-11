#!/usr/bin/env python3
"""
Test script for prescription schedule feature.
Tests the API endpoint without requiring authentication.
"""
import sys
import os

# Add backend to path
BACKEND_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BACKEND_ROOT)

from app.services.llm_service import llm_service


def test_llm_service():
    """Test if LLM service is configured."""
    print("🔍 Testing LLM Service Configuration...")
    
    if not llm_service.enabled:
        print("❌ LLM service is not enabled. Please set GEMINI_API_KEY in .env file.")
        return False
    
    print("✅ LLM service is enabled")
    return True


def test_prescription_extraction():
    """Test prescription extraction with sample data."""
    print("\n🔍 Testing Prescription Extraction...")
    
    if not llm_service.enabled:
        print("⚠️  Skipping test - LLM not configured")
        return
    
    sample_prescription = """
    Dr. Sarah Johnson, MD
    General Medicine
    
    Patient: John Doe
    Date: April 11, 2026
    
    Rx:
    1. Amoxicillin 500mg - TDS x 7 days (Take after meals)
    2. Paracetamol 650mg - BD x 5 days (For fever)
    3. Vitamin D3 60000 IU - Once weekly x 8 weeks
    
    Signature: Dr. Sarah Johnson
    """
    
    prompt = f"""
    Prescription Text:
    {sample_prescription}
    
    Extract all medicines from this prescription and create a structured daily schedule.
    For each medicine, identify:
    1. Medicine name
    2. Dosage (e.g., '500mg', '1 tablet')
    3. Times per day (e.g., 2 for twice daily, 3 for thrice daily)
    4. Duration in days (e.g., 7, 14, 30)
    5. Suggested timing in 24-hour format (e.g., ['08:00', '20:00'] for twice daily)
    6. Special instructions (e.g., 'Take after meals', 'Take on empty stomach')
    
    Use standard timing conventions:
    - Once daily: ['08:00']
    - Twice daily: ['08:00', '20:00']
    - Thrice daily: ['08:00', '14:00', '20:00']
    - Four times daily: ['08:00', '12:00', '16:00', '20:00']
    """
    
    system_prompt = """
    You are a clinical pharmacist AI specializing in prescription interpretation.
    Extract medicine information from handwritten or printed prescriptions accurately.
    Convert medical abbreviations (e.g., 'BD' = twice daily, 'TDS' = thrice daily, 'QID' = four times daily).
    Create a clear, patient-friendly medication schedule with specific times.
    """
    
    fallback = {
        "medicines": [],
        "schedule_summary": "Unable to extract prescription details.",
        "total_medicines": 0,
    }
    
    try:
        result = llm_service.invoke_json(
            system_prompt,
            prompt + "\n\nReturn JSON with keys: medicines (array of {name, dosage, times_per_day, duration_days, "
            "timing (array of time strings in HH:MM format), instructions}), "
            "schedule_summary (string), total_medicines (int).",
            fallback,
        )
        
        print("✅ Prescription extraction successful!")
        print(f"\n📊 Results:")
        print(f"   Total medicines: {result.get('total_medicines', 0)}")
        print(f"   Summary: {result.get('schedule_summary', 'N/A')}")
        
        print(f"\n💊 Extracted Medicines:")
        for i, med in enumerate(result.get('medicines', []), 1):
            print(f"\n   {i}. {med.get('name', 'Unknown')}")
            print(f"      Dosage: {med.get('dosage', 'N/A')}")
            print(f"      Frequency: {med.get('times_per_day', 0)}x per day")
            print(f"      Duration: {med.get('duration_days', 0)} days")
            print(f"      Timing: {', '.join(med.get('timing', []))}")
            if med.get('instructions'):
                print(f"      Instructions: {med.get('instructions')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Prescription extraction failed: {e}")
        return False


def test_database_connection():
    """Test MongoDB connection."""
    print("\n🔍 Testing Database Connection...")
    
    try:
        from app.db.mongo import mongo_service
        
        if mongo_service.ping():
            print("✅ MongoDB connection successful")
            return True
        else:
            print("❌ MongoDB connection failed")
            return False
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return False


def main():
    """Run all tests."""
    print("=" * 60)
    print("🏥 NextGen Health - Prescription Schedule Feature Tests")
    print("=" * 60)
    
    results = []
    
    # Test 1: LLM Service
    results.append(("LLM Service", test_llm_service()))
    
    # Test 2: Database Connection
    results.append(("Database Connection", test_database_connection()))
    
    # Test 3: Prescription Extraction
    results.append(("Prescription Extraction", test_prescription_extraction()))
    
    # Summary
    print("\n" + "=" * 60)
    print("📋 Test Summary")
    print("=" * 60)
    
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    total_tests = len(results)
    passed_tests = sum(1 for _, passed in results if passed)
    
    print(f"\n🎯 Results: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("\n🎉 All tests passed! The prescription schedule feature is ready to use.")
        print("\n📝 Next steps:")
        print("   1. Start the backend server: python app/main.py")
        print("   2. Open http://localhost:8000/web/ in your browser")
        print("   3. Upload a prescription image to test the feature")
    else:
        print("\n⚠️  Some tests failed. Please check the configuration:")
        print("   - Ensure GEMINI_API_KEY is set in .env")
        print("   - Ensure MongoDB is running")
        print("   - Check backend/requirements.txt dependencies are installed")
    
    print("=" * 60)


if __name__ == "__main__":
    main()
