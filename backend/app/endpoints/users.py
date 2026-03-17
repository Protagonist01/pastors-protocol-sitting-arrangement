from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from typing import List, Dict, Any
from ..db import get_supabase
from ..auth import get_current_user, require_admin
from ..schemas import RoleUpdate

router = APIRouter()

@router.get("/me", response_model=Dict[str, Any])
def get_current_user_profile(supabase: Client = Depends(get_supabase), user = Depends(get_current_user)):
    """Get own profile including role — per AGENT_CONTEXT.md §6.4"""
    res = supabase.table("profiles").select("*").eq("id", user.id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return res.data[0]

@router.get("/", response_model=List[Dict[str, Any]])
def get_all_users(supabase: Client = Depends(get_supabase), user = Depends(require_admin)):
    """Get all users — admin only (for Access Control UI)"""
    res = supabase.table("profiles").select("*").order("created_at", desc=False).execute()
    return res.data

@router.patch("/{user_id}/role", response_model=Dict[str, Any])
def update_user_role(user_id: str, role_update: RoleUpdate, supabase: Client = Depends(get_supabase), user = Depends(require_admin)):
    """Update a user's role — admin only. Admins cannot demote themselves."""
    # Guard: admin cannot change own role (per AGENT_CONTEXT.md §3.4)
    if user_id == user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admins cannot change their own role."
        )

    res = supabase.table("profiles").update({"role": role_update.role}).eq("id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="User not found")
    return res.data[0]
