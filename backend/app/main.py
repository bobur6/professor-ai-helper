from fastapi import FastAPI, Depends, HTTPException, status, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import timedelta
import os

from app import models, schemas, security
from app.database import engine, get_db
from app.routers.ai_router import router as ai_router
from app.routers.auth_router import auth_router
from app.routers.documents_router import router as documents_router
from app.routers.classes_router import router as classes_router

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create upload directory if it doesn't exist
os.makedirs("uploaded_files", exist_ok=True)

# Mount static files
app.mount("/uploaded_files", StaticFiles(directory="uploaded_files"), name="uploaded_files")

# API router for version 1
api_v1_router = APIRouter(prefix="/api/v1")

# Include all routers under the /api/v1 prefix
api_v1_router.include_router(auth_router, tags=["Authentication"])
api_v1_router.include_router(ai_router, tags=["AI Services"])
api_v1_router.include_router(documents_router, tags=["Documents"])
api_v1_router.include_router(classes_router, tags=["Classes"])

@api_v1_router.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}

# Include the versioned API router in the main app
app.include_router(api_v1_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
