from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from app.dependencies import get_current_user
from app.models.user import UserProfile
from app.models.symptom import SymptomAnalysisRequest, LabAnalysisResult
from app.services.claude_service import claude_service
from typing import Optional

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/analyze")
async def analyze_symptoms(
    request: SymptomAnalysisRequest,
    current_user: UserProfile = Depends(get_current_user),
):
    """
    Analyzes symptoms and returns structured clinical analysis.
    Works for ANY medical specialty — general, cardiac, homeopathy, etc.
    """
    result = await claude_service.analyze_symptoms(
        symptoms=request.symptoms,
        language=request.language,
        specialty=request.specialty,
        patient_history_summary=request.patient_history_summary,
    )
    return {"success": True, "data": result, "message": "Analysis complete"}


@router.post("/analyze-lab")
async def analyze_lab_report(
    body: dict,
    current_user: UserProfile = Depends(get_current_user),
):
    """
    Parses raw lab report text and returns structured traffic-light data.
    """
    report_text = body.get("text", "")
    if not report_text:
        raise HTTPException(status_code=400, detail="No report text provided")
    result = await claude_service.analyze_lab_report(report_text)
    return {"success": True, "data": result}


@router.post("/quick-ask-draft")
async def draft_quick_ask_reply(
    body: dict,
    current_user: UserProfile = Depends(get_current_user),
):
    """
    AI-drafts a reply to a patient's Quick Ask for the doctor to review.
    Doctor role only.
    """
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Doctors only")
    question = body.get("question", "")
    patient_summary = body.get("patient_summary", "")
    specialty = body.get("specialty")
    reply = await claude_service.answer_quick_ask(
        question=question,
        patient_summary=patient_summary,
        language=current_user.language_preference,
        specialty=specialty,
    )
    return {"success": True, "data": {"draft_reply": reply}}


@router.get("/stream")
async def stream_analysis(
    symptoms: str = Query(..., description="Comma-separated symptom list"),
    lang: str = Query("en"),
    specialty: Optional[str] = Query(None),
    token: str = Query(..., description="Firebase ID token for EventSource auth"),
):
    """
    Streams clinical analysis via Server-Sent Events (SSE).
    Token passed as query param because EventSource doesn't support headers.
    """
    symptom_list = [s.strip() for s in symptoms.split(",") if s.strip()]
    return StreamingResponse(
        claude_service.stream_analysis(symptom_list, lang, specialty),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
