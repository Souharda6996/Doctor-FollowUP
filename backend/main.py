import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
from groq import Groq
from pypdf import PdfReader
import io

# Load environment variables
load_dotenv()

app = FastAPI(title="FollowUp Care - Medical Backend", version="1.0.0")

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# AI Client Initialization
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class LabResult(BaseModel):
    name: str
    result: str
    unit: str
    status: str
    explanation: str

class AnalysisResponse(BaseModel):
    values: List[LabResult]
    overall_status: str
    summary: str

@app.get("/")
async def root():
    return {"status": "healthy", "service": "FollowUp Care API"}

@app.post("/analyze-report", response_model=AnalysisResponse)
async def analyze_report(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF reports are supported")
    
    try:
        # Read PDF content
        contents = await file.read()
        pdf = PdfReader(io.BytesIO(contents))
        text = ""
        for page in pdf.pages:
            text += page.extract_text()
            
        # AI Analysis via Groq
        prompt = f"""
        Extract lab values from this medical report and return as JSON.
        Classify each as GREEN (normal), YELLOW (borderline), or RED (abnormal).
        Provide a plain-English explanation for each.
        
        Report Text:
        {text[:4000]}
        """
        
        # Placeholder for real Groq call logic
        # For now, returning a structure that matches our frontend expectations
        return {
            "values": [
                {"name": "Haemoglobin", "result": "12.8", "unit": "g/dL", "status": "GREEN", "explanation": "Healthy oxygen levels."},
                {"name": "Blood Pressure", "result": "138/92", "unit": "mmHg", "status": "YELLOW", "explanation": "Slightly elevated."}
            ],
            "overall_status": "YELLOW",
            "summary": "Report parsed successfully. Minor elevations detected in blood pressure."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
