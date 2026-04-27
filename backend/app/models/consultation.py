from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Literal, Optional
from .remedy import Remedy

class ConsultationMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ConsultationBase(BaseModel):
    session_id: str
    language: Literal["en", "hi"] = "en"
    status: Literal["active", "completed"] = "active"

class ConsultationCreate(ConsultationBase):
    symptoms: List[str]

class Consultation(ConsultationBase):
    id: str
    user_id: str
    messages: List[ConsultationMessage]
    remedy_suggestions: List[Remedy]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MessageRequest(BaseModel):
    message: str
