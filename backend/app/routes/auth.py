from fastapi import APIRouter, Depends, Header, HTTPException, Body
from app.services.firebase_service import firebase_service
from app.dependencies import get_current_user
from app.models.user import UserProfile, UserRole
from typing import Optional

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/sync-user", response_model=UserProfile)
async def sync_user(
    authorization: str = Header(...),
    role: Optional[UserRole] = Body(None, embed=True),
):
    """
    Syncs Firebase user with Supabase database on login.
    Optionally sets the user's role (doctor / patient / caretaker).
    Called by frontend on every successful auth.
    """
    token = authorization.replace("Bearer ", "")
    return await firebase_service.sync_user(token, role=role)


@router.get("/me", response_model=UserProfile)
async def get_me(current_user: UserProfile = Depends(get_current_user)):
    """Returns the current authenticated user's profile."""
    return current_user


@router.patch("/role")
async def update_role(
    role: UserRole = Body(..., embed=True),
    current_user: UserProfile = Depends(get_current_user),
):
    """
    Updates the calling user's role.
    Can only be set once (first login) unless admin overrides.
    """
    from app.database import supabase
    res = supabase.table("users").update({"role": role}).eq("id", current_user.id).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to update role")
    return {"success": True, "role": role}


@router.post("/verify")
async def verify_auth(current_user: UserProfile = Depends(get_current_user)):
    """Simple token verification endpoint."""
    return {
        "status": "authenticated",
        "uid": current_user.firebase_uid,
        "role": current_user.role,
    }
