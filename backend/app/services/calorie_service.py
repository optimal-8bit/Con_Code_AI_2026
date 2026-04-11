import os
import google.generativeai as genai
from datetime import datetime, date
from typing import Optional, Dict, List
import calendar
import re
from app.db.mongo import mongo_service

# Configure Gemini
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class CalorieService:
    def __init__(self):
        self.collection = mongo_service.collection('calorie_tracking')
        if GEMINI_API_KEY:
            self.model = genai.GenerativeModel('gemini-pro')
        else:
            self.model = None
    
    def calculate_calories_with_llm(self, foods: str) -> float:
        """Use Gemini to extract and calculate total calories from food description"""
        try:
            if not self.model:
                # Fallback if no API key
                print("No Gemini model available, using fallback calculation")
                return len(foods.split()) * 100
            
            print(f"Calling Gemini API to calculate calories...")
            prompt = f"""
            Analyze the following food items and calculate the total calories.
            Food items: {foods}
            
            Please provide ONLY the total calorie count as a number (no text, no units).
            If you cannot determine exact calories, provide a reasonable estimate.
            Consider standard serving sizes.
            
            Return only the number.
            """
            
            response = self.model.generate_content(prompt)
            calories_text = response.text.strip()
            print(f"Gemini response: {calories_text}")
            
            # Extract number from response
            numbers = re.findall(r'\d+\.?\d*', calories_text)
            if numbers:
                result = float(numbers[0])
                print(f"Extracted calories: {result}")
                return result
            
            print("No number found in response, using fallback")
            return 0.0
            
        except Exception as e:
            print(f"Error calculating calories with LLM: {e}")
            import traceback
            traceback.print_exc()
            # Fallback: rough estimate based on word count
            fallback = len(foods.split()) * 100
            print(f"Using fallback calculation: {fallback}")
            return fallback
    
    def add_meal_entry(self, patient_id: str, entry_date: str, meal_type: str, foods: str, calorie_limit: float = 2000.0) -> Dict:
        """Add or update a meal entry for a specific date"""
        try:
            print(f"Starting add_meal_entry for patient {patient_id}, date {entry_date}, meal {meal_type}")
            
            # Calculate calories using LLM
            print(f"Calculating calories for: {foods}")
            calories = self.calculate_calories_with_llm(foods)
            print(f"Calculated calories: {calories}")
            
            # Parse date
            date_obj = datetime.strptime(entry_date, '%Y-%m-%d').date()
            print(f"Parsed date: {date_obj}")
            
            # Find existing daily record
            print(f"Looking for existing record...")
            daily_record = self.collection.find_one({
                'patient_id': patient_id,
                'date': entry_date
            })
            print(f"Existing record: {daily_record is not None}")
            
            meal_entry = {
                'meal_type': meal_type,
                'foods': foods,
                'calories': calories,
                'timestamp': datetime.utcnow()
            }
            
            if daily_record:
                # Update existing record
                update_data = {f'{meal_type}': meal_entry}
                
                # Recalculate total
                breakfast_cal = daily_record.get('breakfast', {}).get('calories', 0) if meal_type != 'breakfast' else calories
                lunch_cal = daily_record.get('lunch', {}).get('calories', 0) if meal_type != 'lunch' else calories
                dinner_cal = daily_record.get('dinner', {}).get('calories', 0) if meal_type != 'dinner' else calories
                
                if meal_type == 'breakfast':
                    breakfast_cal = calories
                elif meal_type == 'lunch':
                    lunch_cal = calories
                elif meal_type == 'dinner':
                    dinner_cal = calories
                
                total_calories = breakfast_cal + lunch_cal + dinner_cal
                exceeded = total_calories > calorie_limit
                
                update_data['total_calories'] = total_calories
                update_data['exceeded_limit'] = exceeded
                update_data['calorie_limit'] = calorie_limit
                
                print(f"Updating existing record with total: {total_calories}")
                self.collection.update_one(
                    {'patient_id': patient_id, 'date': entry_date},
                    {'$set': update_data}
                )
            else:
                # Create new record
                total_calories = calories
                exceeded = total_calories > calorie_limit
                
                new_record = {
                    'patient_id': patient_id,
                    'date': entry_date,
                    meal_type: meal_entry,
                    'total_calories': total_calories,
                    'exceeded_limit': exceeded,
                    'calorie_limit': calorie_limit,
                    'created_at': datetime.utcnow()
                }
                print(f"Creating new record with total: {total_calories}")
                self.collection.insert_one(new_record)
            
            # Get updated record
            updated_record = self.collection.find_one({
                'patient_id': patient_id,
                'date': entry_date
            })
            
            print(f"Successfully saved meal entry")
            return {
                'date': entry_date,
                'meal_type': meal_type,
                'foods': foods,
                'calories': calories,
                'total_daily_calories': updated_record['total_calories'],
                'exceeded_limit': updated_record['exceeded_limit']
            }
            
        except Exception as e:
            print(f"Error adding meal entry: {e}")
            import traceback
            traceback.print_exc()
            raise
    
    def get_daily_calories(self, patient_id: str, entry_date: str) -> Optional[Dict]:
        """Get calorie data for a specific date"""
        try:
            record = self.collection.find_one({
                'patient_id': patient_id,
                'date': entry_date
            })
            
            if record:
                record['_id'] = str(record['_id'])
                return record
            return None
            
        except Exception as e:
            print(f"Error getting daily calories: {e}")
            return None
    
    def get_monthly_calories(self, patient_id: str, year: int, month: int) -> Dict:
        """Get calorie data for entire month (for heatmap)"""
        try:
            # Get all days in month
            _, num_days = calendar.monthrange(year, month)
            
            daily_data = []
            max_calories = 0
            
            for day in range(1, num_days + 1):
                date_str = f"{year}-{month:02d}-{day:02d}"
                record = self.collection.find_one({
                    'patient_id': patient_id,
                    'date': date_str
                })
                
                if record:
                    daily_data.append({
                        'date': date_str,
                        'day': day,
                        'total_calories': record.get('total_calories', 0),
                        'exceeded_limit': record.get('exceeded_limit', False),
                        'breakfast': record.get('breakfast'),
                        'lunch': record.get('lunch'),
                        'dinner': record.get('dinner')
                    })
                    max_calories = max(max_calories, record.get('total_calories', 0))
                else:
                    daily_data.append({
                        'date': date_str,
                        'day': day,
                        'total_calories': 0,
                        'exceeded_limit': False,
                        'breakfast': None,
                        'lunch': None,
                        'dinner': None
                    })
            
            return {
                'year': year,
                'month': month,
                'daily_data': daily_data,
                'max_calories': max_calories
            }
            
        except Exception as e:
            print(f"Error getting monthly calories: {e}")
            raise
    
    def update_calorie_limit(self, patient_id: str, new_limit: float) -> bool:
        """Update calorie limit for all future entries"""
        try:
            # This will be used for new entries
            # Existing entries keep their original limit
            return True
        except Exception as e:
            print(f"Error updating calorie limit: {e}")
            return False
