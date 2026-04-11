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
    """Create test doctor accounts - 40 doctors across 15+ specialties."""
    doctors = [
        # Cardiology (3 doctors)
        {"name": "Dr. Sarah Johnson", "email": "doctor1@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0101", "profile": {"specialty": "Cardiology", "qualifications": "MD, MBBS, FACC", "experience_years": 12, "city": "New York", "rating": 4.8, "consultation_fee": 150}},
        {"name": "Dr. Robert Martinez", "email": "doctor6@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0106", "profile": {"specialty": "Cardiology", "qualifications": "MD, DM Cardiology", "experience_years": 18, "city": "Boston", "rating": 4.9, "consultation_fee": 180}},
        {"name": "Dr. Priya Sharma", "email": "doctor7@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0107", "profile": {"specialty": "Cardiology", "qualifications": "MD, FACC, FSCAI", "experience_years": 14, "city": "San Francisco", "rating": 4.7, "consultation_fee": 165}},
        
        # Orthopedics (3 doctors)
        {"name": "Dr. Michael Chen", "email": "doctor2@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0102", "profile": {"specialty": "Orthopedics", "qualifications": "MD, MS Ortho", "experience_years": 15, "city": "Los Angeles", "rating": 4.9, "consultation_fee": 175}},
        {"name": "Dr. David Thompson", "email": "doctor8@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0108", "profile": {"specialty": "Orthopedics", "qualifications": "MBBS, MS, DNB Ortho", "experience_years": 11, "city": "Seattle", "rating": 4.6, "consultation_fee": 160}},
        {"name": "Dr. Amanda Foster", "email": "doctor9@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0109", "profile": {"specialty": "Orthopedics", "qualifications": "MD, Fellowship Sports Medicine", "experience_years": 9, "city": "Denver", "rating": 4.8, "consultation_fee": 155}},
        
        # Gynecology (3 doctors)
        {"name": "Dr. Emily Rodriguez", "email": "doctor3@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0103", "profile": {"specialty": "Gynecology", "qualifications": "MD, DGO", "experience_years": 10, "city": "Chicago", "rating": 4.7, "consultation_fee": 140}},
        {"name": "Dr. Jennifer Lee", "email": "doctor10@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0110", "profile": {"specialty": "Gynecology", "qualifications": "MBBS, MS OBG", "experience_years": 13, "city": "Atlanta", "rating": 4.8, "consultation_fee": 145}},
        {"name": "Dr. Maria Garcia", "email": "doctor11@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0111", "profile": {"specialty": "Gynecology", "qualifications": "MD, FACOG", "experience_years": 16, "city": "Phoenix", "rating": 4.9, "consultation_fee": 170}},
        
        # Pediatrics (3 doctors)
        {"name": "Dr. William Brown", "email": "doctor12@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0112", "profile": {"specialty": "Pediatrics", "qualifications": "MD, FAAP", "experience_years": 14, "city": "Dallas", "rating": 4.8, "consultation_fee": 120}},
        {"name": "Dr. Rachel Green", "email": "doctor13@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0113", "profile": {"specialty": "Pediatrics", "qualifications": "MBBS, MD Pediatrics", "experience_years": 10, "city": "Portland", "rating": 4.7, "consultation_fee": 115}},
        {"name": "Dr. Kevin Patel", "email": "doctor14@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0114", "profile": {"specialty": "Pediatrics", "qualifications": "MD, DCH", "experience_years": 12, "city": "Austin", "rating": 4.9, "consultation_fee": 125}},
        
        # Neurology (3 doctors)
        {"name": "Dr. Thomas Anderson", "email": "doctor15@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0115", "profile": {"specialty": "Neurology", "qualifications": "MD, DM Neurology", "experience_years": 17, "city": "Philadelphia", "rating": 4.9, "consultation_fee": 190}},
        {"name": "Dr. Sophia Williams", "email": "doctor16@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0116", "profile": {"specialty": "Neurology", "qualifications": "MBBS, MD, DNB Neuro", "experience_years": 13, "city": "San Diego", "rating": 4.7, "consultation_fee": 175}},
        {"name": "Dr. Daniel Kim", "email": "doctor17@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0117", "profile": {"specialty": "Neurology", "qualifications": "MD, Fellowship Epilepsy", "experience_years": 11, "city": "Minneapolis", "rating": 4.8, "consultation_fee": 180}},
        
        # Psychiatry (2 doctors)
        {"name": "Dr. Laura Mitchell", "email": "doctor18@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0118", "profile": {"specialty": "Psychiatry", "qualifications": "MD, DPM", "experience_years": 15, "city": "Nashville", "rating": 4.8, "consultation_fee": 160}},
        {"name": "Dr. Christopher Davis", "email": "doctor19@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0119", "profile": {"specialty": "Psychiatry", "qualifications": "MBBS, MD Psychiatry", "experience_years": 12, "city": "Charlotte", "rating": 4.7, "consultation_fee": 155}},
        
        # Ophthalmology (2 doctors)
        {"name": "Dr. Jessica Taylor", "email": "doctor20@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0120", "profile": {"specialty": "Ophthalmology", "qualifications": "MD, MS Ophthalmology", "experience_years": 10, "city": "Tampa", "rating": 4.8, "consultation_fee": 140}},
        {"name": "Dr. Andrew Wilson", "email": "doctor21@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0121", "profile": {"specialty": "Ophthalmology", "qualifications": "MBBS, DO, DNB", "experience_years": 14, "city": "Orlando", "rating": 4.9, "consultation_fee": 150}},
        
        # ENT (2 doctors)
        {"name": "Dr. Michelle Robinson", "email": "doctor22@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0122", "profile": {"specialty": "ENT", "qualifications": "MD, MS ENT", "experience_years": 11, "city": "Columbus", "rating": 4.7, "consultation_fee": 135}},
        {"name": "Dr. Brian Clark", "email": "doctor23@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0123", "profile": {"specialty": "ENT", "qualifications": "MBBS, DLO, DNB", "experience_years": 9, "city": "Indianapolis", "rating": 4.6, "consultation_fee": 130}},
        
        # Gastroenterology (2 doctors)
        {"name": "Dr. Patricia Moore", "email": "doctor24@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0124", "profile": {"specialty": "Gastroenterology", "qualifications": "MD, DM Gastro", "experience_years": 16, "city": "San Jose", "rating": 4.9, "consultation_fee": 185}},
        {"name": "Dr. Steven Harris", "email": "doctor25@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0125", "profile": {"specialty": "Gastroenterology", "qualifications": "MBBS, MD, DNB Gastro", "experience_years": 13, "city": "Jacksonville", "rating": 4.8, "consultation_fee": 170}},
        
        # Endocrinology (2 doctors)
        {"name": "Dr. Nancy White", "email": "doctor26@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0126", "profile": {"specialty": "Endocrinology", "qualifications": "MD, DM Endocrinology", "experience_years": 14, "city": "Fort Worth", "rating": 4.8, "consultation_fee": 165}},
        {"name": "Dr. Richard Lewis", "email": "doctor27@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0127", "profile": {"specialty": "Endocrinology", "qualifications": "MBBS, MD, Fellowship Diabetes", "experience_years": 11, "city": "Detroit", "rating": 4.7, "consultation_fee": 160}},
        
        # Pulmonology (2 doctors)
        {"name": "Dr. Karen Walker", "email": "doctor28@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0128", "profile": {"specialty": "Pulmonology", "qualifications": "MD, DM Pulmonology", "experience_years": 12, "city": "Memphis", "rating": 4.7, "consultation_fee": 155}},
        {"name": "Dr. Joseph Hall", "email": "doctor29@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0129", "profile": {"specialty": "Pulmonology", "qualifications": "MBBS, MD Respiratory Medicine", "experience_years": 10, "city": "Baltimore", "rating": 4.6, "consultation_fee": 150}},
        
        # Nephrology (2 doctors)
        {"name": "Dr. Betty Allen", "email": "doctor30@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0130", "profile": {"specialty": "Nephrology", "qualifications": "MD, DM Nephrology", "experience_years": 15, "city": "Milwaukee", "rating": 4.8, "consultation_fee": 175}},
        {"name": "Dr. George Young", "email": "doctor31@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0131", "profile": {"specialty": "Nephrology", "qualifications": "MBBS, MD, DNB Nephrology", "experience_years": 13, "city": "Albuquerque", "rating": 4.7, "consultation_fee": 170}},
        
        # Rheumatology (2 doctors)
        {"name": "Dr. Dorothy King", "email": "doctor32@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0132", "profile": {"specialty": "Rheumatology", "qualifications": "MD, DM Rheumatology", "experience_years": 11, "city": "Tucson", "rating": 4.7, "consultation_fee": 160}},
        {"name": "Dr. Paul Wright", "email": "doctor33@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0133", "profile": {"specialty": "Rheumatology", "qualifications": "MBBS, MD, Fellowship Arthritis", "experience_years": 9, "city": "Fresno", "rating": 4.6, "consultation_fee": 155}},
        
        # Oncology (2 doctors)
        {"name": "Dr. Sandra Scott", "email": "doctor34@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0134", "profile": {"specialty": "Oncology", "qualifications": "MD, DM Medical Oncology", "experience_years": 18, "city": "Sacramento", "rating": 4.9, "consultation_fee": 200}},
        {"name": "Dr. Mark Green", "email": "doctor35@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0135", "profile": {"specialty": "Oncology", "qualifications": "MBBS, MD, DNB Oncology", "experience_years": 16, "city": "Kansas City", "rating": 4.8, "consultation_fee": 195}},
        
        # Dermatology (2 doctors)
        {"name": "Dr. Lisa Anderson", "email": "doctor5@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0105", "profile": {"specialty": "Dermatology", "qualifications": "MD, DDV", "experience_years": 9, "city": "Miami", "rating": 4.8, "consultation_fee": 130}},
        {"name": "Dr. Carol Adams", "email": "doctor36@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0136", "profile": {"specialty": "Dermatology", "qualifications": "MBBS, MD Dermatology", "experience_years": 12, "city": "Long Beach", "rating": 4.7, "consultation_fee": 135}},
        
        # General Physician (3 doctors)
        {"name": "Dr. James Wilson", "email": "doctor4@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0104", "profile": {"specialty": "General Physician", "qualifications": "MBBS, MD", "experience_years": 8, "city": "Houston", "rating": 4.6, "consultation_fee": 100}},
        {"name": "Dr. Helen Baker", "email": "doctor37@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0137", "profile": {"specialty": "General Physician", "qualifications": "MBBS, MD Family Medicine", "experience_years": 10, "city": "Mesa", "rating": 4.7, "consultation_fee": 105}},
        {"name": "Dr. Edward Nelson", "email": "doctor38@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0138", "profile": {"specialty": "General Physician", "qualifications": "MD, MBBS", "experience_years": 7, "city": "Virginia Beach", "rating": 4.5, "consultation_fee": 95}},
        
        # Urology (2 doctors)
        {"name": "Dr. Margaret Carter", "email": "doctor39@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0139", "profile": {"specialty": "Urology", "qualifications": "MD, MCh Urology", "experience_years": 14, "city": "Atlanta", "rating": 4.8, "consultation_fee": 165}},
        {"name": "Dr. Ronald Mitchell", "email": "doctor40@test.com", "password": "password123", "role": "doctor", "phone": "+1-555-0140", "profile": {"specialty": "Urology", "qualifications": "MBBS, MS, DNB Urology", "experience_years": 11, "city": "Oakland", "rating": 4.7, "consultation_fee": 160}},
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
    """Create test pharmacy accounts - 8 pharmacies across different cities."""
    pharmacies = [
        {"name": "HealthPlus Pharmacy", "email": "pharmacy1@test.com", "password": "password123", "role": "pharmacy", "phone": "+1-555-0201", "profile": {"pharmacy_name": "HealthPlus Pharmacy", "license_number": "PH12345", "city": "New York", "address": "123 Main St, New York, NY 10001", "operating_hours": "Mon-Sat: 8AM-8PM, Sun: 9AM-6PM"}},
        {"name": "MediCare Pharmacy", "email": "pharmacy2@test.com", "password": "password123", "role": "pharmacy", "phone": "+1-555-0202", "profile": {"pharmacy_name": "MediCare Pharmacy", "license_number": "PH67890", "city": "Los Angeles", "address": "456 Oak Ave, Los Angeles, CA 90001", "operating_hours": "Mon-Sun: 24 Hours"}},
        {"name": "QuickMeds Pharmacy", "email": "pharmacy3@test.com", "password": "password123", "role": "pharmacy", "phone": "+1-555-0203", "profile": {"pharmacy_name": "QuickMeds Pharmacy", "license_number": "PH11223", "city": "Chicago", "address": "789 Elm St, Chicago, IL 60601", "operating_hours": "Mon-Fri: 9AM-7PM, Sat-Sun: 10AM-5PM"}},
        {"name": "WellCare Pharmacy", "email": "pharmacy4@test.com", "password": "password123", "role": "pharmacy", "phone": "+1-555-0204", "profile": {"pharmacy_name": "WellCare Pharmacy", "license_number": "PH44556", "city": "Houston", "address": "321 Pine Rd, Houston, TX 77001", "operating_hours": "Mon-Sat: 7AM-9PM, Sun: 8AM-7PM"}},
        {"name": "CityMed Pharmacy", "email": "pharmacy5@test.com", "password": "password123", "role": "pharmacy", "phone": "+1-555-0205", "profile": {"pharmacy_name": "CityMed Pharmacy", "license_number": "PH77889", "city": "Phoenix", "address": "555 Desert Blvd, Phoenix, AZ 85001", "operating_hours": "Mon-Sun: 24 Hours"}},
        {"name": "PrimeCare Pharmacy", "email": "pharmacy6@test.com", "password": "password123", "role": "pharmacy", "phone": "+1-555-0206", "profile": {"pharmacy_name": "PrimeCare Pharmacy", "license_number": "PH99001", "city": "Philadelphia", "address": "888 Liberty Ave, Philadelphia, PA 19101", "operating_hours": "Mon-Fri: 8AM-8PM, Sat-Sun: 9AM-6PM"}},
        {"name": "LifePlus Pharmacy", "email": "pharmacy7@test.com", "password": "password123", "role": "pharmacy", "phone": "+1-555-0207", "profile": {"pharmacy_name": "LifePlus Pharmacy", "license_number": "PH22334", "city": "San Antonio", "address": "777 River Walk, San Antonio, TX 78201", "operating_hours": "Mon-Sat: 8AM-10PM, Sun: 9AM-8PM"}},
        {"name": "TrustMed Pharmacy", "email": "pharmacy8@test.com", "password": "password123", "role": "pharmacy", "phone": "+1-555-0208", "profile": {"pharmacy_name": "TrustMed Pharmacy", "license_number": "PH55667", "city": "San Diego", "address": "999 Beach Blvd, San Diego, CA 92101", "operating_hours": "Mon-Sun: 24 Hours"}},
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
    """Add medicines to pharmacy inventory - 100 medicines across all categories."""
    medicines = [
        # Pain Relief (8 medicines)
        {"medicine_name": "Aspirin", "generic_name": "Acetylsalicylic Acid", "category": "Pain Relief", "quantity": 500, "price_per_unit": 0.50, "unit": "tablets"},
        {"medicine_name": "Ibuprofen", "generic_name": "Ibuprofen", "category": "Pain Relief", "quantity": 400, "price_per_unit": 0.75, "unit": "tablets"},
        {"medicine_name": "Paracetamol", "generic_name": "Acetaminophen", "category": "Pain Relief", "quantity": 600, "price_per_unit": 0.40, "unit": "tablets"},
        {"medicine_name": "Naproxen", "generic_name": "Naproxen Sodium", "category": "Pain Relief", "quantity": 350, "price_per_unit": 0.85, "unit": "tablets"},
        {"medicine_name": "Diclofenac", "generic_name": "Diclofenac Sodium", "category": "Pain Relief", "quantity": 300, "price_per_unit": 0.95, "unit": "tablets"},
        {"medicine_name": "Tramadol", "generic_name": "Tramadol HCl", "category": "Pain Relief", "quantity": 200, "price_per_unit": 1.50, "unit": "tablets"},
        {"medicine_name": "Celecoxib", "generic_name": "Celecoxib", "category": "Pain Relief", "quantity": 250, "price_per_unit": 2.20, "unit": "capsules"},
        {"medicine_name": "Ketorolac", "generic_name": "Ketorolac Tromethamine", "category": "Pain Relief", "quantity": 180, "price_per_unit": 1.80, "unit": "tablets"},
        
        # Antibiotics (12 medicines)
        {"medicine_name": "Amoxicillin", "generic_name": "Amoxicillin", "category": "Antibiotic", "quantity": 250, "price_per_unit": 2.50, "unit": "capsules"},
        {"medicine_name": "Azithromycin", "generic_name": "Azithromycin", "category": "Antibiotic", "quantity": 180, "price_per_unit": 3.20, "unit": "tablets"},
        {"medicine_name": "Ciprofloxacin", "generic_name": "Ciprofloxacin", "category": "Antibiotic", "quantity": 200, "price_per_unit": 2.80, "unit": "tablets"},
        {"medicine_name": "Doxycycline", "generic_name": "Doxycycline Hyclate", "category": "Antibiotic", "quantity": 220, "price_per_unit": 2.60, "unit": "capsules"},
        {"medicine_name": "Cephalexin", "generic_name": "Cephalexin", "category": "Antibiotic", "quantity": 240, "price_per_unit": 2.40, "unit": "capsules"},
        {"medicine_name": "Levofloxacin", "generic_name": "Levofloxacin", "category": "Antibiotic", "quantity": 190, "price_per_unit": 3.50, "unit": "tablets"},
        {"medicine_name": "Clarithromycin", "generic_name": "Clarithromycin", "category": "Antibiotic", "quantity": 170, "price_per_unit": 3.80, "unit": "tablets"},
        {"medicine_name": "Metronidazole", "generic_name": "Metronidazole", "category": "Antibiotic", "quantity": 260, "price_per_unit": 1.90, "unit": "tablets"},
        {"medicine_name": "Clindamycin", "generic_name": "Clindamycin HCl", "category": "Antibiotic", "quantity": 150, "price_per_unit": 3.20, "unit": "capsules"},
        {"medicine_name": "Trimethoprim", "generic_name": "Trimethoprim-Sulfamethoxazole", "category": "Antibiotic", "quantity": 210, "price_per_unit": 2.10, "unit": "tablets"},
        {"medicine_name": "Nitrofurantoin", "generic_name": "Nitrofurantoin", "category": "Antibiotic", "quantity": 180, "price_per_unit": 2.70, "unit": "capsules"},
        {"medicine_name": "Cefuroxime", "generic_name": "Cefuroxime Axetil", "category": "Antibiotic", "quantity": 160, "price_per_unit": 3.40, "unit": "tablets"},
        
        # Cardiovascular (15 medicines)
        {"medicine_name": "Amlodipine", "generic_name": "Amlodipine Besylate", "category": "Cardiovascular", "quantity": 350, "price_per_unit": 1.80, "unit": "tablets"},
        {"medicine_name": "Lisinopril", "generic_name": "Lisinopril", "category": "Cardiovascular", "quantity": 320, "price_per_unit": 1.60, "unit": "tablets"},
        {"medicine_name": "Losartan", "generic_name": "Losartan Potassium", "category": "Cardiovascular", "quantity": 280, "price_per_unit": 2.00, "unit": "tablets"},
        {"medicine_name": "Metoprolol", "generic_name": "Metoprolol Succinate", "category": "Cardiovascular", "quantity": 300, "price_per_unit": 1.90, "unit": "tablets"},
        {"medicine_name": "Atenolol", "generic_name": "Atenolol", "category": "Cardiovascular", "quantity": 290, "price_per_unit": 1.50, "unit": "tablets"},
        {"medicine_name": "Carvedilol", "generic_name": "Carvedilol", "category": "Cardiovascular", "quantity": 250, "price_per_unit": 2.30, "unit": "tablets"},
        {"medicine_name": "Enalapril", "generic_name": "Enalapril Maleate", "category": "Cardiovascular", "quantity": 270, "price_per_unit": 1.70, "unit": "tablets"},
        {"medicine_name": "Valsartan", "generic_name": "Valsartan", "category": "Cardiovascular", "quantity": 260, "price_per_unit": 2.40, "unit": "tablets"},
        {"medicine_name": "Diltiazem", "generic_name": "Diltiazem HCl", "category": "Cardiovascular", "quantity": 240, "price_per_unit": 2.10, "unit": "tablets"},
        {"medicine_name": "Atorvastatin", "generic_name": "Atorvastatin Calcium", "category": "Cardiovascular", "quantity": 300, "price_per_unit": 2.20, "unit": "tablets"},
        {"medicine_name": "Simvastatin", "generic_name": "Simvastatin", "category": "Cardiovascular", "quantity": 250, "price_per_unit": 1.90, "unit": "tablets"},
        {"medicine_name": "Rosuvastatin", "generic_name": "Rosuvastatin Calcium", "category": "Cardiovascular", "quantity": 230, "price_per_unit": 2.60, "unit": "tablets"},
        {"medicine_name": "Clopidogrel", "generic_name": "Clopidogrel Bisulfate", "category": "Cardiovascular", "quantity": 220, "price_per_unit": 2.80, "unit": "tablets"},
        {"medicine_name": "Warfarin", "generic_name": "Warfarin Sodium", "category": "Cardiovascular", "quantity": 200, "price_per_unit": 1.40, "unit": "tablets"},
        {"medicine_name": "Digoxin", "generic_name": "Digoxin", "category": "Cardiovascular", "quantity": 180, "price_per_unit": 1.60, "unit": "tablets"},
        
        # Diabetes (10 medicines)
        {"medicine_name": "Metformin", "generic_name": "Metformin HCl", "category": "Diabetes", "quantity": 400, "price_per_unit": 1.20, "unit": "tablets"},
        {"medicine_name": "Glimepiride", "generic_name": "Glimepiride", "category": "Diabetes", "quantity": 300, "price_per_unit": 1.50, "unit": "tablets"},
        {"medicine_name": "Glyburide", "generic_name": "Glyburide", "category": "Diabetes", "quantity": 280, "price_per_unit": 1.40, "unit": "tablets"},
        {"medicine_name": "Sitagliptin", "generic_name": "Sitagliptin Phosphate", "category": "Diabetes", "quantity": 250, "price_per_unit": 3.50, "unit": "tablets"},
        {"medicine_name": "Pioglitazone", "generic_name": "Pioglitazone HCl", "category": "Diabetes", "quantity": 240, "price_per_unit": 2.80, "unit": "tablets"},
        {"medicine_name": "Glipizide", "generic_name": "Glipizide", "category": "Diabetes", "quantity": 270, "price_per_unit": 1.60, "unit": "tablets"},
        {"medicine_name": "Empagliflozin", "generic_name": "Empagliflozin", "category": "Diabetes", "quantity": 200, "price_per_unit": 4.20, "unit": "tablets"},
        {"medicine_name": "Dapagliflozin", "generic_name": "Dapagliflozin", "category": "Diabetes", "quantity": 190, "price_per_unit": 4.00, "unit": "tablets"},
        {"medicine_name": "Insulin Glargine", "generic_name": "Insulin Glargine", "category": "Diabetes", "quantity": 100, "price_per_unit": 25.00, "unit": "vials"},
        {"medicine_name": "Insulin Lispro", "generic_name": "Insulin Lispro", "category": "Diabetes", "quantity": 90, "price_per_unit": 28.00, "unit": "vials"},
        
        # Respiratory (8 medicines)
        {"medicine_name": "Albuterol", "generic_name": "Albuterol Sulfate", "category": "Respiratory", "quantity": 200, "price_per_unit": 15.00, "unit": "inhalers"},
        {"medicine_name": "Montelukast", "generic_name": "Montelukast Sodium", "category": "Respiratory", "quantity": 300, "price_per_unit": 2.40, "unit": "tablets"},
        {"medicine_name": "Fluticasone", "generic_name": "Fluticasone Propionate", "category": "Respiratory", "quantity": 180, "price_per_unit": 18.00, "unit": "inhalers"},
        {"medicine_name": "Budesonide", "generic_name": "Budesonide", "category": "Respiratory", "quantity": 170, "price_per_unit": 20.00, "unit": "inhalers"},
        {"medicine_name": "Ipratropium", "generic_name": "Ipratropium Bromide", "category": "Respiratory", "quantity": 160, "price_per_unit": 16.00, "unit": "inhalers"},
        {"medicine_name": "Theophylline", "generic_name": "Theophylline", "category": "Respiratory", "quantity": 250, "price_per_unit": 1.80, "unit": "tablets"},
        {"medicine_name": "Guaifenesin", "generic_name": "Guaifenesin", "category": "Respiratory", "quantity": 350, "price_per_unit": 0.90, "unit": "tablets"},
        {"medicine_name": "Dextromethorphan", "generic_name": "Dextromethorphan HBr", "category": "Respiratory", "quantity": 400, "price_per_unit": 0.70, "unit": "tablets"},
        
        # Gastrointestinal (10 medicines)
        {"medicine_name": "Omeprazole", "generic_name": "Omeprazole", "category": "Gastrointestinal", "quantity": 300, "price_per_unit": 1.40, "unit": "capsules"},
        {"medicine_name": "Pantoprazole", "generic_name": "Pantoprazole Sodium", "category": "Gastrointestinal", "quantity": 280, "price_per_unit": 1.60, "unit": "tablets"},
        {"medicine_name": "Esomeprazole", "generic_name": "Esomeprazole Magnesium", "category": "Gastrointestinal", "quantity": 260, "price_per_unit": 1.80, "unit": "capsules"},
        {"medicine_name": "Ranitidine", "generic_name": "Ranitidine HCl", "category": "Gastrointestinal", "quantity": 280, "price_per_unit": 1.10, "unit": "tablets"},
        {"medicine_name": "Famotidine", "generic_name": "Famotidine", "category": "Gastrointestinal", "quantity": 270, "price_per_unit": 1.20, "unit": "tablets"},
        {"medicine_name": "Ondansetron", "generic_name": "Ondansetron HCl", "category": "Gastrointestinal", "quantity": 200, "price_per_unit": 2.50, "unit": "tablets"},
        {"medicine_name": "Loperamide", "generic_name": "Loperamide HCl", "category": "Gastrointestinal", "quantity": 350, "price_per_unit": 0.80, "unit": "capsules"},
        {"medicine_name": "Bisacodyl", "generic_name": "Bisacodyl", "category": "Gastrointestinal", "quantity": 400, "price_per_unit": 0.60, "unit": "tablets"},
        {"medicine_name": "Docusate", "generic_name": "Docusate Sodium", "category": "Gastrointestinal", "quantity": 380, "price_per_unit": 0.70, "unit": "capsules"},
        {"medicine_name": "Mesalamine", "generic_name": "Mesalamine", "category": "Gastrointestinal", "quantity": 220, "price_per_unit": 3.20, "unit": "tablets"},
        
        # Allergy (6 medicines)
        {"medicine_name": "Cetirizine", "generic_name": "Cetirizine HCl", "category": "Allergy", "quantity": 400, "price_per_unit": 0.60, "unit": "tablets"},
        {"medicine_name": "Loratadine", "generic_name": "Loratadine", "category": "Allergy", "quantity": 350, "price_per_unit": 0.70, "unit": "tablets"},
        {"medicine_name": "Fexofenadine", "generic_name": "Fexofenadine HCl", "category": "Allergy", "quantity": 320, "price_per_unit": 0.85, "unit": "tablets"},
        {"medicine_name": "Diphenhydramine", "generic_name": "Diphenhydramine HCl", "category": "Allergy", "quantity": 450, "price_per_unit": 0.50, "unit": "capsules"},
        {"medicine_name": "Chlorpheniramine", "generic_name": "Chlorpheniramine Maleate", "category": "Allergy", "quantity": 380, "price_per_unit": 0.55, "unit": "tablets"},
        {"medicine_name": "Desloratadine", "generic_name": "Desloratadine", "category": "Allergy", "quantity": 300, "price_per_unit": 0.95, "unit": "tablets"},
        
        # Mental Health (8 medicines)
        {"medicine_name": "Sertraline", "generic_name": "Sertraline HCl", "category": "Mental Health", "quantity": 250, "price_per_unit": 2.20, "unit": "tablets"},
        {"medicine_name": "Fluoxetine", "generic_name": "Fluoxetine HCl", "category": "Mental Health", "quantity": 240, "price_per_unit": 2.00, "unit": "capsules"},
        {"medicine_name": "Escitalopram", "generic_name": "Escitalopram Oxalate", "category": "Mental Health", "quantity": 230, "price_per_unit": 2.40, "unit": "tablets"},
        {"medicine_name": "Alprazolam", "generic_name": "Alprazolam", "category": "Mental Health", "quantity": 200, "price_per_unit": 1.80, "unit": "tablets"},
        {"medicine_name": "Lorazepam", "generic_name": "Lorazepam", "category": "Mental Health", "quantity": 190, "price_per_unit": 1.60, "unit": "tablets"},
        {"medicine_name": "Clonazepam", "generic_name": "Clonazepam", "category": "Mental Health", "quantity": 180, "price_per_unit": 1.70, "unit": "tablets"},
        {"medicine_name": "Bupropion", "generic_name": "Bupropion HCl", "category": "Mental Health", "quantity": 220, "price_per_unit": 2.60, "unit": "tablets"},
        {"medicine_name": "Venlafaxine", "generic_name": "Venlafaxine HCl", "category": "Mental Health", "quantity": 210, "price_per_unit": 2.50, "unit": "capsules"},
        
        # Thyroid (3 medicines)
        {"medicine_name": "Levothyroxine", "generic_name": "Levothyroxine Sodium", "category": "Thyroid", "quantity": 400, "price_per_unit": 1.20, "unit": "tablets"},
        {"medicine_name": "Liothyronine", "generic_name": "Liothyronine Sodium", "category": "Thyroid", "quantity": 200, "price_per_unit": 2.80, "unit": "tablets"},
        {"medicine_name": "Methimazole", "generic_name": "Methimazole", "category": "Thyroid", "quantity": 180, "price_per_unit": 2.40, "unit": "tablets"},
        
        # Vitamins & Supplements (10 medicines)
        {"medicine_name": "Vitamin D3", "generic_name": "Cholecalciferol", "category": "Vitamin", "quantity": 500, "price_per_unit": 0.80, "unit": "capsules"},
        {"medicine_name": "Vitamin B12", "generic_name": "Cyanocobalamin", "category": "Vitamin", "quantity": 450, "price_per_unit": 0.90, "unit": "tablets"},
        {"medicine_name": "Multivitamin", "generic_name": "Multivitamin", "category": "Vitamin", "quantity": 400, "price_per_unit": 1.50, "unit": "tablets"},
        {"medicine_name": "Vitamin C", "generic_name": "Ascorbic Acid", "category": "Vitamin", "quantity": 480, "price_per_unit": 0.60, "unit": "tablets"},
        {"medicine_name": "Folic Acid", "generic_name": "Folic Acid", "category": "Vitamin", "quantity": 420, "price_per_unit": 0.70, "unit": "tablets"},
        {"medicine_name": "Iron Supplement", "generic_name": "Ferrous Sulfate", "category": "Vitamin", "quantity": 380, "price_per_unit": 0.85, "unit": "tablets"},
        {"medicine_name": "Calcium Carbonate", "generic_name": "Calcium Carbonate", "category": "Vitamin", "quantity": 400, "price_per_unit": 0.75, "unit": "tablets"},
        {"medicine_name": "Magnesium", "generic_name": "Magnesium Oxide", "category": "Vitamin", "quantity": 360, "price_per_unit": 0.80, "unit": "tablets"},
        {"medicine_name": "Zinc Supplement", "generic_name": "Zinc Sulfate", "category": "Vitamin", "quantity": 340, "price_per_unit": 0.90, "unit": "tablets"},
        {"medicine_name": "Omega-3", "generic_name": "Fish Oil", "category": "Vitamin", "quantity": 320, "price_per_unit": 1.20, "unit": "capsules"},
        
        # Dermatology (5 medicines)
        {"medicine_name": "Hydrocortisone Cream", "generic_name": "Hydrocortisone", "category": "Dermatology", "quantity": 250, "price_per_unit": 5.00, "unit": "tubes"},
        {"medicine_name": "Clotrimazole Cream", "generic_name": "Clotrimazole", "category": "Dermatology", "quantity": 230, "price_per_unit": 6.00, "unit": "tubes"},
        {"medicine_name": "Tretinoin Cream", "generic_name": "Tretinoin", "category": "Dermatology", "quantity": 180, "price_per_unit": 12.00, "unit": "tubes"},
        {"medicine_name": "Benzoyl Peroxide", "generic_name": "Benzoyl Peroxide", "category": "Dermatology", "quantity": 200, "price_per_unit": 8.00, "unit": "tubes"},
        {"medicine_name": "Mupirocin Ointment", "generic_name": "Mupirocin", "category": "Dermatology", "quantity": 190, "price_per_unit": 10.00, "unit": "tubes"},
        
        # Eye Care (3 medicines)
        {"medicine_name": "Artificial Tears", "generic_name": "Polyethylene Glycol", "category": "Eye Care", "quantity": 300, "price_per_unit": 4.00, "unit": "bottles"},
        {"medicine_name": "Timolol Eye Drops", "generic_name": "Timolol Maleate", "category": "Eye Care", "quantity": 150, "price_per_unit": 12.00, "unit": "bottles"},
        {"medicine_name": "Latanoprost", "generic_name": "Latanoprost", "category": "Eye Care", "quantity": 120, "price_per_unit": 18.00, "unit": "bottles"},
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
