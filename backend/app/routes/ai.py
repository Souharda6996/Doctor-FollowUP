from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from app.dependencies import get_current_user
from app.models.user import UserProfile
from app.models.symptom import SymptomAnalysis, SymptomAnalysisRequest
from app.services.claude_service import claude_service
from app.services.vector_service import vector_service
from app.services.remedy_service import remedy_service
from typing import List

router = APIRouter(prefix="/ai", tags=["ai"])

@router.post("/analyze", response_model=SymptomAnalysis)
async def analyze_symptoms(
    request: SymptomAnalysisRequest,
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Analyzes symptoms and returns structured remedy suggestions.
    """
    # 1. AI Analysis
    ai_response = await claude_service.analyze_symptoms(request.symptoms, request.language)
    
    # 2. Get Vector search for real remedies (enrichment)
    # Placeholder: Usually we embed the symptoms to search
    # query_embedding = await claude_service.generate_embedding(" ".join(request.symptoms))
    # similar_remedies = await vector_service.match_remedies(query_embedding)
    
    # 3. Simple matching for demo (fallback)
    remedies = await remedy_service.get_all_remedies()
    
    return SymptomAnalysis(
        remedies=remedies[:3], # Return top 3
        explanation=ai_response["content"],
        dosage_instructions="Standard homeopathic dosage: 4 pills, 3 times daily.",
        lifestyle_advice="Avoid coffee and menthol during medication.",
        when_to_see_doctor="Seek medical help if high fever or breathing difficulty occurs.",
        disclaimer="AI-generated suggestions. Consult a professional physician.",
        language=request.language
    )

@router.get("/stream")
async def stream_analysis(
    symptoms: str = Query(...), # Comma separated
    lang: str = Query("en"),
    token: str = Query(...) # token passed in URL for EventSource
):
    """
    Streams AI analysis via Server-Sent Events (SSE).
    Note: Auth handled via token query param for EventSource compatibility.
    """
    symptom_list = symptoms.split(",")
    return StreamingResponse(
        claude_service.stream_analysis(symptom_list, lang),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
