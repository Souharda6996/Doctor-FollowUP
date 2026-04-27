import {
  Patient, CaseHistory, Remedy, SymptomLog, FollowUp, Alert, DashboardStats, TimelineEvent,
  Medicine, MedicineLog, Checkin, LabReport, QuickAsk, GutTagEntry, SilenceScore,
  Appointment, AdherenceStats, FingerprintAlert
} from './types';

// ══════════════════════════════════════════
// PATIENTS
// ══════════════════════════════════════════
export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'p001', name: 'Ananya Patel', age: 34, gender: 'female',
    phone: '+91 98765 43210', email: 'ananya@email.com', address: 'Mumbai, Maharashtra',
    status: 'improving', caseType: 'chronic', chiefComplaint: 'Hypertension & migraines, monthly cycles',
    createdAt: '2024-01-15', lastVisit: '2026-03-10', nextFollowUp: '2026-04-12',
    doctorId: 'doctor-001', language: 'en',
    lastLogin: '2026-04-09', lastCheckin: '2026-04-09', lastMedicineTap: '2026-04-09', silenceDays: 0,
  },
  {
    id: 'p002', name: 'Rajesh Kumar', age: 52, gender: 'male',
    phone: '+91 87654 32109', address: 'Pune, Maharashtra',
    status: 'moderate', caseType: 'chronic', chiefComplaint: 'Rheumatoid arthritis, joint pain worse in morning',
    createdAt: '2023-08-20', lastVisit: '2026-03-01', nextFollowUp: '2026-04-15',
    doctorId: 'doctor-001', language: 'hi',
    lastLogin: '2026-04-04', lastCheckin: '2026-04-04', lastMedicineTap: '2026-04-05', silenceDays: 5,
  },
  {
    id: 'p003', name: 'Priya Sharma', age: 28, gender: 'female',
    phone: '+91 76543 21098', address: 'Kolkata, West Bengal',
    status: 'stable', caseType: 'acute', chiefComplaint: 'Recurrent tonsillitis, episodes every 2 months',
    createdAt: '2025-06-10', lastVisit: '2026-03-20', nextFollowUp: '2026-04-20',
    doctorId: 'doctor-001', language: 'en',
    lastLogin: '2026-04-07', lastCheckin: '2026-04-06', lastMedicineTap: '2026-04-07', silenceDays: 2,
  },
  {
    id: 'p004', name: 'Arjun Singh', age: 45, gender: 'male',
    phone: '+91 65432 10987', address: 'Delhi, NCR',
    status: 'critical', caseType: 'chronic', chiefComplaint: 'Type 2 Diabetes, HbA1c persistently high',
    createdAt: '2023-11-05', lastVisit: '2026-02-15', nextFollowUp: '2026-03-28',
    doctorId: 'doctor-001', language: 'hi',
    lastLogin: '2026-03-31', lastCheckin: '2026-03-31', lastMedicineTap: '2026-04-01', silenceDays: 9,
  },
  {
    id: 'p005', name: 'Kavitha Nair', age: 38, gender: 'female',
    phone: '+91 54321 09876', address: 'Bangalore, Karnataka',
    status: 'improving', caseType: 'chronic', chiefComplaint: 'Anxiety, panic attacks, insomnia',
    createdAt: '2024-03-22', lastVisit: '2026-03-22', nextFollowUp: '2026-04-22',
    doctorId: 'doctor-001', language: 'kn',
    lastLogin: '2026-04-09', lastCheckin: '2026-04-08', lastMedicineTap: '2026-04-09', silenceDays: 0,
  },
  {
    id: 'p006', name: 'Mohan Gupta', age: 60, gender: 'male',
    phone: '+91 43210 98765', address: 'Jaipur, Rajasthan',
    status: 'stable', caseType: 'chronic', chiefComplaint: 'Hypertension, diabetes complications',
    createdAt: '2022-09-14', lastVisit: '2026-03-05', nextFollowUp: '2026-05-05',
    doctorId: 'doctor-001', language: 'hi',
    lastLogin: '2026-04-02', lastCheckin: '2026-04-01', lastMedicineTap: '2026-04-02', silenceDays: 7,
  },
];

