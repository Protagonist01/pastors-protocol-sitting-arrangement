import os
from pathlib import Path
from supabase import create_client, Client
from pydantic_settings import BaseSettings

# Find the .env file (works for both local dev and Vercel serverless)
_env_path = Path(__file__).resolve().parent.parent / ".env"

class Settings(BaseSettings):
    supabase_url: str
    supabase_key: str
    
    class Config:
        env_file = str(_env_path) if _env_path.exists() else None

try:
    settings = Settings()
    supabase: Client = create_client(settings.supabase_url, settings.supabase_key)
except Exception as e:
    import traceback
    traceback.print_exc()
    print(f"Warning: Failed to initialize Supabase client. Check .env variables. Details: {e}")
    supabase = None

def get_supabase() -> Client:
    return supabase
