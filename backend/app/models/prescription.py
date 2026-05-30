from pydantic import BaseModel
from typing import List, Optional
from datetime import date


class PrescriptionBase(BaseModel):
    name: str
    dosage: str
    times: List[str]        # ["morning", "afternoon", "night"]
    frequency: Optional[str] = None
    duration: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    notes: Optional[str] = None


class PrescriptionCreate(PrescriptionBase):
    patient_id: str


class Prescription(PrescriptionBase):
    id: str
    patient_id: str
    doctor_id: str
    is_active: bool = True

    model_config = {"from_attributes": True}


# Keep "Remedy" as an alias for backward compat with frontend types
Remedy = Prescription


class PrescriptionSearchRequest(BaseModel):
    symptoms: List[str]
    top_k: int = 5
