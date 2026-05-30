import type { Language, Remedy } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const TOKEN_KEY = 'medifollowup_token';

// ── Core fetch wrapper ────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new Error(error.message || `API error: ${res.status}`);
  }

  return res.json();
}

// ── AI Analysis ──────────────────────────────────────────────────────────

export interface SymptomAnalysisResult {
  content: string;
}

/**
 * Analyzes symptoms using Claude AI.
 * Works for any medical specialty — no homeopathy hardcoding.
 */
export async function analyzeSymptoms(
  symptoms: string[],
  lang: Language = 'en',
  options?: { specialty?: string; patientHistorySummary?: string }
): Promise<SymptomAnalysisResult> {
  const result = await apiFetch<{ success: boolean; data: SymptomAnalysisResult }>('/api/ai/analyze', {
    method: 'POST',
    body: JSON.stringify({
      symptoms,
      language: lang,
      specialty: options?.specialty,
      patient_history_summary: options?.patientHistorySummary,
    }),
  });
  return result.data!;
}

// ── Lab Report Analysis ──────────────────────────────────────────────────

export interface LabAnalysisResult {
  overall_status: 'GREEN' | 'YELLOW' | 'RED';
  summary_text: string;
  values: Array<{
    name: string;
    result: string;
    unit: string;
    status: 'GREEN' | 'YELLOW' | 'RED';
    plain_english_explanation: string;
  }>;
}

/**
 * Analyzes a raw lab report text with Claude AI.
 * Returns structured traffic-light results.
 */
export async function analyzeLabReport(reportText: string): Promise<LabAnalysisResult> {
  const result = await apiFetch<{ success: boolean; data: LabAnalysisResult }>('/api/ai/analyze-lab', {
    method: 'POST',
    body: JSON.stringify({ text: reportText }),
  });
  return result.data!;
}

// ── Quick Ask Draft ──────────────────────────────────────────────────────

export async function draftQuickAskReply(
  question: string,
  patientSummary: string,
  specialty?: string
): Promise<string> {
  const result = await apiFetch<{ success: boolean; data: { draft_reply: string } }>(
    '/api/ai/quick-ask-draft',
    {
      method: 'POST',
      body: JSON.stringify({ question, patient_summary: patientSummary, specialty }),
    }
  );
  return result.data!.draft_reply;
}

// ── Streaming Analysis ───────────────────────────────────────────────────

export async function streamAnalysis(
  symptoms: string[],
  lang: Language = 'en',
  onChunk: (text: string) => void,
  options?: { specialty?: string }
): Promise<void> {
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  const symptomParam = symptoms.join(',');
  const specialtyParam = options?.specialty ? `&specialty=${encodeURIComponent(options.specialty)}` : '';
  const url = `${BASE_URL}/api/ai/stream?symptoms=${encodeURIComponent(symptomParam)}&lang=${lang}${specialtyParam}&token=${token}`;

  return new Promise((resolve, reject) => {
    const es = new EventSource(url);

    es.onmessage = (event) => {
      if (event.data === '[DONE]') {
        es.close();
        resolve();
        return;
      }
      try {
        const { text } = JSON.parse(event.data);
        onChunk(text);
      } catch (err) {
        console.error('[Stream] Error parsing chunk', err);
      }
    };

    es.onerror = (err) => {
      console.error('[Stream] EventSource error', err);
      es.close();
      reject(err);
    };
  });
}

// ── Auth ─────────────────────────────────────────────────────────────────

export async function syncUser(role?: string) {
  return apiFetch('/api/auth/sync-user', {
    method: 'POST',
    body: role ? JSON.stringify({ role }) : undefined,
  });
}

export async function getMe() {
  return apiFetch('/api/auth/me');
}

// ── Pre-Visit Brief ──────────────────────────────────────────────────────

export interface PreVisitBriefContext {
  patientName: string;
  language: string;
  checkins: string;
  missedMeds: string;
  labFlags: string;
  quickAskHistory: string;
  gutTags: string;
}

export interface PreVisitBriefResult {
  doctorBullets: string[];
  patientVersion: string;
}

/**
 * Generates a 5-point pre-visit clinical brief using Claude AI.
 */
export async function generatePreVisitBrief(
  context: PreVisitBriefContext
): Promise<PreVisitBriefResult> {
  const result = await apiFetch<{ success: boolean; data: PreVisitBriefResult }>(
    '/api/ai/pre-visit-brief',
    {
      method: 'POST',
      body: JSON.stringify(context),
    }
  );
  return result.data!;
}

// ── Remedy Search ────────────────────────────────────────────────────────

/**
 * Searches for remedies using vector similarity via the backend.
 */
export async function searchRemedies(
  symptoms: string[],
  topK = 5
): Promise<Remedy[]> {
  const result = await apiFetch<{ success: boolean; data: Remedy[] }>(
    '/api/ai/search-remedies',
    {
      method: 'POST',
      body: JSON.stringify({ symptoms, top_k: topK }),
    }
  );
  return result.data ?? [];
}
