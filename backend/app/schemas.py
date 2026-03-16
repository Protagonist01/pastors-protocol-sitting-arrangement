from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, time

# Conferences
class ConferenceBase(BaseModel):
    name: str
    date: Optional[date] = None
    venue: Optional[str] = None
    description: Optional[str] = None

class ConferenceCreate(ConferenceBase):
    pass

class ConferenceUpdate(ConferenceBase):
    name: Optional[str] = None

# Sessions
class SessionBase(BaseModel):
    name: str
    date: Optional[date] = None
    time: Optional[time] = None
    description: Optional[str] = None

class SessionCreate(SessionBase):
    conference_id: str

class SessionUpdate(SessionBase):
    name: Optional[str] = None

# Attendees
class AttendeeBase(BaseModel):
    name: str
    title: Optional[str] = None
    church: Optional[str] = None
    extension: Optional[str] = None
    section_id: Optional[str] = None
    row_num: Optional[int] = None
    col_num: Optional[int] = None
    status: Optional[str] = "pending"
    notes: Optional[str] = None

class AttendeeCreate(AttendeeBase):
    session_id: str

class AttendeeUpdateStatus(BaseModel):
    status: str

# Seating configs
class SeatingConfigBase(BaseModel):
    section_id: str
    rows: int
    cols: int

class SeatingConfigCreate(SeatingConfigBase):
    session_id: str
