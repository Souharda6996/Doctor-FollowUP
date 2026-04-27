from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.models.user import UserProfile
from app.models.remedy import Remedy, RemedySearchRequest
from app.services.vector_service import vector_service
from app.services.groq_service import groq_service
from app.services.remedy_service import remedy_service
from typing import List

router = APIRouter(prefix="/ai", tags=["ai-search"])

@router.post("/remedy-search", response_model=List[Remedy])
async def search_remedies(
    request: RemedySearchRequest,
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Performs AI-powered semantic search for remedies based on symptoms.
    Uses local embeddings (SentenceTransformers) and Groq for explanations.
    """
    try:
        # 1. Prepare query text
        query_text = f"Patient symptoms: {', '.join(request.symptoms)}"
        
        # 2. Vector search (generates embedding internally)
        matches = await vector_service.match_remedies(
            query_text, 
            top_k=request.top_k,
            threshold=0.3 # Lower threshold for better matches in small datasets
        )
        
        if not matches:
            return []
            
        results = []
        for match in matches:
            # 3. Fetch full remedy details
            remedy = await remedy_service.get_remedy_by_id(match["id"])
            if remedy:
                remedy.similarity_score = match["similarity"]
                
                # 4. Use Groq to explain WHY this fits (for the top result primarily, or all if needed)
                # We do it for the top result to ensure speed, or skip if similarity is too low
                if match == matches[0]:
                    explanation = await groq_service.explain_remedy(
                        remedy.name, 
                        ", ".join(request.symptoms)
                    )
                    remedy.explanation = explanation
                
                results.append(remedy)
                    
        return results

    except Exception as e:
        print(f"❌ Search Route Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Remedy search failed.")
