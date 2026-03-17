from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from typing import List, Dict, Any
from ..db import get_supabase
from ..auth import get_current_user, require_editor_or_admin, require_admin
from ..schemas import DignitaryCreate, DignitaryUpdate, DignitaryStatusUpdate

# Nested router: mounted at /api/sessions
# Handles: GET /api/sessions/{session_id}/dignitaries, POST /api/sessions/{session_id}/dignitaries
nested_router = APIRouter()

# Direct router: mounted at /api/dignitaries
# Handles: GET /api/dignitaries/{id}, PATCH /api/dignitaries/{id}, etc.
direct_router = APIRouter()

# --- Nested routes (under /api/sessions) ---

@nested_router.get("/{session_id}/dignitaries", response_model=List[Dict[str, Any]])
def get_dignitaries_for_session(session_id: str, supabase: Client = Depends(get_supabase), user = Depends(get_current_user)):
    res = supabase.table("dignitaries").select("*").eq("session_id", session_id).order("created_at", desc=False).execute()
    return res.data

@nested_router.post("/{session_id}/dignitaries", response_model=Dict[str, Any])
def create_dignitary(session_id: str, dignitary: DignitaryCreate, supabase: Client = Depends(get_supabase), user = Depends(require_editor_or_admin)):
    data = dignitary.model_dump(exclude_unset=True)
    data["session_id"] = session_id
    data["created_by"] = user.id
    res = supabase.table("dignitaries").insert(data).execute()
    return res.data[0]

# --- Direct routes (under /api/dignitaries) ---

@direct_router.get("/{dignitary_id}", response_model=Dict[str, Any])
def get_dignitary(dignitary_id: str, supabase: Client = Depends(get_supabase), user = Depends(get_current_user)):
    res = supabase.table("dignitaries").select("*").eq("id", dignitary_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Dignitary not found")
    return res.data[0]

@direct_router.patch("/{dignitary_id}", response_model=Dict[str, Any])
def update_dignitary(dignitary_id: str, dignitary: DignitaryUpdate, supabase: Client = Depends(get_supabase), user = Depends(require_editor_or_admin)):
    data = dignitary.model_dump(exclude_unset=True)
    data["updated_at"] = "now()"
    res = supabase.table("dignitaries").update(data).eq("id", dignitary_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Dignitary not found")
    return res.data[0]

@direct_router.patch("/{dignitary_id}/status", response_model=Dict[str, Any])
def update_dignitary_status(dignitary_id: str, status_update: DignitaryStatusUpdate, supabase: Client = Depends(get_supabase), user = Depends(require_editor_or_admin)):
    res = supabase.table("dignitaries").update({
        "status": status_update.status,
        "updated_at": "now()"
    }).eq("id", dignitary_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Dignitary not found")
    return res.data[0]

# DELETE requires admin — per AGENT_CONTEXT.md §6.4
@direct_router.delete("/{dignitary_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dignitary(dignitary_id: str, supabase: Client = Depends(get_supabase), user = Depends(require_admin)):
    supabase.table("dignitaries").delete().eq("id", dignitary_id).execute()
    return None
