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

def verify_token(token: str):
    """
    Verifies a Firebase ID token.
    Raises: ValueError, auth.ExpiredIdTokenError, etc.
    """
    return auth.verify_id_token(token)
