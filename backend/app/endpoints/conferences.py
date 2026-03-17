from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from typing import List, Dict, Any
from ..db import get_supabase
from ..auth import get_current_user, require_editor_or_admin, require_admin
from ..schemas import ConferenceCreate, ConferenceUpdate

router = APIRouter()

@router.get("/", response_model=List[Dict[str, Any]])
def get_conferences(supabase: Client = Depends(get_supabase), user = Depends(get_current_user)):
    res = supabase.table("conferences").select("*").order("created_at", desc=True).execute()
    return res.data

@router.get("/{conf_id}", response_model=Dict[str, Any])
def get_conference(conf_id: str, supabase: Client = Depends(get_supabase), user = Depends(get_current_user)):
    res = supabase.table("conferences").select("*").eq("id", conf_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Conference not found")
    return res.data[0]

@router.post("/", response_model=Dict[str, Any])
def create_conference(conf: ConferenceCreate, supabase: Client = Depends(get_supabase), user = Depends(require_editor_or_admin)):
    data = conf.model_dump(exclude_unset=True)
    # Set created_by to the authenticated user (per AGENT_CONTEXT.md §6.4)
    data["created_by"] = user.id
    # Pydantic date types need to be converted to strings for Supabase JSON serialization
    if 'date' in data and data['date']:
        data['date'] = data['date'].isoformat()
        
    res = supabase.table("conferences").insert(data).execute()
    return res.data[0]

@router.patch("/{conf_id}", response_model=Dict[str, Any])
def update_conference(conf_id: str, conf: ConferenceUpdate, supabase: Client = Depends(get_supabase), user = Depends(require_editor_or_admin)):
    data = conf.model_dump(exclude_unset=True)
    if 'date' in data and data['date']:
        data['date'] = data['date'].isoformat()
    data["updated_at"] = "now()"
        
    res = supabase.table("conferences").update(data).eq("id", conf_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Conference not found")
    return res.data[0]

# DELETE requires admin — per AGENT_CONTEXT.md §6.4
@router.delete("/{conf_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conference(conf_id: str, supabase: Client = Depends(get_supabase), user = Depends(require_admin)):
    supabase.table("conferences").delete().eq("id", conf_id).execute()
    return None
