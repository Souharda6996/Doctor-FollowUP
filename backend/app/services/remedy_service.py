from app.database import supabase
from app.models.remedy import Remedy
from typing import List, Optional

class RemedyService:
    @staticmethod
    async def get_all_remedies() -> List[Remedy]:
        res = supabase.table("remedies").select("*").execute()
        return [Remedy(**r) for r in res.data]

    @staticmethod
    async def get_remedy_by_id(remedy_id: str) -> Optional[Remedy]:
        res = supabase.table("remedies").select("*").eq("id", remedy_id).execute()
        if res.data:
            return Remedy(**res.data[0])
        return None

    @staticmethod
    async def get_remedies_by_names(names: List[str]) -> List[Remedy]:
        res = supabase.table("remedies").select("*").in_("name", names).execute()
        return [Remedy(**r) for r in res.data]

remedy_service = RemedyService()
