from fastapi import APIRouter, Depends, HTTPException, Query
from app.dependencies import get_current_user
from app.models.user import UserProfile
from app.database import supabase
from typing import List, Dict, Any
from datetime import datetime, timedelta

router = APIRouter(prefix="/doctor", tags=["doctor"])

@router.get("/dashboard-stats")
async def get_dashboard_stats(current_user: UserProfile = Depends(get_current_user)):
    """
    Returns live statistics for the doctor's dashboard.
    """
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can access these stats")

    # 1. Total Patients
    res = supabase.table("patient_profiles").select("id", count="exact").eq("doctor_id", current_user.id).execute()
    total_patients = res.count or 0

    # 2. Improving Patients
    res = supabase.table("patient_profiles").select("id", count="exact").eq("doctor_id", current_user.id).eq("status", "improving").execute()
    improving_patients = res.count or 0

    # 3. Critical Patients
    res = supabase.table("patient_profiles").select("id", count="exact").eq("doctor_id", current_user.id).eq("status", "critical").execute()
    critical_patients = res.count or 0

    # 4. Today's Follow-ups
    today = datetime.now().date().isoformat()
    res = supabase.table("appointments").select("id", count="exact").eq("doctor_id", current_user.id).eq("scheduled_date", today).execute()
    today_followups = res.count or 0

    return {
        "totalPatients": total_patients,
        "improvingPatients": improving_patients,
        "criticalPatients": critical_patients,
        "todayFollowUps": today_followups,
        "missedFollowUps": 0 # TODO: Implement missed logic
    }

@router.get("/priority-queue")
async def get_priority_queue(
    filter: str = Query("all", regex="^(all|critical|silent)$"),
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Returns the doctor's patient list sorted by priority.
    """
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can access the priority queue")

    # Fetch patients with their basic user info
    # We join users and patient_profiles
    query = supabase.table("patient_profiles").select(
        "*, users(id, display_name, avatar_url, phone, email)"
    ).eq("doctor_id", current_user.id)

    if filter == "critical":
        query = query.eq("status", "critical")
    elif filter == "silent":
        query = query.gte("silence_days", 5)

    res = query.execute()
    
    if not res.data:
        return []

    # Format for frontend
    formatted = []
    for p in res.data:
        user_info = p.get("users", {})
        formatted.append({
            "id": p["id"],
            "name": user_info.get("display_name", "Unknown Patient"),
            "status": p["status"],
            "chiefComplaint": p["chief_complaint"],
            "silenceDays": p["silence_days"],
            "lastCheckin": p["last_checkin"],
            "avatarUrl": user_info.get("avatar_url"),
        })

    # Sort by priority score (silence * 2 + critical weight)
    formatted.sort(key=lambda x: (x["silenceDays"] * 2 + (5 if x["status"] == "critical" else 0)), reverse=True)

    return formatted

@router.get("/alerts")
async def get_alerts(current_user: UserProfile = Depends(get_current_user)):
    """
    Returns unread alerts for the doctor.
    """
    res = supabase.table("alerts").select("*, users!patient_id(display_name)").eq("doctor_id", current_user.id).eq("is_read", False).order("created_at", desc=True).execute()
    
    formatted = []
    for a in res.data:
        formatted.append({
            "id": a["id"],
            "patientName": a.get("users", {}).get("display_name", "Unknown"),
            "message": a["message"],
            "severity": a["severity"],
            "createdAt": a["created_at"]
        })
    return formatted
