"""
Seed test data for Doctor and Pharmacy roles.
Run this script to populate the database with test users and inventory.
"""
import sys
import os

# Add backend to path
BACKEND_ROOT = os.path.dirname(os.path.abspath(__file__))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

from app.services.data_service import user_service, inventory_service, doctor_availability_service
from datetime import datetime, timedelta


def seed_doctors():
    """Create test doctor accounts."""
    doctors = [
        {
            "name": "Dr. Sarah Johnson",
            "email": "doctor1@test.com",
            "password": "password123",
            "role": "doctor",
            "phone": "+1-555-0101",
            "profile": {
                "specialty": "Cardiology",
                "qualifications": "MD, MBBS, FACC",
                "experience_years": 12,
                "city": "New York",
                "rating": 4.8,
                "consultation_fee": 150,
            }
        },
        {
            "name": "Dr. Michael Chen",
            "email": "doctor2@test.com",
            "password": "password123",
            "role": "doctor",
            "phone": "+1-555-0102",
            "profile": {
                "specialty": "Orthopedics",
                "qualifications": "MD, MS Ortho",
                "experience_years": 15,
                "city": "Los Angeles",
                "rating": 4.9,
                "consultation_fee": 175,
            }
        },
        {
            "name": "Dr. Emily Rodriguez",
            "email": "doctor3@test.com",
            "password": "password123",
            "role": "doctor",
            "phone": "+1-555-0103",
            "profile": {
                "specialty": "Gynecology",
                "qualifications": "MD, DGO",
                "experience_years": 10,
                "city": "Chicago",
                "rating": 4.7,
                "consultation_fee": 140,
            }
        },
        {
            "name": "Dr. James Wilson",
            "email": "doctor4@test.com",
            "password": "password123",
            "role": "doctor",
            "phone": "+1-555-0104",
            "profile": {
                "specialty": "General Physician",
                "qualifications": "MBBS, MD",
                "experience_years": 8,
                "city": "Houston",
                "rating": 4.6,
                "consultation_fee": 100,
            }
        },
        {
            "name": "Dr. Lisa Anderson",
            "email": "doctor5@test.com",
            "password": "password123",
            "role": "doctor",
            "phone": "+1-555-0105",
            "profile": {
                "specialty": "Dermatology",
                "qualifications": "MD, DDV",
                "experience_years": 9,
                "city": "Miami",
                "rating": 4.8,
                "consultation_fee": 130,
            }
        },
    ]
    
    created_doctors = []
    for doc_data in doctors:
        existing = user_service.col.find_one({"email": doc_data["email"]})
        if existing:
            print(f"✓ Doctor {doc_data['name']} already exists")
            from app.db.mongo import serialize_doc
            created_doctors.append(serialize_doc(existing))
        else:
            doctor = user_service.create_user(doc_data)
            if doctor:
                print(f"✓ Created doctor: {doc_data['name']} ({doc_data['profile']['specialty']})")
                created_doctors.append(doctor)
    
    return created_doctors


def seed_doctor_availability(doctors):
    """Set availability for doctors for the next 7 days."""
    today = datetime.now().date()
    
    # Standard time slots
    morning_slots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"]
    afternoon_slots = ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30"]
    all_slots = morning_slots + afternoon_slots
    
    for doctor in doctors:
        for day_offset in range(7):
            date = (today + timedelta(days=day_offset)).strftime("%Y-%m-%d")
            
            # Skip weekends for some doctors
            weekday = (today + timedelta(days=day_offset)).weekday()
            if weekday >= 5:  # Saturday or Sunday
                slots = morning_slots  # Limited availability on weekends
            else:
                slots = all_slots
            
            doctor_availability_service.set_availability(doctor["id"], date, slots)
        
        print(f"✓ Set availability for {doctor['name']} (next 7 days)")


