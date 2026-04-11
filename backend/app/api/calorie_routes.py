from fastapi import APIRouter, Depends, HTTPException
from app.core.security import get_current_user
from app.db.mongo import mongo_service
from app.services.calorie_service import CalorieService
from app.models.calorie_schemas import CalorieEntryRequest, CalorieResponse, MonthlyCaloriesResponse
from datetime import datetime

router = APIRouter(prefix="/calories", tags=["calories"])

@router.post("/entry")
def add_calorie_entry(
    entry: CalorieEntryRequest,
    current_user: dict = Depends(get_current_user)
):
    """Add or update a meal entry"""
    try:
        print(f"Received entry request: {entry}")
        print(f"Current user: {current_user}")
        
        if current_user['role'] != 'patient':
            raise HTTPException(status_code=403, detail="Only patients can track calories")
        
        calorie_service = CalorieService()
        
        result = calorie_service.add_meal_entry(
            patient_id=current_user['sub'],
            entry_date=entry.date,
            meal_type=entry.meal_type,
            foods=entry.foods
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in add_calorie_entry: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/daily/{date}")
def get_daily_calories(
    date: str,
    current_user: dict = Depends(get_current_user)
):
    """Get calorie data for a specific date"""
    try:
        if current_user['role'] != 'patient':
            raise HTTPException(status_code=403, detail="Only patients can view calorie data")
        
        calorie_service = CalorieService()
        result = calorie_service.get_daily_calories(
            patient_id=current_user['sub'],
            entry_date=date
        )
        
        if result:
            return result
        
        # Return empty structure if no data
        return {
            'date': date,
            'breakfast': None,
            'lunch': None,
            'dinner': None,
            'total_calories': 0,
            'exceeded_limit': False
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_daily_calories: {e}")
        import traceback
        traceback.print_exc()
        # Return empty structure on error
        return {
            'date': date,
            'breakfast': None,
            'lunch': None,
            'dinner': None,
            'total_calories': 0,
            'exceeded_limit': False
        }

@router.get("/monthly/{year}/{month}")
def get_monthly_calories(
    year: int,
    month: int,
    current_user: dict = Depends(get_current_user)
):
    """Get calorie data for entire month (for heatmap)"""
    try:
        if current_user['role'] != 'patient':
            raise HTTPException(status_code=403, detail="Only patients can view calorie data")
        
        calorie_service = CalorieService()
        result = calorie_service.get_monthly_calories(
            patient_id=current_user['sub'],
            year=year,
            month=month
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_monthly_calories: {e}")
        import traceback
        traceback.print_exc()
        # Return empty structure on error
        return {
            'year': year,
            'month': month,
            'daily_data': [],
            'max_calories': 0
        }
