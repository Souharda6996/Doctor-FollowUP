from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
from typing import Optional, Literal

UserRole = Literal["doctor", "patient", "caretaker"]
LanguageCode = Literal["en", "hi", "kn", "ta", "bn", "mr", "te", "gu"]


class UserBase(BaseModel):
    firebase_uid: str
    email: Optional[str] = None
    phone: Optional[str] = None
    display_name: Optional[str] = None
    role: UserRole = "patient"
    language_preference: LanguageCode = "en"


class UserCreate(UserBase):
    pass


class UserProfile(UserBase):
    id: str
    is_active: bool = True
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DoctorProfile(BaseModel):
    id: str
    user_id: str
    specialty: str
    qualification: Optional[str] = None
    registration_no: Optional[str] = None
    hospital: Optional[str] = None
    bio: Optional[str] = None
    consultation_fee: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PatientProfileBase(BaseModel):
    doctor_id: str
    age: Optional[int] = None
    gender: Optional[Literal["male", "female", "other"]] = None
    blood_group: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    status: Literal["improving", "stable", "moderate", "critical"] = "stable"
    case_type: Literal["chronic", "acute"] = "acute"
    chief_complaint: str


class PatientProfile(PatientProfileBase):
    id: str
    user_id: str
    silence_days: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
