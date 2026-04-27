from pydantic import BaseModel
from typing import List, Literal
from .remedy import Remedy

class SymptomAnalysis(BaseModel):
    remedies: List[Remedy]
    explanation: str
    dosage_instructions: str
    lifestyle_advice: str
    when_to_see_doctor: str
    disclaimer: str
    language: Literal["en", "hi"] = "en"

class SymptomAnalysisRequest(BaseModel):
    symptoms: List[str]
    language: Literal["en", "hi"] = "en"
