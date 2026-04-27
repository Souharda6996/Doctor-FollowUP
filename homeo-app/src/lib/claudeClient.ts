import { 
  SymptomAnalysis, 
  Remedy, 
  Consultation, 
  UserProfile,
  Language 
} from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Core API fetch wrapper with Auth support
 */
async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = localStorage.getItem("homeo_token");
  
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "An unknown error occurred" }));
    throw new Error(error.message || "API error");
  }

  return res.json();
}

/**
 * Analyzes symptoms using Claude AI
 */
export async function analyzeSymptoms(symptoms: string[], lang: Language = "en"): Promise<SymptomAnalysis> {
  return apiFetch("/api/ai/analyze", {
    method: "POST",
    body: JSON.stringify({ symptoms, language: lang }),
  });
}

/**
 * Searches for remedies via vector similarity
 */
export async function searchRemedies(queryWords: string[], topK: number = 5): Promise<Remedy[]> {
  return apiFetch("/api/ai/remedy-search", {
    method: "POST",
    body: JSON.stringify({ symptoms: queryWords, top_k: topK }),
  });
}

/**
 * Starts a new interactive consultation session
 */
export async function startConsultation(symptoms: string[], lang: Language = "en"): Promise<Consultation> {
  return apiFetch("/api/consultations/start", {
    method: "POST",
    body: JSON.stringify({ symptoms, language: lang }),
  });
}

/**
 * Sends a message in an existing consultation
 */
export async function sendMessage(consultationId: string, message: string): Promise<Consultation> {
  return apiFetch(`/api/consultations/${consultationId}/message`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

/**
 * Fetches all consultation history for the user
 */
export async function getConsultationHistory(): Promise<Consultation[]> {
  return apiFetch("/api/consultations");
}

/**
 * Real-time streaming analysis using Server-Sent Events (SSE)
 */
export async function streamAnalysis(
  symptoms: string[], 
  lang: Language = "en",
  onChunk: (text: string) => void
): Promise<void> {
  const token = localStorage.getItem("homeo_token");
  const symptomParam = symptoms.join(",");
  
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}/api/ai/stream?symptoms=${encodeURIComponent(symptomParam)}&lang=${lang}&token=${token}`;
    const es = new EventSource(url);

    es.onmessage = (event) => {
      if (event.data === "[DONE]") {
        es.close();
        resolve();
        return;
      }

      try {
        const { text } = JSON.parse(event.data);
        onChunk(text);
      } catch (err) {
        console.error("Error parsing stream chunk", err);
      }
    };

    es.onerror = (err) => {
      console.error("EventSource error", err);
      es.close();
      reject(err);
    };
  });
}

/**
 * Profile Management
 */
export async function getUserProfile(): Promise<UserProfile> {
  return apiFetch("/api/users/profile");
}

export async function updateUserProfile(data: Partial<UserProfile>): Promise<UserProfile> {
  return apiFetch("/api/users/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
