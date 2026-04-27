-- ═══════════════════════════════════════════════════════════════════════════
-- MediFollowUp — Universal Doctor Follow-Up Platform
-- Supabase Schema  (PostgreSQL 15 + pgvector)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Extensions ────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- fuzzy name search

-- ═══════════════════════════════════════════
-- ENUMERATIONS
-- ═══════════════════════════════════════════

CREATE TYPE user_role           AS ENUM ('doctor', 'patient', 'caretaker');
CREATE TYPE patient_status      AS ENUM ('improving', 'stable', 'moderate', 'critical');
CREATE TYPE case_type           AS ENUM ('chronic', 'acute');
CREATE TYPE appointment_status  AS ENUM ('scheduled', 'confirmed', 'completed', 'missed', 'rescheduled', 'cancelled');
CREATE TYPE appointment_type    AS ENUM ('routine', 'urgent', 'follow-up', 'initial');
CREATE TYPE quick_ask_status    AS ENUM ('pending', 'answered', 'archived');
CREATE TYPE alert_severity      AS ENUM ('high', 'medium', 'low');
CREATE TYPE traffic_light       AS ENUM ('GREEN', 'YELLOW', 'RED');
CREATE TYPE meal_time           AS ENUM ('morning', 'afternoon', 'night');
CREATE TYPE language_code       AS ENUM ('en', 'hi', 'kn', 'ta', 'bn', 'mr', 'te', 'gu');

