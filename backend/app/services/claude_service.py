import os
import json
from anthropic import AsyncAnthropic
from app.config import settings
from typing import List, AsyncIterator, Dict, Optional

LANG_NAMES = {
    "en": "English",
    "hi": "Hindi (Devanagari script)",
    "kn": "Kannada",
    "ta": "Tamil",
    "bn": "Bengali",
    "mr": "Marathi",
    "te": "Telugu",
    "gu": "Gujarati",
}


class ClaudeService:
    def __init__(self):
        self.client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

    # ── System prompts ───────────────────────────────────────────────────────

    def _clinical_system_prompt(self, language: str, specialty: Optional[str] = None) -> str:
        lang_name = LANG_NAMES.get(language, "English")
        specialty_line = f"The doctor's specialty is: {specialty}." if specialty else ""
        return f"""You are an expert clinical AI assistant for MediFollowUp — a universal doctor follow-up platform.
{specialty_line}
You support ANY medical specialty: General Physician, Cardiologist, Dermatologist, Neurologist,
Orthopedics, Pediatrics, Gynecology, Psychiatry, ENT, Oncology, Ayurveda, Homeopathy,
Dentistry, Physiotherapy, Ophthalmology, Diabetology, and all others.

Respond entirely in {lang_name}.
Never mix languages in one response.

Your role is to:
1. Summarize patient case histories clearly for the treating doctor.
2. Identify symptom trends, patterns, and possible deterioration signals.
3. Highlight medication adherence issues or missed follow-ups.
4. Provide evidence-based clinical context — NOT a diagnosis or prescription.
5. Always prioritize patient safety. Urge emergency care for red-flag symptoms.

Important rules:
- You are a CLINICAL DECISION SUPPORT tool. The doctor makes final decisions.
- Never claim to diagnose, prescribe, or replace professional judgment.
- Respect patient privacy; treat all data with confidentiality.
"""

    def _lab_analysis_system_prompt(self) -> str:
        return """You are a medical lab report interpreter for MediFollowUp.

Analyze the provided lab report text and return a structured JSON response.

Rules:
- Parse every parameter with its value, unit, and reference range if mentioned.
- Assign a traffic-light status: GREEN (normal), YELLOW (borderline), RED (critically abnormal).
- Provide a short plain-English explanation (1-2 sentences) for each value — suitable for a patient to understand.
- Provide an overall status (GREEN / YELLOW / RED) and a short summary paragraph.
- Output ONLY valid JSON. No markdown, no code fences.

JSON schema:
{
  "overall_status": "GREEN|YELLOW|RED",
  "summary_text": "...",
  "values": [
    {
      "name": "...",
      "result": "...",
      "unit": "...",
      "status": "GREEN|YELLOW|RED",
      "plain_english_explanation": "..."
    }
  ]
}
"""

    # ── Public methods ───────────────────────────────────────────────────────

    async def analyze_symptoms(
        self,
        symptoms: List[str],
        language: str,
        specialty: Optional[str] = None,
        patient_history_summary: Optional[str] = None,
    ) -> Dict:
        """One-shot clinical analysis of symptoms."""
        history_section = (
            f"\n\nPatient background:\n{patient_history_summary}"
            if patient_history_summary
            else ""
        )
        prompt = (
            f"Patient presents with the following symptoms: {', '.join(symptoms)}."
            f"{history_section}\n\nProvide a structured clinical analysis."
        )
        response = await self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2048,
            system=self._clinical_system_prompt(language, specialty),
            messages=[{"role": "user", "content": prompt}],
        )
        return {"content": response.content[0].text}

    async def analyze_lab_report(self, report_text: str) -> Dict:
        """Parses raw lab report text into structured traffic-light data."""
        response = await self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2048,
            system=self._lab_analysis_system_prompt(),
            messages=[{"role": "user", "content": f"Lab report:\n\n{report_text}"}],
        )
        raw = response.content[0].text.strip()
        # Safely parse JSON
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            # Fallback: return raw text as summary
            return {
                "overall_status": "YELLOW",
                "summary_text": raw[:500],
                "values": [],
            }

    async def answer_quick_ask(
        self,
        question: str,
        patient_summary: str,
        language: str,
        specialty: Optional[str] = None,
    ) -> str:
        """Draft an AI-suggested reply for a Quick Ask."""
        prompt = (
            f"Patient Quick Ask:\n{question}\n\n"
            f"Patient summary:\n{patient_summary}\n\n"
            "Draft a brief, safe, empathetic reply the doctor can review and send. "
            "Do NOT make clinical decisions — flag anything that needs immediate in-person review."
        )
        response = await self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=512,
            system=self._clinical_system_prompt(language, specialty),
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text

    async def stream_analysis(
        self,
        symptoms: List[str],
        language: str,
        specialty: Optional[str] = None,
    ) -> AsyncIterator[str]:
        """Streams clinical analysis via SSE."""
        prompt = f"Patient symptoms: {', '.join(symptoms)}. Provide clinical analysis."
        async with self.client.messages.stream(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2048,
            system=self._clinical_system_prompt(language, specialty),
            messages=[{"role": "user", "content": prompt}],
        ) as stream:
            async for text in stream.text_stream:
                yield f"data: {json.dumps({'text': text})}\n\n"
        yield "data: [DONE]\n\n"

    async def generate_embedding(self, text: str) -> List[float]:
        """
        Placeholder — production should use Voyage AI or OpenAI text-embedding-3-small.
        Returns a zero vector of dimension 1536.
        """
        return [0.0] * 1536


claude_service = ClaudeService()
