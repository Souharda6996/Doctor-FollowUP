import os
from groq import Groq
from app.config import settings

class GroqService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.client = Groq(api_key=self.api_key) if self.api_key else None
        self.model = "llama3-70b-8192"

    async def explain_remedy(self, remedy_name: str, symptoms: str) -> str:
        """
        Uses Groq Llama 3 to explain why a remedy fits the given symptoms.
        """
        if not self.client:
            return "Groq API key not configured."

        try:
            prompt = f"""
            You are an expert clinical AI assistant for MediFollowUp. 
            Analyze the patient's symptoms and provide a structured clinical response.
            You support ANY medical specialty.
            Always recommend consulting a licensed physician for diagnosis and treatment.
            Explain in 2-3 concise sentences why the remedy '{remedy_name}' is suitable for these symptoms: {symptoms}.
            Focus on the core 'Materia Medica' indication.
            Keep it clinical yet easy for a patient to understand.
            """
            
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a professional clinical consultant for MediFollowUp. You support any medical specialty."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=150
            )
            
            return completion.choices[0].message.content.strip()
        except Exception as e:
            print(f"❌ Groq Error: {str(e)}")
            return f"Could not generate explanation for {remedy_name}."

# Global instance
groq_service = GroqService()
