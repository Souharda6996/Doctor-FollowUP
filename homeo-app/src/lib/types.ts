// ═══════════════════════════════════════════════════════════════
// SHARED TYPES (Frontend ↔ Backend Contract)
// ═══════════════════════════════════════════════════════════════

export type Language = "en" | "hi" | "kn" | "ta";

export interface UserProfile {
  id: string;
  firebase_uid: string;
  email: string;
  display_name: string;
  language_preference: Language;
  created_at: string;
  updated_at: string;
}

export interface Remedy {
  id: string;
  name: string;
  common_name: string;
  symptoms_treated: string[];
  potency: string;
  description: string;
  contraindications: string;
  similarity_score?: number;
}

export interface ConsultationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface Consultation {
  id: string;
  user_id: string;
  session_id: string;
  messages: ConsultationMessage[];
  remedy_suggestions: Remedy[];
  status: "active" | "completed";
  language: Language;
  created_at: string;
  updated_at: string;
}

export interface SymptomAnalysis {
  remedies: Remedy[];
  explanation: string;
  dosage_instructions: string;
  lifestyle_advice: string;
  when_to_see_doctor: string;
  disclaimer: string;
  language: Language;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
  error: string | null;
  timestamp: string;
}

// ═══════════════════════════════════════════════════════════════
// FRONTEND SPECIFIC TYPES (UI & Logic)
// ═══════════════════════════════════════════════════════════════

export type UserRole = "doctor" | "patient" | "caregiver" | null;

export interface AuthUser extends Partial<UserProfile> {
  role: UserRole;
  token?: string;
  patientId?: string;
  linkedPatientId?: string;
}

export type PatientStatus = 'improving' | 'stable' | 'moderate' | 'critical';

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

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  scheduledDate: string;
  scheduledTime?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'missed' | 'rescheduled';
  type: 'routine' | 'urgent' | 'follow-up';
  reason?: string;
  doctorNotes?: string;
}

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

export type MealTime = 'morning' | 'afternoon' | 'night';

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
}

export interface MedicineLog {
  id: string;
  patientId: string;
  medicineId: string;
  date: string;
  time: MealTime;
  taken: boolean;
  missedReason?: 'forgot' | 'side_effects' | 'cost' | 'feeling_better';
  takenAt?: string;
}

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

export interface QuickAsk {
  id: string;
  patientId: string;
  doctorId: string;
  question: string;
  questionType: 'text' | 'voice';
  askedAt: string;
  isUrgent: boolean;
  status: 'pending' | 'answered';
  doctorReply?: string;
  repliedAt?: string;
}

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
  looks_tired:      { label: 'Looks Tired',      icon: '😴', color: 'blue'   },
  scared:           { label: 'Scared',            icon: '😰', color: 'purple' },
  home_stress:      { label: 'Home Stress',       icon: '🏠', color: 'orange' },
  cost_issue:       { label: 'Cost Issue',        icon: '💸', color: 'yellow' },
  needs_handholding:{ label: 'Needs Hand-holding',icon: '🤝', color: 'green'  },
  improving_fast:   { label: 'Improving Fast',    icon: '🚀', color: 'teal'   },
};

export interface SilenceScore {
  patientId: string;
  silenceDays: number;
  lastActivity: string;
  lastActivityType: 'login' | 'checkin' | 'medicine';
  level: 'none' | 'nudge' | 'whatsapp' | 'caregiver' | 'priority';
}

export interface FingerprintAlert {
  patientId: string;
  matchFound: boolean;
  confidence: number;
  previousEventDate: string;
  previousEventDescription: string;
  recommendedAction: string;
}

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

export interface TimelineEvent {
  id: string;
  patientId: string;
  date: string;
  type: 'remedy' | 'followup' | 'case' | 'note' | 'report';
  title: string;
  description: string;
  color?: TrafficLight;
}

export interface AdherenceStats {
  patientId: string;
  weekPercent: number;
  missedReasonBreakdown: Record<string, number>;
}