// ══════════════════════════════════════════
// APPOINTMENTS
// ══════════════════════════════════════════
export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt001', patientId: 'p001', doctorId: 'doctor-001',
    scheduledDate: '2026-04-12', scheduledTime: '10:30 AM',
    status: 'confirmed', type: 'routine',
    reason: 'BP recheck + monthly review. Last BP was 138/92 — borderline HIGH.',
  },
  {
    id: 'apt002', patientId: 'p002', doctorId: 'doctor-001',
    scheduledDate: '2026-04-15', scheduledTime: '11:00 AM',
    status: 'scheduled', type: 'follow-up',
    reason: 'Arthritis pain review. Missed 3 doses last week.',
  },
  {
    id: 'apt003', patientId: 'p004', doctorId: 'doctor-001',
    scheduledDate: '2026-04-11', scheduledTime: '09:00 AM',
    status: 'scheduled', type: 'urgent',
    reason: 'HbA1c came back RED (8.2). Immediate review needed.',
  },
  {
    id: 'apt004', patientId: 'p005', doctorId: 'doctor-001',
    scheduledDate: '2026-04-22', scheduledTime: '02:00 PM',
    status: 'scheduled', type: 'routine',
    reason: 'Anxiety management check-in. Energy improving.',
  },
  {
    id: 'apt005', patientId: 'p001', doctorId: 'doctor-001',
    scheduledDate: '2026-03-10', scheduledTime: '10:30 AM',
    status: 'completed', type: 'routine',
    reason: 'Monthly BP review',
    doctorNotes: 'Good progress. Continue current medication. BP stable at 128/84.',
  },
];

// ══════════════════════════════════════════
// MEDICINES
// ══════════════════════════════════════════
export const MOCK_MEDICINES: Medicine[] = [
  { id: 'm001', patientId: 'p001', name: 'Amlodipine', dosage: '5mg', times: ['morning'], prescribedBy: 'Dr. Sharma', startDate: '2024-01-20', notes: 'Take with water, avoid grapefruit' },
  { id: 'm002', patientId: 'p001', name: 'Aspirin', dosage: '75mg', times: ['morning'], prescribedBy: 'Dr. Sharma', startDate: '2024-01-20' },
  { id: 'm003', patientId: 'p001', name: 'Vitamin D3', dosage: '1000 IU', times: ['night'], prescribedBy: 'Dr. Sharma', startDate: '2024-03-01' },
  { id: 'm004', patientId: 'p002', name: 'Methotrexate', dosage: '10mg', times: ['morning'], prescribedBy: 'Dr. Sharma', startDate: '2023-09-01', notes: 'Once weekly, Saturday' },
  { id: 'm005', patientId: 'p002', name: 'Folic Acid', dosage: '5mg', times: ['morning'], prescribedBy: 'Dr. Sharma', startDate: '2023-09-01' },
  { id: 'm006', patientId: 'p004', name: 'Metformin', dosage: '500mg', times: ['morning', 'night'], prescribedBy: 'Dr. Sharma', startDate: '2023-11-10', notes: 'Take with food' },
  { id: 'm007', patientId: 'p004', name: 'Glipizide', dosage: '5mg', times: ['morning'], prescribedBy: 'Dr. Sharma', startDate: '2024-01-15' },
];

export const MOCK_MEDICINE_LOGS: MedicineLog[] = [
  { id: 'ml001', patientId: 'p001', medicineId: 'm001', date: '2026-04-09', time: 'morning', taken: true, takenAt: '08:15' },
  { id: 'ml002', patientId: 'p001', medicineId: 'm002', date: '2026-04-09', time: 'morning', taken: true, takenAt: '08:16' },
  { id: 'ml003', patientId: 'p001', medicineId: 'm003', date: '2026-04-08', time: 'night', taken: false, missedReason: 'forgot' },
  { id: 'ml004', patientId: 'p001', medicineId: 'm001', date: '2026-04-08', time: 'morning', taken: true },
  { id: 'ml005', patientId: 'p002', medicineId: 'm004', date: '2026-04-09', time: 'morning', taken: false, missedReason: 'cost' },
  { id: 'ml006', patientId: 'p004', medicineId: 'm006', date: '2026-04-09', time: 'morning', taken: true },
  { id: 'ml007', patientId: 'p004', medicineId: 'm006', date: '2026-04-09', time: 'night', taken: false, missedReason: 'feeling_better' },
];

