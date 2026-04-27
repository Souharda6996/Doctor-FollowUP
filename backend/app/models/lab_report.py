from pydantic import BaseModel
from typing import List, Optional, Literal
from datetime import date


class LabValue(BaseModel):
    name: str
    result: str
    unit: str
    status: Literal["GREEN", "YELLOW", "RED"]
    plain_english_explanation: str


class LabReportBase(BaseModel):
    report_date: date
    overall_status: Literal["GREEN", "YELLOW", "RED"] = "GREEN"
    summary_text: Optional[str] = None
    values: List[LabValue] = []


class LabReportCreate(LabReportBase):
    patient_id: str


class LabReport(LabReportBase):
    id: str
    patient_id: str
    doctor_id: Optional[str] = None
    file_url: Optional[str] = None

    model_config = {"from_attributes": True}


class LabReportAnalysisRequest(BaseModel):
    text: str
    patient_id: Optional[str] = None
