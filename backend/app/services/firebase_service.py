from firebase_admin import auth
from app.firebase_admin import verify_token
from app.database import supabase
from app.models.user import UserProfile, UserRole
from typing import Optional


class FirebaseService:
    @staticmethod
    async def sync_user(id_token: str, role: Optional[UserRole] = None) -> UserProfile:
        """
        Verifies ID token and upserts the user in Supabase.
        Optionally sets role on first creation.
        """
        decoded = verify_token(id_token)
        firebase_uid = decoded["uid"]

        res = supabase.table("users").select("*").eq("firebase_uid", firebase_uid).execute()

        if res.data:
            user_id = res.data[0]["id"]
            update_data: dict = {
                "email": decoded.get("email"),
                "display_name": decoded.get("name"),
            }
            # Only update role if user hasn't been assigned one yet
            if role and not res.data[0].get("role"):
                update_data["role"] = role
            res = supabase.table("users").update(update_data).eq("id", user_id).execute()
        else:
            new_user = {
                "firebase_uid": firebase_uid,
                "email": decoded.get("email"),
                "phone": decoded.get("phone_number"),
                "display_name": decoded.get("name"),
                "language_preference": "en",
                "role": role or "patient",
            }
            res = supabase.table("users").insert(new_user).execute()

        return UserProfile(**res.data[0])


firebase_service = FirebaseService()
