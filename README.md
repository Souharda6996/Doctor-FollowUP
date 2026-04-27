# MediFollowUp — Universal Doctor Follow-Up Platform

> **Structured, continuous follow-up between doctor ↔ patient ↔ caretaker.**  
> Works for ANY medical specialty — General Physician, Cardiologist, Dermatologist, Neurologist, Homeopath, Physiotherapist, and more.

---

## 📁 Project Structure

```
/
├── homeo-app/          # Next.js 14 Frontend (App Router + TypeScript)
├── backend/            # FastAPI Python Backend
├── database/
│   └── schema.sql      # Supabase (PostgreSQL + pgvector) Schema
└── README.md
```

---

## 🚀 Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | Next.js 14, TypeScript, Tailwind CSS, Framer Motion |
| Backend    | FastAPI (Python 3.11+), Pydantic v2             |
| Database   | Supabase (PostgreSQL 15 + pgvector)             |
| Auth       | Firebase Authentication (Phone OTP)             |
| AI         | Claude 3.5 Sonnet (Anthropic), Groq (fallback)  |
| Vector     | pgvector + Supabase                             |

---

## 🔑 Core Features

- **Multi-role**: Doctor · Patient · Caretaker
- **Specialty-agnostic**: No hardcoding to any medical branch
- **Adherence tracking**: Medicine logs with missed-dose reasons
- **AI Clinical Assistant**: Symptom analysis, lab report parsing, follow-up drafts
- **Lab Reports**: Traffic-light system (GREEN / YELLOW / RED)
- **Quick Ask**: Patient → Doctor messaging
- **Silence Detection**: Auto-alerts for inactive patients
- **Gut Tags**: Doctor intuition tagging per patient
- **Caretaker Dashboard**: Delegated access with privacy controls

---

## ⚡ Quick Start

### Frontend
```bash
cd homeo-app
npm install
cp .env.local.example .env.local   # fill in Firebase + API keys
npm run dev
```

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate               # Windows
pip install -r requirements.txt
cp .env.example .env                # fill in keys
python start_api.py
```

### Database
Run `database/schema.sql` in your Supabase SQL Editor.

---

## 🗂️ Environment Variables

### Frontend (`homeo-app/.env.local`)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_API_URL=http://localhost:8000
ANTHROPIC_API_KEY=...
```

### Backend (`backend/.env`)
```env
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...
ANTHROPIC_API_KEY=...
GROQ_API_KEY=...
ALLOWED_ORIGINS=http://localhost:3000
PORT=8000
```

---

## 📦 Deployment

- **Frontend**: Vercel — push `homeo-app/` folder, set env vars
- **Backend**: Railway / Render — `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Database**: Supabase (managed PostgreSQL + pgvector)
