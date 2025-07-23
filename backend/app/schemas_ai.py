"""
AI Service Schemas for Professor AI Helper

This module defines Pydantic models for AI service requests and responses.
"""
from typing import List, Optional, Dict
from pydantic import BaseModel, Field

# Generic document request for text-based AI operations
class DocumentRequest(BaseModel):
    """A generic request model for operations requiring text content."""
    text: str = Field(..., description="The text content to be processed.")

# Chat-related models
class ChatMessage(BaseModel):
    """Model for a single chat message, mirroring frontend structure."""
    role: str
    content: str

class ChatRequest(BaseModel):
    """Request model for chat interactions."""
    query: str = Field(..., description="The user's query.")
    document_text: Optional[str] = Field(None, description="The context from the document.")
    history: Optional[List[Dict]] = Field([], description="The chat history.")

class ChatResponse(BaseModel):
    """Response model for chat interactions."""
    message: str = Field(..., description="The AI's response message.")