export const MOCK_ADHERENCE: AdherenceStats[] = [
  { patientId: 'p001', weekPercent: 88, missedReasonBreakdown: { forgot: 2, side_effects: 0, cost: 0, feeling_better: 1 } },
  { patientId: 'p002', weekPercent: 55, missedReasonBreakdown: { forgot: 1, side_effects: 0, cost: 3, feeling_better: 0 } },
  { patientId: 'p004', weekPercent: 70, missedReasonBreakdown: { forgot: 0, side_effects: 0, cost: 0, feeling_better: 2 } },
];

// ══════════════════════════════════════════
// CHECKINS
// ══════════════════════════════════════════
export const MOCK_CHECKINS: Checkin[] = [
  { id: 'ci001', patientId: 'p001', date: '2026-04-09', mood: '😊', energy: 7, bodyParts: [], symptoms: ['Mild headache'], notes: 'Better than yesterday' },
  { id: 'ci002', patientId: 'p001', date: '2026-04-08', mood: '😐', energy: 5, bodyParts: ['head'], symptoms: ['Headache', 'Fatigue'] },
  { id: 'ci003', patientId: 'p001', date: '2026-04-07', mood: '😊', energy: 8, bodyParts: [], symptoms: [] },
  { id: 'ci004', patientId: 'p001', date: '2026-04-06', mood: '😔', energy: 4, bodyParts: ['head', 'chest'], symptoms: ['Bad headache', 'Chest tightness'], notes: 'Very stressful day' },
  { id: 'ci005', patientId: 'p001', date: '2026-04-05', mood: '😊', energy: 7, bodyParts: [], symptoms: [] },
  { id: 'ci006', patientId: 'p001', date: '2026-04-04', mood: '😐', energy: 6, bodyParts: ['stomach'], symptoms: ['Stomach ache'] },
  { id: 'ci007', patientId: 'p001', date: '2026-04-03', mood: '😊', energy: 8, bodyParts: [], symptoms: [] },
];

// ══════════════════════════════════════════
// LAB REPORTS
// ══════════════════════════════════════════
export const MOCK_LAB_REPORTS: LabReport[] = [
  {
    id: 'lr001', patientId: 'p001', uploadedAt: '2026-04-01', reportDate: '2026-03-30',
    overallStatus: 'YELLOW',
    summaryText: 'Most values are normal. Blood pressure marker is borderline. No immediate concern, but BP monitoring recommended.',
    values: [
      { name: 'Haemoglobin', result: '12.8', unit: 'g/dL', status: 'GREEN', plain_english_explanation: 'Your blood\'s oxygen carrier level is normal. No anaemia.' },
      { name: 'Blood Pressure', result: '138/92', unit: 'mmHg', status: 'YELLOW', plain_english_explanation: 'Your blood pressure is a bit high. Think of it as the pressure in a water pipe — it\'s slightly more than your heart should be working. Keep an eye on this.' },
      { name: 'Fasting Sugar', result: '96', unit: 'mg/dL', status: 'GREEN', plain_english_explanation: 'Your fasting blood sugar is perfectly normal.' },
      { name: 'Creatinine', result: '0.9', unit: 'mg/dL', status: 'GREEN', plain_english_explanation: 'Your kidneys are working well — this number is comfortably in the normal range.' },
    ],
  },
  {
    id: 'lr002', patientId: 'p004', uploadedAt: '2026-04-05', reportDate: '2026-04-04',
    overallStatus: 'RED',
    summaryText: 'HbA1c is significantly elevated indicating poor blood sugar control over the last 3 months. Immediate doctor consultation required.',
    values: [
      { name: 'HbA1c', result: '8.2', unit: '%', status: 'RED', plain_english_explanation: 'This shows your blood sugar has been too high for the past 3 months. Think of it as a 3-month average — 8.2% is well above the safe zone of 7%. Your doctor needs to see this right away.' },
      { name: 'Fasting Sugar', result: '178', unit: 'mg/dL', status: 'RED', plain_english_explanation: 'Your fasting blood sugar is very high. This means even after not eating overnight, there\'s too much sugar in your blood.' },
      { name: 'Creatinine', result: '1.3', unit: 'mg/dL', status: 'YELLOW', plain_english_explanation: 'Your kidney marker is slightly elevated. Diabetes can affect kidneys over time — this is worth watching.' },
      { name: 'Cholesterol', result: '195', unit: 'mg/dL', status: 'GREEN', plain_english_explanation: 'Your cholesterol is in the acceptable range.' },
    ],
  },
];

