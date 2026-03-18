from pydantic import BaseModel
from typing import Optional, Literal


# ── User / Profile schemas ──

class RoleUpdate(BaseModel):
    role: Literal["admin", "editor", "protocol"]


# ── Conferences ──

class ConferenceCreate(BaseModel):
    name: str
    date: Optional[str] = None
    venue: Optional[str] = None
    description: Optional[str] = None

class ConferenceUpdate(BaseModel):
    name: Optional[str] = None
    date: Optional[str] = None
    venue: Optional[str] = None
    description: Optional[str] = None


# ── Sessions ──

class SessionCreate(BaseModel):
    name: str
    date: Optional[str] = None
    time: Optional[str] = None
    description: Optional[str] = None
    seating_config: Optional[dict] = {}
    # conference_id comes from the URL path, not the body

class SessionUpdate(BaseModel):
    name: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    description: Optional[str] = None
    seating_config: Optional[dict] = None


# ── Dignitaries ──

class DignitaryCreate(BaseModel):
    name: str
    title: str                          # free text, mandatory (per AGENT_CONTEXT.md §6.5)
    church: Optional[str] = None
    extension: Optional[str] = None     # branch / district / area
    section: Optional[str] = None
    row_num: Optional[int] = None
    col_num: Optional[int] = None
    notes: Optional[str] = None
    # session_id comes from the URL path, not the body

class DignitaryUpdate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    church: Optional[str] = None
    extension: Optional[str] = None
    section: Optional[str] = None
    row_num: Optional[int] = None
    col_num: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    picture_url: Optional[str] = None

class DignitaryStatusUpdate(BaseModel):
    status: Literal["pending", "arrived", "seated", "absent"]
