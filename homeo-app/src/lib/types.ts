// ═══════════════════════════════════════════════════════════════
// MediFollowUp — Shared Frontend Types
// ═══════════════════════════════════════════════════════════════

export type Language = "en" | "hi" | "kn" | "ta" | "bn" | "mr" | "te" | "gu";

export type UserRole = "doctor" | "patient" | "caretaker" | "caregiver" | null;

export interface UserProfile {
  id: string;
  firebase_uid: string;
  email?: string;
  phone?: string;
  display_name?: string;
  name?: string;       // UI alias for display_name
  role: UserRole;
  language_preference: Language;
  avatar_url?: string;
  is_active?: boolean;
  patientId?: string;          // populated for patient-role users
  linkedPatientId?: string;    // populated for caretaker-role users
  created_at: string;
  updated_at: string;
}

// ── Auth ──────────────────────────────────────────────────────────

export interface AuthUser extends Partial<UserProfile> {
  role: UserRole;
  token?: string;
}

// ── Patient ───────────────────────────────────────────────────────

export type PatientStatus = 'improving' | 'stable' | 'moderate' | 'critical';
export type MoodEmoji = '😊' | '😐' | '😔' | '😤' | '🤒' | '😴';

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email?: string;
  address?: string;
  status: PatientStatus;
  caseType: 'chronic' | 'acute';
  chiefComplaint: string;
  createdAt: string;
  lastVisit: string;
  nextFollowUp?: string;
  doctorId: string;
  language: Language;
  lastLogin?: string;
  lastCheckin?: string;
  lastMedicineTap?: string;
  silenceDays?: number;
}

// ── Appointment ───────────────────────────────────────────────────

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  scheduledDate: string;
  scheduledTime?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'missed' | 'rescheduled' | 'cancelled';
  type: 'routine' | 'urgent' | 'follow-up' | 'initial';
  reason?: string;
  doctorNotes?: string;
}

// ── Alerts ────────────────────────────────────────────────────────

export type AlertType = 'no-improvement' | 'worsening' | 'missed-followup' | 'due-followup' | 'silence' | 'red-report';

export interface Alert {
  id: string;
  patientId: string;
  patientName: string;
  type: AlertType;
  message: string;
  severity: 'high' | 'medium' | 'low';
  createdAt: string;
  isRead: boolean;
}

// ── Check-in ──────────────────────────────────────────────────────

export interface Checkin {
  id: string;
  patientId: string;
  date: string;
  mood: string;
  energy: number;
  bodyParts: string[];
  symptoms: string[];
  notes?: string;
}

// ── Medicine / Prescription ───────────────────────────────────────

export type MealTime = 'morning' | 'afternoon' | 'night';

/** Universal medicine / prescription (works for any specialty) */
export interface Medicine {
  id: string;
  patientId: string;
  name: string;
  dosage: string;
  times: MealTime[];
  notes?: string;
  prescribedBy?: string;
  startDate: string;
  endDate?: string;
  frequency?: string;
  duration?: string;
}

export interface MedicineLog {
  id: string;
  patientId: string;
  medicineId: string;
  date: string;
  time: MealTime;
  taken: boolean;
  missedReason?: 'forgot' | 'side_effects' | 'cost' | 'feeling_better' | 'unavailable';
  takenAt?: string;
}

// ── Lab Reports ───────────────────────────────────────────────────

export interface LabValue {
  name: string;
  result: string;
  unit: string;
  status: 'GREEN' | 'YELLOW' | 'RED';
  plain_english_explanation: string;
}

export interface LabReport {
  id: string;
  patientId: string;
  uploadedAt: string;
  reportDate: string;
  values: LabValue[];
  overallStatus: 'GREEN' | 'YELLOW' | 'RED';
  summaryText: string;
}

// ── Quick Ask ─────────────────────────────────────────────────────

export interface QuickAsk {
  id: string;
  patientId: string;
  doctorId: string;
  question: string;
  questionType: 'text' | 'voice';
  askedAt: string;
  isUrgent: boolean;
  status: 'pending' | 'answered' | 'archived';
  doctorReply?: string;
  repliedAt?: string;
}

