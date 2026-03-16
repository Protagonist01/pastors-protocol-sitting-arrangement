from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import api_router

app = FastAPI(
    title="Pastors' Protocol API",
    description="Backend API for managing dignitaries and pastors seating.",
    version="1.0.0"
)

# Configure CORS
# In production, this should be restricted to the deployed Vercel frontend URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/health")
def health_check():
    return {"status": "ok"}
