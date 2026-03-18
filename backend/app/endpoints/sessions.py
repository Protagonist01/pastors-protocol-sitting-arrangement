from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from typing import List, Dict, Any
from ..db import get_supabase
from ..auth import get_current_user, require_editor_or_admin, require_admin
from ..schemas import SessionCreate, SessionUpdate

# Nested router: mounted at /api/conferences
# Handles: GET /api/conferences/{conf_id}/sessions, POST /api/conferences/{conf_id}/sessions
nested_router = APIRouter()

# Direct router: mounted at /api/sessions
# Handles: GET /api/sessions/{id}, PATCH /api/sessions/{id}, DELETE /api/sessions/{id}, etc.
direct_router = APIRouter()

# --- Nested routes (under /api/conferences) ---

@nested_router.get("/{conf_id}/sessions", response_model=List[Dict[str, Any]])
def get_sessions_for_conference(conf_id: str, supabase: Client = Depends(get_supabase), user = Depends(get_current_user)):
    res = supabase.table("sessions").select("*").eq("conference_id", conf_id).order("date", desc=True).execute()
    return res.data

@nested_router.post("/{conf_id}/sessions", response_model=Dict[str, Any])
def create_session(conf_id: str, session: SessionCreate, supabase: Client = Depends(get_supabase), user = Depends(require_editor_or_admin)):
    data = session.model_dump(exclude_unset=True)
    data["conference_id"] = conf_id
    data["created_by"] = user.id

    if 'seating_config' not in data or not data['seating_config']:
        data['seating_config'] = {}
        
    res = supabase.table("sessions").insert(data).execute()
    return res.data[0]

# --- Direct routes (under /api/sessions) ---

@direct_router.get("/{session_id}", response_model=Dict[str, Any])
def get_session(session_id: str, supabase: Client = Depends(get_supabase), user = Depends(get_current_user)):
    res = supabase.table("sessions").select("*").eq("id", session_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Session not found")
    return res.data[0]

@direct_router.patch("/{session_id}", response_model=Dict[str, Any])
def update_session(session_id: str, session: SessionUpdate, supabase: Client = Depends(get_supabase), user = Depends(require_editor_or_admin)):
    data = session.model_dump(exclude_unset=True)
    data["updated_at"] = "now()"

        
    res = supabase.table("sessions").update(data).eq("id", session_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Session not found")
    return res.data[0]

# DELETE requires admin — per AGENT_CONTEXT.md §6.4
@direct_router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(session_id: str, supabase: Client = Depends(get_supabase), user = Depends(require_admin)):
    supabase.table("sessions").delete().eq("id", session_id).execute()
    return None

# --- Seating Config ---

@direct_router.patch("/{session_id}/seating-config", response_model=Dict[str, Any])
def update_seating_config(session_id: str, config: dict, supabase: Client = Depends(get_supabase), user = Depends(require_editor_or_admin)):
    """Updates seating configuration for a session (stored as JSONB in sessions table)."""
    res = supabase.table("sessions").update({
        "seating_config": config,
        "updated_at": "now()"
    }).eq("id", session_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Session not found")
    return res.data[0]

# --- Clone arrangement from another session ---

@direct_router.post("/{target_session_id}/clone-from/{source_session_id}", response_model=List[Dict[str, Any]])
def clone_arrangement(target_session_id: str, source_session_id: str, supabase: Client = Depends(get_supabase), user = Depends(require_editor_or_admin)):
    """
    Copy all dignitaries + seating_config from source session into target session.
    - New UUIDs are generated for each dignitary
    - Status is reset to 'pending'
    - Works across different conferences
    """
    # Verify both sessions exist
    source = supabase.table("sessions").select("*").eq("id", source_session_id).execute()
    if not source.data:
        raise HTTPException(status_code=404, detail="Source session not found")
    
    target = supabase.table("sessions").select("*").eq("id", target_session_id).execute()
    if not target.data:
        raise HTTPException(status_code=404, detail="Target session not found")
    
    # Copy seating_config from source to target
    source_config = source.data[0].get("seating_config", {})
    if source_config:
        supabase.table("sessions").update({
            "seating_config": source_config,
            "updated_at": "now()"
        }).eq("id", target_session_id).execute()
    
    # Get all dignitaries from source session
    src_dignitaries = supabase.table("dignitaries").select("*").eq("session_id", source_session_id).execute()
    
    if not src_dignitaries.data:
        return []
    
    # Copy each dignitary into the target session
    new_dignitaries = []
    for d in src_dignitaries.data:
        new_d = {
            "session_id": target_session_id,
            "name": d["name"],
            "title": d["title"],
            "church": d.get("church"),
            "extension": d.get("extension"),
            "section": d.get("section"),
            "row_num": d.get("row_num"),
            "col_num": d.get("col_num"),
            "status": "pending",           # Reset — they haven't arrived at the new session
            "notes": d.get("notes"),
            "picture_url": d.get("picture_url"),
            "created_by": user.id,
        }
        new_dignitaries.append(new_d)
    
    # Bulk insert
    res = supabase.table("dignitaries").insert(new_dignitaries).execute()
    return res.data
