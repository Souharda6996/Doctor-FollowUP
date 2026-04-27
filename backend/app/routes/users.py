from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.models.user import UserProfile
from app.database import supabase
from typing import Any, Dict

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/profile", response_model=UserProfile)
async def get_user_profile(current_user: UserProfile = Depends(get_current_user)):
    """
    Returns the user profile.
    """
    return current_user

@router.put("/profile", response_model=UserProfile)
async def update_user_profile(
    data: Dict[str, Any],
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Updates the user profile (e.g., language preference).
    """
    allowed_fields = ["display_name", "language_preference"]
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    res = supabase.table("users").update(update_data).eq("id", current_user.id).execute()
    
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to update profile")
        
    return UserProfile(**res.data[0])