// ══════════════════════════════════════════
// QUICK ASKS
// ══════════════════════════════════════════
export const MOCK_QUICK_ASKS: QuickAsk[] = [
  {
    id: 'qa001', patientId: 'p001', doctorId: 'doctor-001',
    question: 'Dr. Sharma, I\'ve been feeling a slight dizziness in the mornings after taking my blood pressure medicine. Should I be worried?',
    questionType: 'text', askedAt: '2026-04-08T09:15:00', isUrgent: false, status: 'answered',
    doctorReply: 'Morning dizziness with BP tablets is common when you first start or if the dose is on the higher side. Try taking it after breakfast instead of before. If it persists more than 3 days or you feel faint, call me immediately.',
    repliedAt: '2026-04-08T14:30:00',
  },
  {
    id: 'qa002', patientId: 'p004', doctorId: 'doctor-001',
    question: 'I have chest pain and feeling breathless since this morning. What should I do?',
    questionType: 'text', askedAt: '2026-04-09T08:00:00', isUrgent: true, status: 'pending',
  },
  {
    id: 'qa003', patientId: 'p005', doctorId: 'doctor-001',
    question: 'Can I take melatonin along with my current medicines for better sleep?',
    questionType: 'text', askedAt: '2026-04-09T19:00:00', isUrgent: false, status: 'pending',
  },
];

// ══════════════════════════════════════════
// GUT TAGS
// ══════════════════════════════════════════
export const MOCK_GUT_TAGS: GutTagEntry[] = [
  {
    id: 'gt001', patientId: 'p001', doctorId: 'doctor-001',
    tags: ['looks_tired', 'needs_handholding'], visitDate: '2026-03-10',
    notes: 'She looked exhausted. Work stress is real. Be gentle in messaging.',
  },
  {
    id: 'gt002', patientId: 'p002', doctorId: 'doctor-001',
    tags: ['cost_issue', 'home_stress'], visitDate: '2026-03-01',
    notes: 'Admitted medicines are expensive. Son recently unemployed.',
  },
  {
    id: 'gt003', patientId: 'p004', doctorId: 'doctor-001',
    tags: ['scared', 'cost_issue'], visitDate: '2026-02-15',
    notes: 'Very anxious about his diabetes complications. Cost barrier is significant.',
  },
  {
    id: 'gt004', patientId: 'p005', doctorId: 'doctor-001',
    tags: ['improving_fast', 'needs_handholding'], visitDate: '2026-03-22',
    notes: 'Great progress but needs frequent reassurance. Keep encouragement high.',
  },
];

// ══════════════════════════════════════════
// SILENCE DETECTION
// ══════════════════════════════════════════
export const MOCK_SILENCE_SCORES: SilenceScore[] = [
  { patientId: 'p001', silenceDays: 0,  lastActivity: '2026-04-09', lastActivityType: 'checkin',  level: 'none' },
  { patientId: 'p002', silenceDays: 5,  lastActivity: '2026-04-04', lastActivityType: 'login',    level: 'whatsapp' },
  { patientId: 'p003', silenceDays: 2,  lastActivity: '2026-04-07', lastActivityType: 'medicine', level: 'none' },
  { patientId: 'p004', silenceDays: 9,  lastActivity: '2026-03-31', lastActivityType: 'login',    level: 'priority' },
  { patientId: 'p005', silenceDays: 0,  lastActivity: '2026-04-09', lastActivityType: 'checkin',  level: 'none' },
  { patientId: 'p006', silenceDays: 7,  lastActivity: '2026-04-02', lastActivityType: 'medicine', level: 'caregiver' },
];

// ══════════════════════════════════════════
// FINGERPRINT ALERTS
// ══════════════════════════════════════════
export const MOCK_FINGERPRINT_ALERTS: FingerprintAlert[] = [
  {
    patientId: 'p002',
    matchFound: true,
    confidence: 0.89,
    previousEventDate: '2024-11-03',
    previousEventDescription: 'Patient was hospitalised for severe joint inflammation flare',
    recommendedAction: 'Schedule urgent review. Consider steroid bridging therapy. Alert patient to rest and hydrate.',
  },
];

