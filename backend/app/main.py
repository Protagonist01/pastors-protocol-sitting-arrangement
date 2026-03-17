from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from .api import api_router

app = FastAPI(
    title="Pastors' Protocol API",
    description="Backend API for managing dignitaries and pastors seating.",
    version="1.0.0"
)

cors_origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",") if origin.strip()]

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/health")
def health_check():
    return {"status": "ok"}
