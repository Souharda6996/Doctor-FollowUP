from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.models.user import UserProfile
from app.models.consultation import Consultation, ConsultationCreate, MessageRequest, ConsultationMessage
from app.services.claude_service import claude_service
from app.database import supabase
from datetime import datetime
from typing import List
import uuid

router = APIRouter(prefix="/consultations", tags=["consultations"])

@router.get("/", response_model=List[Consultation])
async def list_consultations(current_user: UserProfile = Depends(get_current_user)):
    """
    Returns the user's consultation history.
    """
    res = supabase.table("consultations").select("*").eq("user_id", current_user.id).execute()
    return res.data

@router.post("/start", response_model=Consultation)
async def start_consultation(
    request: ConsultationCreate, 
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Initializes a new AI consultation session.
    """
    session_id = str(uuid.uuid4())
    
    # 1. Get Initial AI analysis (simplified)
    analysis = await claude_service.analyze_symptoms(request.symptoms, request.language)
    
    first_msg = ConsultationMessage(role="assistant", content=analysis["content"])
    
    new_cons = {
        "user_id": current_user.id,
        "session_id": session_id,
        "language": request.language,
        "messages": [first_msg.model_dump(mode='json')], # Fixed for Pydantic v2
        "status": "active",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    res = supabase.table("consultations").insert(new_cons).execute()
    return res.data[0]

@router.post("/{cons_id}/message", response_model=Consultation)
async def send_message(
    cons_id: str,
    request: MessageRequest,
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Sends a new message to an existing consultation.
    """
    # 1. Get history
    res = supabase.table("consultations").select("*").eq("id", cons_id).eq("user_id", current_user.id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Consultation not found")
    
    consultation = res.data[0]
    history = consultation["messages"]
    
    # 2. Add user message
    user_msg = ConsultationMessage(role="user", content=request.message)
    history.append(user_msg.model_dump(mode='json'))
    
    # 3. Get AI reply (stubbed logic for simplicity)
    # In production, we'd call claude_service.continue_consultation
    ai_reply = "Based on your symptoms, we should monitor any changes in intensity. Have you noticed any improvement with the previous remedy?"
    assistant_msg = ConsultationMessage(role="assistant", content=ai_reply)
    history.append(assistant_msg.model_dump(mode='json'))
    
    # 4. Update DB
    update_data = {
        "messages": history,
        "updated_at": datetime.utcnow().isoformat()
    }
    update_res = supabase.table("consultations").update(update_data).eq("id", cons_id).execute()
    
    return update_res.data[0]
