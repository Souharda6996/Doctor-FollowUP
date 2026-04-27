# MediFollowUp — Backend API

FastAPI backend powering the MediFollowUp universal doctor follow-up platform.

## Stack
- **Framework**: FastAPI + Pydantic v2
- **Auth**: Firebase Admin SDK (JWT verification)
- **Database**: Supabase (PostgreSQL + pgvector)
- **AI**: Anthropic Claude 3.5 Sonnet + Groq (fallback)

## Routes

| Method | Path                          | Role Required | Description                            |
|--------|-------------------------------|---------------|----------------------------------------|
| POST   | /api/auth/sync-user           | Any           | Sync Firebase user to Supabase         |
| GET    | /api/auth/me                  | Any           | Get current user profile               |
| PATCH  | /api/auth/role                | Any           | Set user role (first login)            |
| POST   | /api/ai/analyze               | Any           | Analyze symptoms (universal specialty) |
| POST   | /api/ai/analyze-lab           | Any           | Parse lab report → traffic light       |
| POST   | /api/ai/quick-ask-draft       | Doctor        | AI-draft reply to patient's quick ask  |
| GET    | /api/ai/stream                | Any           | SSE stream of AI clinical analysis     |

## Setup

```bash
python -m venv venv
venv\Scripts\activate   # Windows / source venv/bin/activate on Mac
pip install -r requirements.txt
cp .env.example .env    # fill in all keys
python start_api.py
```

## Environment Variables

```env
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
ANTHROPIC_API_KEY=
GROQ_API_KEY=
ALLOWED_ORIGINS=http://localhost:3000
PORT=8000
```
