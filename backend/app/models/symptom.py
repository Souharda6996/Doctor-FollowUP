from pydantic import BaseModel
from typing import List, Optional


class SymptomAnalysisRequest(BaseModel):
    symptoms: List[str]
    language: str = "en"
    patient_id: Optional[str] = None
    specialty: Optional[str] = None   # hint for AI context
    patient_history_summary: Optional[str] = None


class LabAnalysisResult(BaseModel):
    overall_status: str
    summary_text: str
    values: List[dict]
