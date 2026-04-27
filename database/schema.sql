-- ═══════════════════════════════════════════════════════════════
-- SUPABASE SCHEMA (homeo-app/supabase/schema.sql)
-- ═══════════════════════════════════════════════════════════════

-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- 1. Users table (Synced with Firebase)
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  firebase_uid text unique not null,
  email text unique not null,
  display_name text,
  language_preference text default 'en' 
    check (language_preference in ('en', 'hi')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Remedies table (Vector stored for symptom matching)
create table if not exists remedies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  common_name text,
  symptoms_treated text[],
  potency text,
  description text,
  contraindications text,
  embedding vector(1536), -- For ADA or Claude embeddings
  created_at timestamptz default now()
);

-- 3. Symptom reports (History of what patient submitted)
create table if not exists symptom_reports (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  symptoms text[] not null,
  severity text,
  duration text,
  language text default 'en',
  created_at timestamptz default now()
);

-- 4. Consultations (Full session history)
create table if not exists consultations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  session_id text unique not null,
  messages jsonb default '[]'::jsonb, -- Store list of ConsultationMessage
  remedy_suggestions jsonb default '[]'::jsonb, -- Store list of Remedy
  status text default 'active' 
    check (status in ('active', 'completed')),
  language text default 'en',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. pgvector similarity function
-- This maps to search_similar_remedies in vector_service.py
create or replace function match_remedies(
  query_embedding vector(1536),
  match_threshold float default 0.75,
  match_count int default 5
)
returns table(
  id uuid, 
  name text, 
  common_name text, 
  description text, 
  similarity float
)
language sql stable as $$
  select id, name, common_name, description,
    1 - (embedding <=> query_embedding) as similarity
  from remedies
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;

-- 6. Indices for performance
create index if not exists idx_users_firebase_uid on users(firebase_uid);
create index if not exists idx_consultations_user_id on consultations(user_id);
create index if not exists idx_remedies_embedding on remedies using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- RLS Policies (Basic isolation)
alter table users enable row level security;
alter table consultations enable row level security;
alter table symptom_reports enable row level security;

create policy "Users can only see their own data" on users
  for all using (auth.uid()::text = firebase_uid);

create policy "Users can only see their own consultations" on consultations
  for all using (user_id in (select id from users where auth.uid()::text = firebase_uid));

create policy "Users can only see their own reports" on symptom_reports
  for all using (user_id in (select id from users where auth.uid()::text = firebase_uid));