// ── Gut Tags ──────────────────────────────────────────────────────

export type GutTagType =
  | 'looks_tired'
  | 'scared'
  | 'home_stress'
  | 'cost_issue'
  | 'needs_handholding'
  | 'improving_fast';

export interface GutTagEntry {
  id: string;
  patientId: string;
  doctorId: string;
  tags: GutTagType[];
  visitDate: string;
  notes?: string;
}

export const GUT_TAG_LABELS: Record<GutTagType, { label: string; icon: string; color: string }> = {
  looks_tired:       { label: 'Looks Tired',        icon: '😴', color: 'blue'   },
  scared:            { label: 'Scared',              icon: '😰', color: 'purple' },
  home_stress:       { label: 'Home Stress',         icon: '🏠', color: 'orange' },
  cost_issue:        { label: 'Cost Issue',          icon: '💸', color: 'yellow' },
  needs_handholding: { label: 'Needs Hand-holding',  icon: '🤝', color: 'green'  },
  improving_fast:    { label: 'Improving Fast',      icon: '🚀', color: 'teal'   },
};

// ── Silence Detection ────────────────────────────────────────────

export interface SilenceScore {
  patientId: string;
  silenceDays: number;
  lastActivity: string;
  lastActivityType: 'login' | 'checkin' | 'medicine';
  level: 'none' | 'nudge' | 'whatsapp' | 'caregiver' | 'priority';
}

// ── Fingerprint Alert ─────────────────────────────────────────────

export interface FingerprintAlert {
  patientId: string;
  matchFound: boolean;
  confidence: number;
  previousEventDate: string;
  previousEventDescription: string;
  recommendedAction: string;
}

// ── Dashboard ─────────────────────────────────────────────────────

export interface DashboardStats {
  totalPatients: number;
  activePatients: number;
  chronicCases: number;
  acuteCases: number;
  todayFollowUps: number;
  missedFollowUps: number;
  improvingPatients: number;
  criticalPatients: number;
}

// ── Case History ──────────────────────────────────────────────────

export interface CaseHistory {
  id: string;
  patientId: string;
  date: string;
  physicalSymptoms: string[];
  mentalState: string;
  emotionalState: string;
  sleepPattern: string;
  sleepQuality: 'poor' | 'moderate' | 'good';
  foodPreferences: string[];
  foodAversions: string[];
  triggers: string[];
  chiefComplaint?: string;
  notes?: string;
  doctorNotes?: string;
  aiSummary?: string;
}

export type TrafficLight = 'GREEN' | 'YELLOW' | 'RED';

// ── Timeline ──────────────────────────────────────────────────────

export interface TimelineEvent {
  id: string;
  patientId: string;
  date: string;
  type: 'prescription' | 'followup' | 'case' | 'note' | 'report' | 'alert';
  title: string;
  description: string;
  color?: TrafficLight;
}

// ── Adherence ────────────────────────────────────────────────────

export interface AdherenceStats {
  patientId: string;
  weekPercent: number;
  missedReasonBreakdown: Record<string, number>;
}

// ── Legacy compat (mockData uses these) ──────────────────────────

export interface SymptomLog {
  id: string;
  patientId: string;
  date: string;
  symptoms: string[];
  severity: number;
  mood: 'good' | 'neutral' | 'bad';
  energy: number;
  notes?: string;
}

export interface FollowUp {
  id: string;
  patientId: string;
  scheduledDate: string;
  completedDate?: string;
  status: 'scheduled' | 'completed' | 'missed';
  type: 'routine' | 'urgent' | 'follow-up';
  doctorNotes?: string;
}

/** Universal prescription entry (replaces homeopathy-only Remedy) */
export interface Remedy {
  id: string;
  patientId: string;
  name: string;
  potency: string;   // now represents dosage/concentration, e.g. "500mg", "1 tablet", "200C"
  dosage: string;
  frequency: string;
  duration: string;
  startDate: string;
  prescribedBy: string;
  reason?: string;
  response?: 'excellent' | 'good' | 'moderate' | 'poor';
  responseNotes?: string;
}

// ── API Response ──────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
  error: string | null;
  timestamp: string;
}
