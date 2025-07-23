"""
AI Router for Professor AI Helper

This module provides API endpoints for AI-powered teaching assistant features.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging
import json

from app.models import User
from app.database import get_db
from app.auth import get_current_active_user
from app.ai_services import teaching_assistant
from app.schemas_ai import (
    ChatRequest, ChatResponse, DocumentRequest
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/ai",
    tags=["AI Services"],
    responses={404: {"description": "Not found"}},
)

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    Handles chat interactions, using document context if provided.
    """
    try:
        logger.info(f"Processing chat request for user {current_user.id}")
        
        response_text = teaching_assistant.analyze_document_chat(
            document_text=request.document_text or "",
            query=request.query,
            chat_history=request.history or []
        )
        
        return ChatResponse(message=response_text)
        
    except Exception as e:
        logger.exception("Error in chat_with_ai endpoint")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing chat request: {str(e)}"
        )

@router.post("/generate-report", response_model=dict)
async def generate_report_from_data(
    request: DocumentRequest, # Using a generic request for simplicity
    current_user: User = Depends(get_current_active_user)
):
    """
    Generates a detailed class report from a string of class data.
    """
    try:
        logger.info(f"Generating class report for user {current_user.id}")
        report = teaching_assistant.generate_class_report(request.text)
        return {"report": report}
    except Exception as e:
        logger.exception("Error in generate_report_from_data endpoint")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating report: {str(e)}"
        )
