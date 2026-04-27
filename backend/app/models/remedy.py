from pydantic import BaseModel
from typing import List, Optional

class RemedyBase(BaseModel):
    name: str
    common_name: Optional[str] = None
    symptoms_treated: List[str]
    potency: str
    description: str
    contraindications: str

class Remedy(RemedyBase):
    id: str
    similarity_score: Optional[float] = None
    explanation: Optional[str] = None

    class Config:
        from_attributes = True

class RemedySearchRequest(BaseModel):
    symptoms: List[str]
    top_k: int = 5
