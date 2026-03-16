from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
from .db import get_supabase

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), supabase: Client = Depends(get_supabase)):
    """
    Validates the Supabase JWT token and extracts the user.
    """
    token = credentials.credentials
    try:
        # We verify the token by calling Supabase's auth.get_user(jwt)
        # In a real high-throughput production environment, you might decode the JWT locally with the Supabase project JWT secret
        # to avoid the network roundtrip, but calling the Supabase API is safer to ensure it's not revoked.
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user_response.user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

def require_editor_or_admin(user = Depends(get_current_user), supabase: Client = Depends(get_supabase)):
    """
    Checks the user's profile to see if they hold 'editor' or 'admin' roles.
    """
    try:
        res = supabase.table("profiles").select("role").eq("id", user.id).single().execute()
        role = res.data.get("role")
        if role not in ["admin", "editor"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action. Editor or Admin role required."
            )
        return user
    except Exception as e:
        # If no profile or error fetching profile
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission check failed: {str(e)}"
        )
