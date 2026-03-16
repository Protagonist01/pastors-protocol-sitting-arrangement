from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from typing import List, Dict, Any
from ..db import get_supabase
from ..auth import get_current_user, require_editor_or_admin
from ..schemas import SessionCreate, SessionUpdate, SeatingConfigCreate

router = APIRouter()

@router.get("/{conf_id}", response_model=List[Dict[str, Any]])
def get_sessions_for_conference(conf_id: str, supabase: Client = Depends(get_supabase), user = Depends(get_current_user)):
    res = supabase.table("sessions").select("*, seating_configs(*)").eq("conference_id", conf_id).order("date", desc=True).execute()
    return res.data

@router.post("/", response_model=Dict[str, Any])
def create_session(session: SessionCreate, supabase: Client = Depends(get_supabase), user = Depends(require_editor_or_admin)):
    data = session.model_dump(exclude_unset=True)
    if 'date' in data and data['date']:
        data['date'] = data['date'].isoformat()
    if 'time' in data and data['time']:
        data['time'] = data['time'].isoformat()
        
    res = supabase.table("sessions").insert(data).execute()
    return res.data[0]

@router.patch("/{session_id}", response_model=Dict[str, Any])
def update_session(session_id: str, session: SessionUpdate, supabase: Client = Depends(get_supabase), user = Depends(require_editor_or_admin)):
    data = session.model_dump(exclude_unset=True)
    if 'date' in data and data['date']:
        data['date'] = data['date'].isoformat()
    if 'time' in data and data['time']:
        data['time'] = data['time'].isoformat()
        
    res = supabase.table("sessions").update(data).eq("id", session_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Session not found")
    return res.data[0]

@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(session_id: str, supabase: Client = Depends(get_supabase), user = Depends(require_editor_or_admin)):
    res = supabase.table("sessions").delete().eq("id", session_id).execute()
    return None

# --- Seating Configs ---

@router.post("/{session_id}/configs", response_model=List[Dict[str, Any]])
def upsert_seating_configs(session_id: str, configs: List[SeatingConfigCreate], supabase: Client = Depends(get_supabase), user = Depends(require_editor_or_admin)):
    """
    Updates or inserts seating dimensions for sections in a session.
    """
    data = [c.model_dump() for c in configs]
    res = supabase.table("seating_configs").upsert(data, on_conflict="session_id,section_id").execute()
    return res.data
