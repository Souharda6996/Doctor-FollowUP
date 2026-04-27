import os
import json
from anthropic import AsyncAnthropic
from app.config import settings
from typing import List, AsyncIterator, Dict

class ClaudeService:
    def __init__(self):
        self.client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

    def _get_system_prompt(self, language: str) -> str:
        lang_name = "Hindi (Devanagari script)" if language == "hi" else "English"
        return f"""
        You are an expert homeopathic physician assistant.
        Analyze the patient's symptoms and return a structured response.
        
        Respond entirely in {lang_name}. 
        If language is 'hi', respond in Hindi. If 'en', respond in English. 
        Never mix languages in one response.
        
        Structure your analysis carefully:
        1. Recommended remedies (name, potency, dosage)
        2. Lifestyle recommendations
        3. When to see a doctor
        4. Medical disclaimer
        
        Always prioritize patient safety. Homeopathy is complementary; emphasize seeking immediate care for emergencies.
        """

    async def analyze_symptoms(
        self, 
        symptoms: List[str], 
        language: str, 
        user_history: List[Dict] = []
    ) -> Dict:
        """
        One-shot analysis of symptoms.
        """
        prompt = f"Patient presents with the following symptoms: {', '.join(symptoms)}. Please provide analysis."
        
        response = await self.client.messages.create(
            model="claude-3-5-sonnet-20240620",
            max_tokens=2048,
            system=self._get_system_prompt(language),
            messages=[{"role": "user", "content": prompt}]
        )
        
        # In a real app, we'd use tool-use or structured output features
        # For now, we return the text content
        return {"content": response.content[0].text}

    async def stream_analysis(
        self, 
        symptoms: List[str], 
        language: str
    ) -> AsyncIterator[str]:
        """
        Streams AI analysis tokens using SSE format.
        """
        prompt = f"Patient symptoms: {', '.join(symptoms)}. Start analysis."
        
        async with self.client.messages.stream(
            model="claude-3-5-sonnet-20240620",
            max_tokens=2048,
            system=self._get_system_prompt(language),
            messages=[{"role": "user", "content": prompt}]
        ) as stream:
            async for text in stream.text_stream:
                yield f"data: {json.dumps({'text': text})}\n\n"
        
        yield "data: [DONE]\n\n"

    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generates a vector embedding for the given text.
        Note: Claude is an LLM, usually embeddings are done via Voyage or OpenAI.
        If using Claude for clinical matching, we might use it differently, 
        but here we'll assume a placeholder or a separate embedding service.
        """
        # Placeholder for real embedding logic
        # In production, this would call Voyage AI or OpenAI embeddings
        return [0.0] * 1536 

claude_service = ClaudeService()
