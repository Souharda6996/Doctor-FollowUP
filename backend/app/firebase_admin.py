import firebase_admin
from firebase_admin import credentials, auth
from app.config import settings

# Initialize Firebase Admin SDK
# Note: Private key needs to handle escaped newlines if passed via env
cred = credentials.Certificate({
    "type": "service_account",
    "project_id": settings.FIREBASE_PROJECT_ID,
    "private_key": settings.FIREBASE_PRIVATE_KEY.replace('\\n', '\n'),
    "client_email": settings.FIREBASE_CLIENT_EMAIL,
    "token_uri": "https://oauth2.googleapis.com/token",
})

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

DEMO_TOKENS = {
    "demo-token-patient": {
        "uid": "demo-patient-123",
        "phone_number": "+919876543210",
        "name": "Demo Patient",
        "email": "patient@demo.com"
    },
    "demo-token-doctor": {
        "uid": "demo-doctor-456",
        "phone_number": "+918765432109",
        "name": "Demo Doctor",
        "email": "doctor@demo.com"
    },
    "demo-token-caregiver": {
        "uid": "demo-caregiver-789",
        "phone_number": "+919123456789",
        "name": "Demo Caregiver",
        "email": "caregiver@demo.com"
    }
}

def verify_token(token: str):
    """
    Verifies a Firebase ID token.
    Supports demo tokens for local development.
    """
    if token in DEMO_TOKENS:
        return DEMO_TOKENS[token]
    
    return auth.verify_id_token(token)
