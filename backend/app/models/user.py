from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, Literal

class UserBase(BaseModel):
    firebase_uid: str
    email: str
    display_name: Optional[str] = None
    language_preference: Literal["en", "hi"] = "en"

class UserCreate(UserBase):
    pass

class UserProfile(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
