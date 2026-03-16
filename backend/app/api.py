from fastapi import APIRouter
from .endpoints import conferences, sessions, attendees

api_router = APIRouter()
api_router.include_router(conferences.router, prefix="/conferences", tags=["conferences"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
api_router.include_router(attendees.router, prefix="/attendees", tags=["attendees"])
