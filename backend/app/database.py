from supabase import create_client, Client
from app.config import settings

# Initialize the Supabase client
# Using Service Role Key for backend administrative tasks (bypassing RLS where needed)
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