def seed_pharmacies():
    """Create test pharmacy accounts."""
    pharmacies = [
        {
            "name": "HealthPlus Pharmacy",
            "email": "pharmacy1@test.com",
            "password": "password123",
            "role": "pharmacy",
            "phone": "+1-555-0201",
            "profile": {
                "pharmacy_name": "HealthPlus Pharmacy",
                "license_number": "PH12345",
                "city": "New York",
                "address": "123 Main St, New York, NY 10001",
                "operating_hours": "Mon-Sat: 8AM-8PM, Sun: 9AM-6PM",
            }
        },
        {
            "name": "MediCare Pharmacy",
            "email": "pharmacy2@test.com",
            "password": "password123",
            "role": "pharmacy",
            "phone": "+1-555-0202",
            "profile": {
                "pharmacy_name": "MediCare Pharmacy",
                "license_number": "PH67890",
                "city": "Los Angeles",
                "address": "456 Oak Ave, Los Angeles, CA 90001",
                "operating_hours": "Mon-Sun: 24 Hours",
            }
        },
        {
            "name": "QuickMeds Pharmacy",
            "email": "pharmacy3@test.com",
            "password": "password123",
            "role": "pharmacy",
            "phone": "+1-555-0203",
            "profile": {
                "pharmacy_name": "QuickMeds Pharmacy",
                "license_number": "PH11223",
                "city": "Chicago",
                "address": "789 Elm St, Chicago, IL 60601",
                "operating_hours": "Mon-Fri: 9AM-7PM, Sat-Sun: 10AM-5PM",
            }
        },
    ]
    
    created_pharmacies = []
    for pharm_data in pharmacies:
        existing = user_service.col.find_one({"email": pharm_data["email"]})
        if existing:
            print(f"✓ Pharmacy {pharm_data['name']} already exists")
            from app.db.mongo import serialize_doc
            created_pharmacies.append(serialize_doc(existing))
        else:
            pharmacy = user_service.create_user(pharm_data)
            if pharmacy:
                print(f"✓ Created pharmacy: {pharm_data['name']}")
                created_pharmacies.append(pharmacy)
    
    return created_pharmacies


def seed_pharmacy_inventory(pharmacies):
    """Add medicines to pharmacy inventory."""
    medicines = [
        # Common medications
        {"medicine_name": "Aspirin", "generic_name": "Acetylsalicylic Acid", "category": "Pain Relief", "quantity": 500, "price_per_unit": 0.50, "unit": "tablets"},
        {"medicine_name": "Ibuprofen", "generic_name": "Ibuprofen", "category": "Pain Relief", "quantity": 400, "price_per_unit": 0.75, "unit": "tablets"},
        {"medicine_name": "Paracetamol", "generic_name": "Acetaminophen", "category": "Pain Relief", "quantity": 600, "price_per_unit": 0.40, "unit": "tablets"},
        
        # Antibiotics
        {"medicine_name": "Amoxicillin", "generic_name": "Amoxicillin", "category": "Antibiotic", "quantity": 250, "price_per_unit": 2.50, "unit": "capsules"},
        {"medicine_name": "Azithromycin", "generic_name": "Azithromycin", "category": "Antibiotic", "quantity": 180, "price_per_unit": 3.20, "unit": "tablets"},
        {"medicine_name": "Ciprofloxacin", "generic_name": "Ciprofloxacin", "category": "Antibiotic", "quantity": 200, "price_per_unit": 2.80, "unit": "tablets"},
        
        # Diabetes
        {"medicine_name": "Metformin", "generic_name": "Metformin HCl", "category": "Diabetes", "quantity": 400, "price_per_unit": 1.20, "unit": "tablets"},
        {"medicine_name": "Glimepiride", "generic_name": "Glimepiride", "category": "Diabetes", "quantity": 300, "price_per_unit": 1.50, "unit": "tablets"},
        
        # Blood Pressure
        {"medicine_name": "Amlodipine", "generic_name": "Amlodipine Besylate", "category": "Blood Pressure", "quantity": 350, "price_per_unit": 1.80, "unit": "tablets"},
        {"medicine_name": "Lisinopril", "generic_name": "Lisinopril", "category": "Blood Pressure", "quantity": 320, "price_per_unit": 1.60, "unit": "tablets"},
        {"medicine_name": "Losartan", "generic_name": "Losartan Potassium", "category": "Blood Pressure", "quantity": 280, "price_per_unit": 2.00, "unit": "tablets"},
        
        # Cholesterol
        {"medicine_name": "Atorvastatin", "generic_name": "Atorvastatin Calcium", "category": "Cholesterol", "quantity": 300, "price_per_unit": 2.20, "unit": "tablets"},
        {"medicine_name": "Simvastatin", "generic_name": "Simvastatin", "category": "Cholesterol", "quantity": 250, "price_per_unit": 1.90, "unit": "tablets"},
        
        # Allergy
        {"medicine_name": "Cetirizine", "generic_name": "Cetirizine HCl", "category": "Allergy", "quantity": 400, "price_per_unit": 0.60, "unit": "tablets"},
        {"medicine_name": "Loratadine", "generic_name": "Loratadine", "category": "Allergy", "quantity": 350, "price_per_unit": 0.70, "unit": "tablets"},
        
        # Stomach
        {"medicine_name": "Omeprazole", "generic_name": "Omeprazole", "category": "Stomach", "quantity": 300, "price_per_unit": 1.40, "unit": "capsules"},
        {"medicine_name": "Ranitidine", "generic_name": "Ranitidine HCl", "category": "Stomach", "quantity": 280, "price_per_unit": 1.10, "unit": "tablets"},
        
        # Vitamins
        {"medicine_name": "Vitamin D3", "generic_name": "Cholecalciferol", "category": "Vitamin", "quantity": 500, "price_per_unit": 0.80, "unit": "capsules"},
        {"medicine_name": "Vitamin B12", "generic_name": "Cyanocobalamin", "category": "Vitamin", "quantity": 450, "price_per_unit": 0.90, "unit": "tablets"},
        {"medicine_name": "Multivitamin", "generic_name": "Multivitamin", "category": "Vitamin", "quantity": 400, "price_per_unit": 1.50, "unit": "tablets"},
    ]
    
    for pharmacy in pharmacies:
        # Each pharmacy gets slightly different inventory
        for med in medicines:
            # Vary quantities and prices slightly per pharmacy
            import random
            quantity_variation = random.randint(-50, 100)
            price_variation = random.uniform(-0.10, 0.20)
            
            med_data = med.copy()
            med_data["quantity"] = max(0, med["quantity"] + quantity_variation)
            med_data["price_per_unit"] = round(max(0.10, med["price_per_unit"] + price_variation), 2)
            med_data["reorder_level"] = 50
            
            # Check if already exists
            existing = inventory_service.col.find_one({
                "pharmacy_id": pharmacy["id"],
                "medicine_name": med["medicine_name"]
            })
            
            if not existing:
                inventory_service.add_item(pharmacy["id"], med_data)
        
        print(f"✓ Added {len(medicines)} medicines to {pharmacy['name']}")


