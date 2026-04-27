from firebase_admin import auth
from app.firebase_admin import verify_token
from app.database import supabase
from app.models.user import UserProfile

class FirebaseService:
    @staticmethod
    async def sync_user(id_token: str) -> UserProfile:
        """
        Verifies ID token and ensures user exists in Supabase.
        """
        decoded = verify_token(id_token)
        firebase_uid = decoded["uid"]
        
        # Upsert logic
        res = supabase.table("users").select("*").eq("firebase_uid", firebase_uid).execute()
        
        if res.data:
            # Update email or name if changed
            user_id = res.data[0]["id"]
            update_data = {
                "email": decoded.get("email"),
                "display_name": decoded.get("name")
            }
            res = supabase.table("users").update(update_data).eq("id", user_id).execute()
        else:
            # Create
            new_user = {
                "firebase_uid": firebase_uid,
                "email": decoded.get("email"),
                "display_name": decoded.get("name"),
                "language_preference": "en"
            }
            res = supabase.table("users").insert(new_user).execute()
            
        return UserProfile(**res.data[0])

firebase_service = FirebaseService()
