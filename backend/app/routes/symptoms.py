from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.models.user import UserProfile
from app.models.symptom import SymptomAnalysisRequest
from app.database import supabase
from datetime import datetime

router = APIRouter(prefix="/symptoms", tags=["symptoms"])

@router.post("/log")
async def log_symptoms(
    request: SymptomAnalysisRequest, 
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Logs patient symptoms to the database.
    """
    new_report = {
        "user_id": current_user.id,
        "symptoms": request.symptoms,
        "language": request.language,
        "created_at": datetime.utcnow().isoformat()
    }
    
    res = supabase.table("symptom_reports").insert(new_report).execute()
    return {"success": True, "data": res.data[0]}