def seed_test_patient():
    """Create a test patient account."""
    patient_data = {
        "name": "John Doe",
        "email": "patient@test.com",
        "password": "password123",
        "role": "patient",
        "phone": "+1-555-0001",
        "profile": {
            "age": 35,
            "gender": "male",
            "blood_group": "O+",
            "city": "New York",
        }
    }
    
    existing = user_service.col.find_one({"email": patient_data["email"]})
    if existing:
        print(f"✓ Patient {patient_data['name']} already exists")
        from app.db.mongo import serialize_doc
        return serialize_doc(existing)
    else:
        patient = user_service.create_user(patient_data)
        if patient:
            print(f"✓ Created patient: {patient_data['name']}")
            return patient


def main():
    print("\n🌱 Seeding test data for Doctor & Pharmacy system...\n")
    
    # Seed doctors
    print("📋 Creating doctors...")
    doctors = seed_doctors()
    
    # Set doctor availability
    print("\n📅 Setting doctor availability...")
    seed_doctor_availability(doctors)
    
    # Seed pharmacies
    print("\n💊 Creating pharmacies...")
    pharmacies = seed_pharmacies()
    
    # Seed pharmacy inventory
    print("\n📦 Adding pharmacy inventory...")
    seed_pharmacy_inventory(pharmacies)
    
    # Create test patient
    print("\n👤 Creating test patient...")
    patient = seed_test_patient()
    
    print("\n✅ Seeding complete!\n")
    print("=" * 60)
    print("Test Accounts Created:")
    print("=" * 60)
    print("\n👨‍⚕️ DOCTORS:")
    for doc in doctors:
        print(f"  Email: {doc['email']}")
        print(f"  Password: password123")
        print(f"  Specialty: {doc['profile'].get('specialty', 'N/A')}")
        print()
    
    print("💊 PHARMACIES:")
    for pharm in pharmacies:
        print(f"  Email: {pharm['email']}")
        print(f"  Password: password123")
        print(f"  Name: {pharm['profile'].get('pharmacy_name', 'N/A')}")
        print()
    
    print("👤 PATIENT:")
    print(f"  Email: {patient['email']}")
    print(f"  Password: password123")
    print()
    
    print("=" * 60)
    print("\n🚀 You can now login with these accounts!")
    print("   API: http://localhost:8000/api/v1/auth/login")
    print()


if __name__ == "__main__":
    main()
