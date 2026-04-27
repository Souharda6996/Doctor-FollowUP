from fastapi import APIRouter, Depends, Header
from app.services.firebase_service import firebase_service
from app.dependencies import get_current_user
from app.models.user import UserProfile
from datetime import datetime

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/sync-user", response_model=UserProfile)
async def sync_user(authorization: str = Header(...)):
    """
    Syncs Firebase user with Supabase database.
    Called by frontend on login.
    """
    token = authorization.replace("Bearer ", "")
    return await firebase_service.sync_user(token)

@router.get("/me", response_model=UserProfile)
async def get_me(current_user: UserProfile = Depends(get_current_user)):
    """
    Returns the current authenticated user's profile.
    """
    return current_user

@router.post("/verify")
async def verify_auth(current_user: UserProfile = Depends(get_current_user)):
    """
    Simple verification check.
    """
    return {"status": "authenticated", "uid": current_user.firebase_uid}
