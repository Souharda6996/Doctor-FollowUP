from fastapi import APIRouter, Depends, HTTPException
from app.services.remedy_service import remedy_service
from app.models.remedy import Remedy
from app.dependencies import get_current_user
from app.models.user import UserProfile
from typing import List

router = APIRouter(prefix="/remedies", tags=["remedies"])

@router.get("/", response_model=List[Remedy])
async def list_remedies(current_user: UserProfile = Depends(get_current_user)):
    """
    Returns all remedies in the system.
    """
    return await remedy_service.get_all_remedies()

@router.get("/{remedy_id}", response_model=Remedy)
async def get_remedy(remedy_id: str, current_user: UserProfile = Depends(get_current_user)):
    """
    Returns a specific remedy by ID.
    """
    remedy = await remedy_service.get_remedy_by_id(remedy_id)
    if not remedy:
        raise HTTPException(status_code=404, detail="Remedy not found")
    return remedy
