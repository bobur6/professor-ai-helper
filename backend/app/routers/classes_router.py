"""
Classes Router

Handles class management operations.
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os
import uuid

from app.database import get_db
from app import models, schemas, crud
from app.auth import get_current_active_user

router = APIRouter(
    tags=["classes"],
    responses={404: {"description": "Not found"}},
)

@router.post("/classes", response_model=schemas.Class, status_code=status.HTTP_201_CREATED)
def create_class(
    class_data: schemas.ClassCreate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new class."""
    return crud.create_class(db=db, class_data=class_data, user_id=current_user.id)

@router.get("/classes", response_model=List[schemas.Class])
def get_classes(
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all classes for the current user."""
    return crud.get_classes_by_user(db=db, user_id=current_user.id)

@router.get("/classes/{class_id}", response_model=schemas.ClassDetails)
def get_class(
    class_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get class by ID with details."""
    db_class = crud.get_class_details(db=db, class_id=class_id, user_id=current_user.id)
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
    return db_class

@router.put("/classes/{class_id}", response_model=schemas.Class)
def update_class(
    class_id: int,
    class_data: schemas.ClassUpdate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a class."""
    return crud.update_class(db=db, class_id=class_id, class_data=class_data, user_id=current_user.id)

@router.delete("/classes/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_class(
    class_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a class."""
    crud.delete_class(db=db, class_id=class_id, user_id=current_user.id)
    return {"message": "Class deleted successfully"}

# Student management endpoints
@router.post("/classes/{class_id}/students", response_model=schemas.Student, status_code=status.HTTP_201_CREATED)
def add_student(
    class_id: int,
    student: schemas.StudentCreate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Add a student to a class."""
    # Verify the class exists and belongs to the user
    db_class = crud.get_class(db=db, class_id=class_id, user_id=current_user.id)
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    return crud.create_student(db=db, student_data=student, class_id=class_id)

@router.get("/classes/{class_id}/students", response_model=List[schemas.Student])
def get_students(
    class_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all students in a class."""
    # Verify the class exists and belongs to the user
    db_class = crud.get_class(db=db, class_id=class_id, user_id=current_user.id)
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    return crud.get_students_by_class(db=db, class_id=class_id)

@router.put("/classes/{class_id}/students/{student_id}", response_model=schemas.Student)
def update_student_in_class(
    class_id: int,
    student_id: int,
    student: schemas.StudentUpdate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a student's details within a class."""
    # First, verify the class belongs to the user to ensure authorization
    db_class = crud.get_class(db=db, class_id=class_id, user_id=current_user.id)
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")

    updated_student = crud.update_student(db=db, student_id=student_id, student_data=student, user_id=current_user.id)
    if not updated_student:
        raise HTTPException(status_code=404, detail="Student not found or not in this class")
    return updated_student

@router.delete("/classes/{class_id}/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_student(
    class_id: int,
    student_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Remove a student from a class."""
    # The user_id check is now handled in crud.delete_student
    deleted_student = crud.delete_student(db=db, student_id=student_id, user_id=current_user.id)
    
    if not deleted_student:
        raise HTTPException(status_code=404, detail="Student not found or you do not have permission to delete it")

    return {"message": "Student removed successfully"}

# Assignment management endpoints
@router.post("/classes/{class_id}/assignments", response_model=schemas.Assignment, status_code=status.HTTP_201_CREATED)
def create_assignment_for_class(
    class_id: int,
    assignment: schemas.AssignmentCreate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new assignment for a specific class."""
    db_class = crud.get_class(db=db, class_id=class_id, user_id=current_user.id)
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
    return crud.create_assignment(db=db, assignment_data=assignment, class_id=class_id)

@router.put("/classes/{class_id}/assignments/{assignment_id}", response_model=schemas.Assignment)
def update_assignment_in_class(
    class_id: int, # Included for URL consistency, but user check is the key
    assignment_id: int,
    assignment: schemas.AssignmentUpdate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update an assignment's details."""
    updated_assignment = crud.update_assignment(db=db, assignment_id=assignment_id, assignment_data=assignment, user_id=current_user.id)
    if not updated_assignment:
        raise HTTPException(status_code=404, detail="Assignment not found or you do not have permission")
    return updated_assignment

@router.delete("/classes/{class_id}/assignments/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assignment_from_class(
    class_id: int,
    assignment_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete an assignment from a class."""
    deleted_assignment = crud.delete_assignment(db=db, assignment_id=assignment_id, user_id=current_user.id)
    if not deleted_assignment:
        raise HTTPException(status_code=404, detail="Assignment not found or you do not have permission")
    return {"message": "Assignment deleted successfully"}

# Grade management endpoints
@router.post("/classes/{class_id}/students/{student_id}/assignments/{assignment_id}/grade", response_model=schemas.Grade)
def set_grade_for_student(
    class_id: int,
    student_id: int,
    assignment_id: int,
    grade: schemas.GradeUpdate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create or update a grade for a student on a specific assignment."""
    # The authorization is handled inside the CRUD function
    updated_grade = crud.create_or_update_grade(
        db=db, 
        student_id=student_id, 
        assignment_id=assignment_id, 
        grade_data=grade, 
        user_id=current_user.id
    )
    if not updated_grade:
        raise HTTPException(status_code=404, detail="Student, assignment not found, or you do not have permission")
    return updated_grade

@router.post("/classes/{class_id}/file-report", response_model=dict)
async def generate_file_report(
    class_id: int,
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Generate a report from an uploaded file for a specific class.
    The file is temporarily saved, processed using AI, and then deleted.
    """
    # Verify the class exists and belongs to the user
    db_class = crud.get_class(db=db, class_id=class_id, user_id=current_user.id)
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Create a temporary directory if it doesn't exist
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    
    temp_filepath = None
    try:
        # Generate a unique filename
        file_extension = os.path.splitext(file.filename)[1] if file.filename else '.txt'
        temp_filename = f"{uuid.uuid4()}{file_extension}"
        temp_filepath = os.path.join(temp_dir, temp_filename)
        
        # Save the uploaded file temporarily
        with open(temp_filepath, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Read file content as text for AI processing
        file_content = ""
        if file_extension.lower() in ['.csv', '.txt', '.md']:
            with open(temp_filepath, 'r', encoding='utf-8') as f:
                file_content = f.read()
        elif file_extension.lower() in ['.xlsx', '.xls']:
            # For Excel files, we'll use pandas to read and convert to text format
            import pandas as pd
            df = pd.read_excel(temp_filepath)
            file_content = df.to_string(index=False)
        elif file_extension.lower() in ['.docx', '.doc']:
            # For Word files, we'll use python-docx to read
            try:
                import docx
                doc = docx.Document(temp_filepath)
                file_content = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            except ImportError:
                raise HTTPException(
                    status_code=500,
                    detail="python-docx library not installed. Cannot process Word documents."
                )
        elif file_extension.lower() == '.pdf':
            # For PDF files, we'll use PyPDF2 to read
            try:
                import PyPDF2
                with open(temp_filepath, 'rb') as pdf_file:
                    pdf_reader = PyPDF2.PdfReader(pdf_file)
                    file_content = "\n".join([page.extract_text() for page in pdf_reader.pages])
            except ImportError:
                raise HTTPException(
                    status_code=500,
                    detail="PyPDF2 library not installed. Cannot process PDF documents."
                )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format: {file_extension}"
            )
        
        # Process the file content using AI to generate a report
        from app.ai_services import teaching_assistant
        report_content = teaching_assistant.generate_file_report(file_content)

        # Гарантируем, что report всегда строка
        if not report_content or (isinstance(report_content, dict) and "error" in report_content):
            report_content = "Не удалось сгенерировать отчёт по файлу. Проверьте формат и содержимое файла."

        return {
            "status": "success",
            "class_id": class_id,
            "filename": file.filename,
            "report": report_content
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing file: {str(e)}"
        )
    finally:
        # Clean up: remove the temporary file if it exists
        try:
            if temp_filepath and os.path.exists(temp_filepath):
                os.remove(temp_filepath)
        except Exception as e:
            print(f"Warning: Could not remove temporary file: {e}")

@router.post("/classes/{class_id}/import-data", response_model=dict)
async def import_class_data(
    class_id: int,
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Import data from an uploaded file for a specific class.
    The file is temporarily saved, processed using AI, and then deleted.
    """
    # Verify the class exists and belongs to the user
    db_class = crud.get_class(db=db, class_id=class_id, user_id=current_user.id)
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Check if the file is an Excel file
    if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Please upload an Excel (.xlsx, .xls) or CSV file."
        )
    
    # Create a temporary directory if it doesn't exist
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    
    temp_filepath = None
    try:
        # Generate a unique filename
        file_extension = os.path.splitext(file.filename)[1]
        temp_filename = f"{uuid.uuid4()}{file_extension}"
        temp_filepath = os.path.join(temp_dir, temp_filename)
        
        # Save the uploaded file temporarily
        with open(temp_filepath, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Read file content as text for AI processing
        file_content = ""
        if file_extension.lower() == '.csv':
            with open(temp_filepath, 'r', encoding='utf-8') as f:
                file_content = f.read()
        else:
            # For Excel files, we'll use pandas to read and convert to CSV format
            import pandas as pd
            df = pd.read_excel(temp_filepath)
            file_content = df.to_csv(index=False)
        
        # Process the file content using AI
        from app.ai_services import teaching_assistant
        processed_data = teaching_assistant.process_import_file(file_content)
        
        if "error" in processed_data:
            raise HTTPException(
                status_code=500,
                detail=f"Error processing file: {processed_data['error']}"
            )
        
        # Import the processed data into the database
        try:
            # Import students
            if "students" in processed_data:
                for student_data in processed_data["students"]:
                    student_name = student_data.get("name")
                    if student_name:
                        # Check if student already exists
                        existing_student = db.query(models.Student).filter(
                            models.Student.full_name == student_name,
                            models.Student.class_id == class_id
                        ).first()
                        
                        if not existing_student:
                            new_student = models.Student(full_name=student_name, class_id=class_id)
                            db.add(new_student)
            
            # Import assignments
            if "assignments" in processed_data:
                for assignment_data in processed_data["assignments"]:
                    title = assignment_data.get("title")
                    description = assignment_data.get("description", "")
                    if title:
                        # Check if assignment already exists
                        existing_assignment = db.query(models.Assignment).filter(
                            models.Assignment.title == title,
                            models.Assignment.class_id == class_id
                        ).first()
                        
                        if not existing_assignment:
                            new_assignment = models.Assignment(
                                title=title,
                                description=description,
                                class_id=class_id
                            )
                            db.add(new_assignment)
            
            # Import grades
            if "grades" in processed_data:
                for grade_data in processed_data["grades"]:
                    student_name = grade_data.get("student_name")
                    assignment_title = grade_data.get("assignment_title")
                    grade_value = grade_data.get("grade")
                    
                    if student_name and assignment_title and grade_value:
                        # Get student and assignment IDs
                        student = db.query(models.Student).filter(
                            models.Student.full_name == student_name,
                            models.Student.class_id == class_id
                        ).first()
                        
                        assignment = db.query(models.Assignment).filter(
                            models.Assignment.title == assignment_title,
                            models.Assignment.class_id == class_id
                        ).first()
                        
                        if student and assignment:
                            # Check if grade already exists
                            existing_grade = db.query(models.Grade).filter(
                                models.Grade.student_id == student.id,
                                models.Grade.assignment_id == assignment.id
                            ).first()
                            
                            if existing_grade:
                                existing_grade.grade = str(grade_value)
                            else:
                                new_grade = models.Grade(
                                    student_id=student.id,
                                    assignment_id=assignment.id,
                                    grade=str(grade_value)
                                )
                                db.add(new_grade)
            
            db.commit()
            
            return {
                "status": "success",
                "message": "Data imported successfully",
                "class_id": class_id,
                "filename": file.filename
            }
            
        except Exception as db_error:
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Error importing data to database: {str(db_error)}"
            )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing file: {str(e)}"
        )
    finally:
        # Clean up: remove the temporary file if it exists
        try:
            if temp_filepath and os.path.exists(temp_filepath):
                os.remove(temp_filepath)
        except Exception as e:
            print(f"Warning: Could not remove temporary file: {e}")