// ══════════════════════════════════════════
// LEGACY DATA (from original codebase)
// ══════════════════════════════════════════

export const MOCK_CASE_HISTORY: Record<string, CaseHistory[]> = {
  p001: [
    {
      id: 'ch001', patientId: 'p001', date: '2024-01-15',
      physicalSymptoms: ['Severe throbbing headache', 'Visual aura before headache', 'Nausea', 'Light sensitivity'],
      mentalState: 'Anxious before migraine episodes', emotionalState: 'Depressed during attacks',
      sleepPattern: '7-8 hours, disturbed by headaches', sleepQuality: 'moderate',
      foodPreferences: ['Cold drinks', 'Salty food'], foodAversions: ['Spicy food', 'Coffee'],
      triggers: ['Bright light', 'Stress', 'Hormonal changes'],
      chiefComplaint: 'Hypertension + migraine, monthly cycles',
      doctorNotes: 'BP requires monitoring. Start Amlodipine 5mg. Review in 30 days.',
      aiSummary: 'Patient presents with classic hormonal migraine + early-stage hypertension. BP at 138/92 needs medication and lifestyle changes. Strong compliance expected.',
    },
  ],
  p002: [
    {
      id: 'ch002', patientId: 'p002', date: '2023-08-20',
      physicalSymptoms: ['Joint pain in fingers and wrists', 'Morning stiffness >1 hour', 'Swelling in small joints', 'Fatigue'],
      mentalState: 'Frustration with pain', emotionalState: 'Generally positive but worn down',
      sleepPattern: '5-6 hours, wakes in pain', sleepQuality: 'poor',
      foodPreferences: ['Warm food', 'Meat'], foodAversions: ['Cold drinks'],
      triggers: ['Cold weather', 'Damp conditions', 'Overwork'],
      chiefComplaint: 'Rheumatoid arthritis with symmetrical joint involvement',
      aiSummary: 'Chronic RA case. Cost barrier identified. Remind gently, not harshly.',
    },
  ],
};

export const MOCK_REMEDIES: Record<string, Remedy[]> = {
  p001: [
    { id: 'r001', patientId: 'p001', name: 'Amlodipine', potency: '5mg', dosage: '1 tablet', frequency: 'Once daily (morning)', duration: 'Ongoing', startDate: '2024-01-20', prescribedBy: 'Dr. Rajesh Sharma', reason: 'Hypertension management', response: 'good', responseNotes: 'BP improving from 148/96 to 138/92 in 2 months.' },
    { id: 'r002', patientId: 'p001', name: 'Aspirin', potency: '75mg', dosage: '1 tablet', frequency: 'Once daily (morning)', duration: 'Ongoing', startDate: '2024-01-20', prescribedBy: 'Dr. Rajesh Sharma', reason: 'Cardiovascular protection', response: 'excellent' },
  ],
  p002: [
    { id: 'r003', patientId: 'p002', name: 'Methotrexate', potency: '10mg', dosage: '1 tablet', frequency: 'Once weekly (Saturday)', duration: 'Ongoing', startDate: '2023-09-01', prescribedBy: 'Dr. Rajesh Sharma', reason: 'RA management', response: 'moderate', responseNotes: 'Moderate relief in morning stiffness. Cost concern raised.' },
  ],
};

export const MOCK_SYMPTOM_LOGS: Record<string, SymptomLog[]> = {
  p001: [
    { id: 'sl001', patientId: 'p001', date: '2026-04-09', symptoms: ['Mild headache'], severity: 3, mood: 'good', energy: 7, notes: 'Short mild episode' },
    { id: 'sl002', patientId: 'p001', date: '2026-04-08', symptoms: ['Fatigue'], severity: 2, mood: 'neutral', energy: 5 },
    { id: 'sl003', patientId: 'p001', date: '2026-04-06', symptoms: ['Bad headache', 'Chest tightness'], severity: 6, mood: 'bad', energy: 4, notes: 'Stressful work day' },
  ],
  p002: [
    { id: 'sl004', patientId: 'p002', date: '2026-03-15', symptoms: ['Joint stiffness', 'Wrist pain'], severity: 6, mood: 'neutral', energy: 3 },
    { id: 'sl005', patientId: 'p002', date: '2026-03-08', symptoms: ['Severe joint pain'], severity: 8, mood: 'bad', energy: 2 },
  ],
};