-- ═══════════════════════════════════════════
-- 1. USERS  (Firebase-synced identity table)
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS users (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid          TEXT UNIQUE NOT NULL,
  email                 TEXT UNIQUE,
  phone                 TEXT UNIQUE,
  display_name          TEXT,
  role                  user_role NOT NULL DEFAULT 'patient',
  language_preference   language_code NOT NULL DEFAULT 'en',
  avatar_url            TEXT,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- 2. DOCTOR PROFILES
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS doctor_profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  specialty       TEXT NOT NULL,            -- free-form: "Cardiologist", "Homeopath", "Physiotherapist"…
  qualification   TEXT,                     -- e.g. "MBBS, MD (Medicine)"
  registration_no TEXT,
  hospital        TEXT,
  bio             TEXT,
  consultation_fee NUMERIC(10, 2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

-- ═══════════════════════════════════════════
-- 3. PATIENT PROFILES
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS patient_profiles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_id           UUID NOT NULL REFERENCES users(id),   -- assigned doctor
  age                 SMALLINT,
  gender              TEXT CHECK (gender IN ('male','female','other')),
  blood_group         TEXT,
  address             TEXT,
  emergency_contact   TEXT,
  status              patient_status NOT NULL DEFAULT 'stable',
  case_type           case_type NOT NULL DEFAULT 'acute',
  chief_complaint     TEXT NOT NULL,
  silence_days        SMALLINT NOT NULL DEFAULT 0,
  last_login          TIMESTAMPTZ,
  last_checkin        TIMESTAMPTZ,
  last_medicine_tap   TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

-- ═══════════════════════════════════════════
-- 4. CARETAKER ↔ PATIENT LINKS
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS caretaker_patient_links (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caretaker_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  patient_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relationship  TEXT,   -- e.g. "Spouse", "Son", "Professional Nurse"
  is_primary    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (caretaker_id, patient_id)
);

-- ═══════════════════════════════════════════
-- 5. APPOINTMENTS
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS appointments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_id       UUID NOT NULL REFERENCES users(id),
  scheduled_date  DATE NOT NULL,
  scheduled_time  TIME,
  status          appointment_status NOT NULL DEFAULT 'scheduled',
  type            appointment_type NOT NULL DEFAULT 'routine',
  reason          TEXT,
  doctor_notes    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- 6. PRESCRIPTIONS (universal — any medicine)
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS prescriptions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_id     UUID NOT NULL REFERENCES users(id),
  name          TEXT NOT NULL,   -- drug/medicine name (any)
  dosage        TEXT NOT NULL,   -- "500mg", "2 drops", "1 tablet"
  times         meal_time[] NOT NULL DEFAULT '{morning}',
  frequency     TEXT,            -- "Once daily", "Twice weekly"
  duration      TEXT,            -- "7 days", "Ongoing"
  start_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date      DATE,
  notes         TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- 7. MEDICINE LOGS (adherence tracking)
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS medicine_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  log_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_time       meal_time NOT NULL,
  taken           BOOLEAN NOT NULL DEFAULT FALSE,
  missed_reason   TEXT CHECK (missed_reason IN ('forgot','side_effects','cost','feeling_better','unavailable')),
  taken_at        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- 8. DAILY CHECK-INS
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS checkins (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  check_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  mood        TEXT NOT NULL,           -- emoji or label
  energy      SMALLINT NOT NULL CHECK (energy BETWEEN 1 AND 10),
  body_parts  TEXT[] DEFAULT '{}',
  symptoms    TEXT[] DEFAULT '{}',
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (patient_id, check_date)
);

-- ═══════════════════════════════════════════
-- 9. LAB REPORTS
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lab_reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_id       UUID REFERENCES users(id),
  report_date     DATE NOT NULL,
  overall_status  traffic_light NOT NULL DEFAULT 'GREEN',
  summary_text    TEXT,
  values          JSONB NOT NULL DEFAULT '[]'::JSONB, -- [{name, result, unit, status, plain_english_explanation}]
  file_url        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- 10. QUICK ASK (patient → doctor messaging)
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS quick_asks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_id       UUID NOT NULL REFERENCES users(id),
  question        TEXT NOT NULL,
  question_type   TEXT NOT NULL DEFAULT 'text' CHECK (question_type IN ('text','voice')),
  is_urgent       BOOLEAN NOT NULL DEFAULT FALSE,
  status          quick_ask_status NOT NULL DEFAULT 'pending',
  doctor_reply    TEXT,
  asked_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  replied_at      TIMESTAMPTZ
);

-- ═══════════════════════════════════════════
-- 11. ALERTS
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS alerts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_id   UUID REFERENCES users(id),
  type        TEXT NOT NULL,  -- 'no-improvement','worsening','missed-followup','silence','red-report'
  message     TEXT NOT NULL,
  severity    alert_severity NOT NULL DEFAULT 'medium',
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- 12. GUT TAGS (doctor intuition tagging)
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS gut_tags (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_id   UUID NOT NULL REFERENCES users(id),
  tags        TEXT[] NOT NULL DEFAULT '{}',
  visit_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- 13. CASE HISTORY
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS case_history (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_id           UUID NOT NULL REFERENCES users(id),
  visit_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  chief_complaint     TEXT,
  physical_symptoms   TEXT[] DEFAULT '{}',
  mental_state        TEXT,
  emotional_state     TEXT,
  sleep_pattern       TEXT,
  sleep_quality       TEXT CHECK (sleep_quality IN ('poor','moderate','good')),
  food_preferences    TEXT[] DEFAULT '{}',
  food_aversions      TEXT[] DEFAULT '{}',
  triggers            TEXT[] DEFAULT '{}',
  doctor_notes        TEXT,
  ai_summary          TEXT,
  embedding           VECTOR(1536),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- 14. TIMELINE EVENTS
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS timeline_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_date  DATE NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('prescription','followup','case','note','report','alert')),
  title       TEXT NOT NULL,
  description TEXT,
  color       traffic_light,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- 15. SYMPTOM FINGERPRINT ALERTS (AI pattern matching)
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS fingerprint_alerts (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id                  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_found                 BOOLEAN NOT NULL DEFAULT FALSE,
  confidence                  NUMERIC(4, 3),   -- 0.000 to 1.000
  previous_event_date         DATE,
  previous_event_description  TEXT,
  recommended_action          TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- 16. KNOWLEDGE BASE (vector search for AI)
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS knowledge_base (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  specialty   TEXT,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  tags        TEXT[] DEFAULT '{}',
  embedding   VECTOR(1536),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
-- VECTOR SIMILARITY SEARCH FUNCTION
-- ═══════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.75,
  match_count     INT DEFAULT 5,
  p_specialty     TEXT DEFAULT NULL
)
RETURNS TABLE (
  id          UUID,
  title       TEXT,
  content     TEXT,
  similarity  FLOAT
)
LANGUAGE SQL STABLE AS $$
  SELECT id, title, content,
         1 - (embedding <=> query_embedding) AS similarity
  FROM   knowledge_base
  WHERE  (p_specialty IS NULL OR specialty = p_specialty)
    AND  1 - (embedding <=> query_embedding) > match_threshold
  ORDER  BY similarity DESC
  LIMIT  match_count;
$$;

-- Case history similarity (symptom fingerprint)
CREATE OR REPLACE FUNCTION match_case_history(
  query_embedding VECTOR(1536),
  p_patient_id    UUID,
  match_threshold FLOAT DEFAULT 0.80,
  match_count     INT DEFAULT 3
)
RETURNS TABLE (
  id          UUID,
  visit_date  DATE,
  similarity  FLOAT
)
LANGUAGE SQL STABLE AS $$
  SELECT id, visit_date,
         1 - (embedding <=> query_embedding) AS similarity
  FROM   case_history
  WHERE  patient_id != p_patient_id  -- compare against OTHER patients
    AND  1 - (embedding <=> query_embedding) > match_threshold
  ORDER  BY similarity DESC
  LIMIT  match_count;
$$;

-- ═══════════════════════════════════════════
-- AUTO-UPDATE updated_at TRIGGER
-- ═══════════════════════════════════════════

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at             BEFORE UPDATE ON users             FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_doctor_profiles_updated_at   BEFORE UPDATE ON doctor_profiles   FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_patient_profiles_updated_at  BEFORE UPDATE ON patient_profiles  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_appointments_updated_at      BEFORE UPDATE ON appointments      FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_prescriptions_updated_at     BEFORE UPDATE ON prescriptions     FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ═══════════════════════════════════════════
-- PERFORMANCE INDICES
-- ═══════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_users_firebase_uid        ON users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_users_role                ON users(role);
CREATE INDEX IF NOT EXISTS idx_patient_profiles_doctor   ON patient_profiles(doctor_id);
CREATE INDEX IF NOT EXISTS idx_patient_profiles_status   ON patient_profiles(status);
CREATE INDEX IF NOT EXISTS idx_appointments_patient      ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor       ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date         ON appointments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient     ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_medicine_logs_patient     ON medicine_logs(patient_id, log_date);
CREATE INDEX IF NOT EXISTS idx_checkins_patient_date     ON checkins(patient_id, check_date);
CREATE INDEX IF NOT EXISTS idx_quick_asks_doctor         ON quick_asks(doctor_id, status);
CREATE INDEX IF NOT EXISTS idx_alerts_patient            ON alerts(patient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_case_history_embedding    ON case_history USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_knowledge_embedding       ON knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_users_name_trgm           ON users USING GIN (display_name gin_trgm_ops);

-- ═══════════════════════════════════════════
-- ROW-LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════

ALTER TABLE users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE caretaker_patient_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins               ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_reports            ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_asks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE gut_tags               ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_history           ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events        ENABLE ROW LEVEL SECURITY;

-- Helper: resolve UUID from Firebase UID passed in JWT
CREATE OR REPLACE FUNCTION my_user_id() RETURNS UUID AS $$
  SELECT id FROM users WHERE firebase_uid = auth.uid()::TEXT LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Users — each user sees own row
CREATE POLICY "users_self" ON users FOR ALL USING (firebase_uid = auth.uid()::TEXT);

-- Doctors can see their own profiles, patients can see their doctor's profile
CREATE POLICY "doctor_profiles_self"      ON doctor_profiles FOR ALL USING (user_id = my_user_id());

-- Patient profiles visible to: the patient, their doctor, and their linked caretakers
CREATE POLICY "patient_profiles_own"       ON patient_profiles FOR ALL USING (user_id = my_user_id());
CREATE POLICY "patient_profiles_doctor"    ON patient_profiles FOR SELECT USING (doctor_id = my_user_id());
CREATE POLICY "patient_profiles_caretaker" ON patient_profiles FOR SELECT
  USING (user_id IN (SELECT patient_id FROM caretaker_patient_links WHERE caretaker_id = my_user_id()));

-- Appointments
CREATE POLICY "appointments_patient"   ON appointments FOR ALL USING (patient_id = my_user_id());
CREATE POLICY "appointments_doctor"    ON appointments FOR ALL USING (doctor_id  = my_user_id());
CREATE POLICY "appointments_caretaker" ON appointments FOR SELECT
  USING (patient_id IN (SELECT patient_id FROM caretaker_patient_links WHERE caretaker_id = my_user_id()));

-- Prescriptions
CREATE POLICY "prescriptions_patient"   ON prescriptions FOR SELECT USING (patient_id = my_user_id());
CREATE POLICY "prescriptions_doctor"    ON prescriptions FOR ALL    USING (doctor_id  = my_user_id());
CREATE POLICY "prescriptions_caretaker" ON prescriptions FOR SELECT
  USING (patient_id IN (SELECT patient_id FROM caretaker_patient_links WHERE caretaker_id = my_user_id()));

-- Medicine logs
CREATE POLICY "medicine_logs_patient"   ON medicine_logs FOR ALL    USING (patient_id = my_user_id());
CREATE POLICY "medicine_logs_caretaker" ON medicine_logs FOR SELECT
  USING (patient_id IN (SELECT patient_id FROM caretaker_patient_links WHERE caretaker_id = my_user_id()));

-- Check-ins
CREATE POLICY "checkins_patient"   ON checkins FOR ALL    USING (patient_id = my_user_id());
CREATE POLICY "checkins_caretaker" ON checkins FOR SELECT
  USING (patient_id IN (SELECT patient_id FROM caretaker_patient_links WHERE caretaker_id = my_user_id()));
CREATE POLICY "checkins_doctor" ON checkins FOR SELECT
  USING (patient_id IN (SELECT user_id FROM patient_profiles WHERE doctor_id = my_user_id()));

-- Lab reports
CREATE POLICY "lab_reports_patient"   ON lab_reports FOR SELECT USING (patient_id = my_user_id());
CREATE POLICY "lab_reports_doctor"    ON lab_reports FOR ALL    USING (doctor_id  = my_user_id());
CREATE POLICY "lab_reports_caretaker" ON lab_reports FOR SELECT
  USING (patient_id IN (SELECT patient_id FROM caretaker_patient_links WHERE caretaker_id = my_user_id()));

-- Quick asks
CREATE POLICY "quick_asks_patient" ON quick_asks FOR ALL USING (patient_id = my_user_id());
CREATE POLICY "quick_asks_doctor"  ON quick_asks FOR ALL USING (doctor_id  = my_user_id());

-- Alerts
CREATE POLICY "alerts_patient" ON alerts FOR SELECT USING (patient_id = my_user_id());
CREATE POLICY "alerts_doctor"  ON alerts FOR ALL    USING (doctor_id  = my_user_id());

-- Gut tags — doctors only
CREATE POLICY "gut_tags_doctor"   ON gut_tags FOR ALL USING (doctor_id = my_user_id());

-- Case history
CREATE POLICY "case_history_doctor"  ON case_history FOR ALL    USING (doctor_id  = my_user_id());
CREATE POLICY "case_history_patient" ON case_history FOR SELECT USING (patient_id = my_user_id());

-- Timeline events
CREATE POLICY "timeline_patient" ON timeline_events FOR SELECT USING (patient_id = my_user_id());
CREATE POLICY "timeline_doctor"  ON timeline_events FOR ALL
  USING (patient_id IN (SELECT user_id FROM patient_profiles WHERE doctor_id = my_user_id()));
