# HomeoDoc Backend

FastAPI-based production backend for AI synthesis, authentication verification, and medical record management.

## 🚀 Setup Instructions

1. **Install Dependencies**:
   ```bash
   pip install -r requirements-api.txt
   ```

2. **Configure Environment**:
   Create a `.env` file based on `.env.example`:
   - Supabase & Firebase Admin secrets.
   - Claude (Anthropic) API Key.

3. **Run Server**:
   ```bash
   python start_api.py
   ```
   *API Docs: http://localhost:8000/docs*

## 📁 Key Components

- `main.py`: App entry point and CORS setup.
- `app/routes/`: API endpoints (AI, Auth, Remedies, etc).
- `app/services/`: Core logic (Claude interface, Vector search).
- `app/models/`: Pydantic data schemas.