export const MOCK_FOLLOW_UPS: FollowUp[] = [
  { id: 'f001', patientId: 'p001', scheduledDate: '2026-04-12', status: 'scheduled', type: 'routine' },
  { id: 'f002', patientId: 'p002', scheduledDate: '2026-04-15', status: 'scheduled', type: 'routine' },
  { id: 'f003', patientId: 'p004', scheduledDate: '2026-04-11', status: 'scheduled', type: 'urgent' },
  { id: 'f004', patientId: 'p003', scheduledDate: '2026-03-15', status: 'missed', type: 'routine' },
  { id: 'f005', patientId: 'p001', scheduledDate: '2026-03-10', completedDate: '2026-03-10', status: 'completed', type: 'routine', doctorNotes: 'Good progress. Continue current medication.' },
];

export const MOCK_ALERTS: Alert[] = [
  { id: 'a001', patientId: 'p004', patientName: 'Arjun Singh', type: 'red-report', message: 'HbA1c RED (8.2%) — Immediate review required.', severity: 'high', createdAt: '2026-04-05', isRead: false },
  { id: 'a002', patientId: 'p004', patientName: 'Arjun Singh', type: 'silence', message: 'Silent for 9 days. Missed 4 medicine doses. Doctor follow-up PRIORITY.', severity: 'high', createdAt: '2026-04-09', isRead: false },
  { id: 'a003', patientId: 'p002', patientName: 'Rajesh Kumar', type: 'silence', message: 'No check-in for 5 days. WhatsApp reminder sent.', severity: 'medium', createdAt: '2026-04-09', isRead: false },
  { id: 'a004', patientId: 'p006', patientName: 'Mohan Gupta', type: 'silence', message: 'Silent 7 days. Caregiver alerted via WhatsApp.', severity: 'medium', createdAt: '2026-04-09', isRead: false },
  { id: 'a005', patientId: 'p002', patientName: 'Rajesh Kumar', type: 'no-improvement', message: 'Symptom Fingerprint match: Pre-flare pattern detected (89% confidence). Last event: hospitalized Nov 2024.', severity: 'high', createdAt: '2026-04-08', isRead: false },
  { id: 'a006', patientId: 'p003', patientName: 'Priya Sharma', type: 'missed-followup', message: 'Follow-up missed on March 15. Rescheduling recommended.', severity: 'low', createdAt: '2026-03-16', isRead: true },
];

export const MOCK_DASHBOARD_STATS: DashboardStats = {
  totalPatients: 6, activePatients: 5, chronicCases: 4, acuteCases: 2,
  todayFollowUps: 2, missedFollowUps: 1, improvingPatients: 2, criticalPatients: 1,
};

export const MOCK_TIMELINE: Record<string, TimelineEvent[]> = {
  p001: [
    { id: 't001', patientId: 'p001', date: '2024-01-15', type: 'case', title: 'Initial Consultation', description: 'BP at 148/96. Hypertension + migraines diagnosed. Started Amlodipine.' },
    { id: 't002', patientId: 'p001', date: '2024-01-20', type: 'remedy', title: 'Amlodipine 5mg Started', description: 'Antihypertensive prescribed. Take with food, morning.' },
    { id: 't003', patientId: 'p001', date: '2024-04-01', type: 'followup', title: 'Follow-up #1', description: 'BP improved: 138/92. Patient reports mild morning dizziness. Continue medication.' },
    { id: 't004', patientId: 'p001', date: '2026-03-30', type: 'report', title: 'Lab Report Uploaded', description: 'BP: 138/92 (YELLOW). All other markers GREEN.', color: 'YELLOW' },
    { id: 't005', patientId: 'p001', date: '2026-03-10', type: 'followup', title: 'Recent Follow-up', description: 'Steady improvement. Mood stable. Adherence at 88%.', color: 'GREEN' },
  ],
  p004: [
    { id: 't006', patientId: 'p004', date: '2023-11-05', type: 'case', title: 'Initial — Type 2 Diabetes', description: 'HbA1c: 7.8% at diagnosis. Started Metformin + lifestyle changes.' },
    { id: 't007', patientId: 'p004', date: '2026-04-04', type: 'report', title: 'Lab Report — CRITICAL', description: 'HbA1c jumped to 8.2%. Immediate medication adjustment required.', color: 'RED' },
  ],
};
