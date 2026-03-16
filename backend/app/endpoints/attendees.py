from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from typing import List, Dict, Any
from ..db import get_supabase
from ..auth import get_current_user, require_editor_or_admin
from ..schemas import AttendeeCreate, AttendeeBase, AttendeeUpdateStatus

router = APIRouter()

@router.get("/{session_id}", response_model=List[Dict[str, Any]])
def get_attendees_for_session(session_id: str, supabase: Client = Depends(get_supabase), user = Depends(get_current_user)):
    res = supabase.table("attendees").select("*").eq("session_id", session_id).order("created_at", desc=False).execute()
    return res.data

@router.post("/", response_model=Dict[str, Any])
def create_attendee(attendee: AttendeeCreate, supabase: Client = Depends(get_supabase), user = Depends(require_editor_or_admin)):
    data = attendee.model_dump(exclude_unset=True)
    res = supabase.table("attendees").insert(data).execute()
    return res.data[0]

@router.patch("/{attendee_id}", response_model=Dict[str, Any])
def update_attendee(attendee_id: str, attendee: AttendeeBase, supabase: Client = Depends(get_supabase), user = Depends(require_editor_or_admin)):
    data = attendee.model_dump(exclude_unset=True)
    res = supabase.table("attendees").update(data).eq("id", attendee_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Attendee not found")
    return res.data[0]
    
@router.patch("/{attendee_id}/status", response_model=Dict[str, Any])
def update_attendee_status(attendee_id: str, status_update: AttendeeUpdateStatus, supabase: Client = Depends(get_supabase), user = Depends(require_editor_or_admin)):
    # Explicit endpoint just for quickly updating status
    res = supabase.table("attendees").update({"status": status_update.status}).eq("id", attendee_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Attendee not found")
    return res.data[0]

@router.delete("/{attendee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attendee(attendee_id: str, supabase: Client = Depends(get_supabase), user = Depends(require_editor_or_admin)):
    res = supabase.table("attendees").delete().eq("id", attendee_id).execute()
    return None
