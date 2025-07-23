"""
Documents Router

Handles document upload, retrieval, and management.
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
import os
import uuid
import logging
from typing import List
from datetime import datetime

logger = logging.getLogger(__name__)

from app.database import get_db
from app import models, schemas, crud
from app.auth import get_current_active_user
from app.file_processing import extract_text

router = APIRouter(
    tags=["documents"],
    responses={404: {"description": "Not found"}},
)

@router.post("/documents/upload", response_model=schemas.Document)
async def upload_file(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Upload a file and save it to the database.
    
    Returns:
        Document: The created document object with metadata
    """
    try:
        # Validate file type
        allowed_types = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ]
        
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File type not supported. Please upload a PDF, DOC, DOCX, or TXT file."
            )
            
        # Create upload directory if it doesn't exist
        UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploaded_files"))
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        
        # Generate a unique filename to prevent collisions
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{str(uuid.uuid4())}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Save file to disk with absolute path
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Extract text from the uploaded file
        extracted_text = extract_text(file_path, file.filename)
        
        # Create document in database
        document = crud.create_user_document(
            db=db,
            file_name=file.filename,  # Keep original filename in DB
            file_path=file_path,      # But use unique filename on disk
            file_type=file.content_type,
            file_size=len(content),
            user_id=current_user.id,
            extracted_text=extracted_text
        )
        
        return document
        
    except HTTPException:
        raise
    except Exception as e:
        # Clean up file if it was partially written
        if 'file_path' in locals() and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except:
                pass
                
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading file: {str(e)}"
        )

@router.get("/documents", response_model=List[schemas.Document])
def get_documents(
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get all documents for the current user with pagination.
    
    Args:
        skip: Number of records to skip (for pagination)
        limit: Maximum number of records to return (for pagination)
        
    Returns:
        List[Document]: List of document objects
    """
    try:
        documents = crud.get_documents_by_user(
            db=db,
            user_id=current_user.id,
            skip=skip,
            limit=limit
        )
        return documents
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving documents: {str(e)}"
        )

@router.get("/documents/{document_id}", response_model=schemas.Document)
def get_document(
    document_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get a single document by ID.
    
    Args:
        document_id: The ID of the document to retrieve
        
    Returns:
        Document: The requested document object
        
    Raises:
        HTTPException: If document is not found or access is denied
    """
    try:
        # Log the request for debugging
        logger.info(f"Retrieving document {document_id} for user {current_user.id}")
        
        # Validate document_id
        if not isinstance(document_id, int) or document_id <= 0:
            logger.warning(f"Invalid document_id: {document_id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid document ID"
            )
        
        # Get the document
        document = crud.get_document(db=db, document_id=document_id, user_id=current_user.id)
        
        # Check if document exists and belongs to the user
        if not document:
            logger.warning(f"Document {document_id} not found or doesn't belong to user {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found or access denied"
            )
            
        logger.info(f"Successfully retrieved document {document_id}")
        return document
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving document {document_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving document: {str(e)}"
        )

@router.delete("/documents/{document_id}", status_code=status.HTTP_200_OK)
async def delete_document(
    document_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a document by ID.
    
    Args:
        document_id: The ID of the document to delete
        
    Returns:
        dict: Success message with status and data
        
    Raises:
        HTTPException: If document is not found, access is denied, or deletion fails
    """
    try:
        # First get the document to check permissions and get file path
        document = crud.get_document(db=db, document_id=document_id, user_id=current_user.id)
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found or access denied"
            )
            
        file_deleted = False
        # Delete the file from storage
        if document.file_path and os.path.exists(document.file_path):
            try:
                os.remove(document.file_path)
                file_deleted = True
            except Exception as e:
                logger.error(f"Failed to delete file {document.file_path}: {str(e)}")
                # Continue with DB deletion even if file deletion fails
        
        # Delete the database record
        success = crud.delete_document(db=db, document_id=document_id, user_id=current_user.id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete document from database"
            )
        
        return {
            "status": "success",
            "message": "Document deleted successfully",
            "data": {
                "document_id": document_id,
                "file_deleted": file_deleted
            }
        }
        
    except HTTPException as he:
        logger.error(f"HTTP Error deleting document {document_id}: {str(he.detail)}")
        raise he
    except Exception as e:
        logger.error(f"Error deleting document {document_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting document: {str(e)}"
        )

@router.get("/documents/debug/{document_id}")
async def debug_document(
    document_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Debug endpoint to get detailed information about a document and the request.
    This helps diagnose issues with document retrieval.
    """
    try:
        # Validate document_id
        if not isinstance(document_id, int) or document_id <= 0:
            logger.warning(f"Invalid document_id in debug request: {document_id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid document ID: {document_id}"
            )
            
        # Get basic document info without filtering by user_id
        document = db.query(models.Document).filter(models.Document.id == document_id).first()
        
        # Prepare response with detailed debug info
        response = {
            "request_info": {
                "document_id": document_id,
                "user_id": current_user.id,
                "user_email": current_user.email,
                "timestamp": str(datetime.now())
            },
            "document_exists": document is not None,
            "document_info": None,
            "access_check": None,
            "all_documents_for_user": [
                {"id": doc.id, "file_name": doc.file_name} 
                for doc in db.query(models.Document)
                .filter(models.Document.user_id == current_user.id)
                .all()
            ]
        }
        
        # Add document info if it exists
        if document:
            response["document_info"] = {
                "id": document.id,
                "owner_id": document.user_id,
                "file_name": document.file_name,
                "file_type": document.file_type,
                "uploaded_at": str(document.uploaded_at),
                "has_content": bool(document.extracted_text_content),
                "content_length": len(document.extracted_text_content or "") if document.extracted_text_content else 0
            }
            
            # Check if user has access
            response["access_check"] = {
                "has_access": document.user_id == current_user.id,
                "owner_matches_current_user": document.user_id == current_user.id
            }
        
        logger.info(f"Debug info for document {document_id}: {response}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in debug_document for ID {document_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error debugging document: {str(e)}"
        )