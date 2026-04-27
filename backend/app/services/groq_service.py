import os
from groq import Groq
from app.config import settings


class GroqService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.client = Groq(api_key=self.api_key) if self.api_key else None
        self.model = "llama3-70b-8192"

    async def explain_treatment(self, treatment_name: str, symptoms: str, specialty: str = "general") -> str:
        """
        Uses Groq Llama 3 to explain why a treatment fits the given symptoms.
        Works for any medical specialty — not homeopathy-specific.
        """
        if not self.client:
            return "Groq API key not configured."

        try:
            prompt = f"""
            You are an expert clinical AI assistant for MediFollowUp — a universal doctor follow-up platform.
            You support ANY medical specialty: {specialty}.

            Explain in 2-3 concise sentences why '{treatment_name}' is appropriate for a patient with these symptoms: {symptoms}.
            Focus on the clinical indication and mechanism of action.
            Keep it clinical yet easy for a patient to understand.
            Always recommend consulting a licensed physician for diagnosis and treatment.
            """

            completion = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a professional clinical consultant for MediFollowUp. You support any medical specialty and provide evidence-based, balanced information."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,
                max_tokens=200
            )

            return completion.choices[0].message.content.strip()
        except Exception as e:
            print(f"❌ Groq Error: {str(e)}")
            return f"Could not generate explanation for {treatment_name}."

    # Backward compat alias — kept for any existing callers
    async def explain_remedy(self, remedy_name: str, symptoms: str) -> str:
        return await self.explain_treatment(remedy_name, symptoms)


# Global instance
groq_service = GroqService()
