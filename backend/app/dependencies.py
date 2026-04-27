from fastapi import Header, HTTPException, Depends
from app.firebase_admin import verify_token
from app.database import supabase
from app.models.user import UserProfile
import logging

logger = logging.getLogger(__name__)

async def get_current_user(authorization: str = Header(...)) -> UserProfile:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.split(" ")[1]
    try:
        # 1. Verify Firebase Token
        decoded_token = verify_token(token)
        firebase_uid = decoded_token["uid"]
        email = decoded_token.get("email")
        
        # 2. Get or Create User in Supabase
        # Check if user exists
        res = supabase.table("users").select("*").eq("firebase_uid", firebase_uid).execute()
        
        if res.data:
            user_data = res.data[0]
        else:
            # Create user if doesn't exist (sync on first auth)
            logger.info(f"Syncing new user: {email}")
            new_user = {
                "firebase_uid": firebase_uid,
                "email": email,
                "display_name": decoded_token.get("name", ""),
                "language_preference": "en"
            }
            insert_res = supabase.table("users").insert(new_user).execute()
            if not insert_res.data:
                raise HTTPException(status_code=500, detail="Failed to sync user profile")
            user_data = insert_res.data[0]
            
        return UserProfile(**user_data)
        
    except Exception as e:
        logger.error(f"Auth error: {str(e)}")
        raise HTTPException(status_code=401, detail="Could not validate credentials")
