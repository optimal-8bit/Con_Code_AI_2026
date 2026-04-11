from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date

class MealEntry(BaseModel):
    meal_type: str  # breakfast, lunch, dinner
    foods: str
    calories: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class DailyCalories(BaseModel):
    patient_id: str
    date: date
    breakfast: Optional[MealEntry] = None
    lunch: Optional[MealEntry] = None
    dinner: Optional[MealEntry] = None
    total_calories: float = 0.0
    exceeded_limit: bool = False
    calorie_limit: float = 2000.0  # Default daily limit

class CalorieEntryRequest(BaseModel):
    date: str  # YYYY-MM-DD format
    meal_type: str  # breakfast, lunch, dinner
    foods: str

class CalorieResponse(BaseModel):
    date: str
    meal_type: str
    foods: str
    calories: float
    total_daily_calories: float
    exceeded_limit: bool

class MonthlyCaloriesResponse(BaseModel):
    year: int
    month: int
    daily_data: List[dict]
    max_calories: float
