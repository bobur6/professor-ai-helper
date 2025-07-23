from sqlalchemy.orm import Session, joinedload, selectinload
import pandas as pd
from fastapi import HTTPException, status
from app import models, schemas, security
from app.security import get_password_hash

# User CRUD operations
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def authenticate_user(db: Session, email: str, password: str):
    """Authenticate a user with email and password."""
    user = get_user_by_email(db, email=email)
    if not user or not security.verify_password(password, user.password_hash):
        return None
    return user

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(email=user.email, password_hash=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Document CRUD operations
def get_document(db: Session, document_id: int, user_id: int):
    return db.query(models.Document).filter(models.Document.id == document_id, models.Document.user_id == user_id).first()

def get_documents_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Document).filter(models.Document.user_id == user_id).offset(skip).limit(limit).all()

def delete_document(db: Session, document_id: int, user_id: int):
    db_document = get_document(db, document_id, user_id)
    if not db_document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied"
        )
    db.delete(db_document)
    db.commit()
    return True

def create_user_document(db: Session, file_name: str, file_path: str, file_type: str, user_id: int, extracted_text: str = "", file_size: int = 0):
    db_document = models.Document(
        file_name=file_name,
        file_path=file_path,
        file_type=file_type,
        user_id=user_id,
        extracted_text_content=extracted_text,
        file_size=file_size
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    return db_document

# Chat History CRUD operations
def get_chat_history_by_document(db: Session, document_id: int, user_id: int, skip: int = 0, limit: int = 1000):
    return db.query(models.ChatHistory)\
        .filter(models.ChatHistory.document_id == document_id, models.ChatHistory.user_id == user_id)\
        .order_by(models.ChatHistory.timestamp.asc())\
        .offset(skip).limit(limit).all()

def create_chat_history(db: Session, chat: schemas.ChatHistoryCreate, user_id: int, ai_response: str):
    db_chat = models.ChatHistory(**chat.model_dump(), user_id=user_id, ai_response=ai_response)
    db.add(db_chat)
    db.commit()
    db.refresh(db_chat)
    return db_chat

# Generic update function
def update_db_object(db_obj, data):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(db_obj, field, value)
    return db_obj

# Class CRUD operations
def get_class(db: Session, class_id: int, user_id: int):
    return db.query(models.Class).filter(models.Class.id == class_id, models.Class.user_id == user_id).first()

def get_classes_by_user(db: Session, user_id: int):
    return db.query(models.Class).filter(models.Class.user_id == user_id).all()

def create_class(db: Session, class_data: schemas.ClassCreate, user_id: int):
    db_class = models.Class(**class_data.model_dump(), user_id=user_id)
    db.add(db_class)
    db.commit()
    db.refresh(db_class)
    return db_class

def update_class(db: Session, class_id: int, class_data: schemas.ClassUpdate, user_id: int):
    db_class = get_class(db, class_id, user_id)
    if db_class:
        update_db_object(db_class, class_data)
        db.commit()
        db.refresh(db_class)
    return db_class

def delete_class(db: Session, class_id: int, user_id: int):
    db_class = get_class(db, class_id, user_id)
    if db_class:
        db.delete(db_class)
        db.commit()
    return db_class

# Student CRUD operations
def create_student(db: Session, student_data: schemas.StudentCreate, class_id: int):
    db_student = models.Student(**student_data.model_dump(), class_id=class_id)
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

def update_student(db: Session, student_id: int, student_data: schemas.StudentUpdate, user_id: int):
    db_student = db.query(models.Student).join(models.Class).filter(
        models.Student.id == student_id, models.Class.user_id == user_id
    ).first()
    if db_student:
        update_db_object(db_student, student_data)
        db.commit()
        db.refresh(db_student)
    return db_student

def delete_student(db: Session, student_id: int, user_id: int):
    db_student = db.query(models.Student).join(models.Class).filter(
        models.Student.id == student_id, models.Class.user_id == user_id
    ).first()
    if db_student:
        db.delete(db_student)
        db.commit()
        return db_student
    return None

# Assignment CRUD operations
def create_assignment(db: Session, assignment_data: schemas.AssignmentCreate, class_id: int):
    db_assignment = models.Assignment(**assignment_data.model_dump(), class_id=class_id)
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

def update_assignment(db: Session, assignment_id: int, assignment_data: schemas.AssignmentUpdate, user_id: int):
    db_assignment = db.query(models.Assignment).join(models.Class).filter(
        models.Assignment.id == assignment_id, models.Class.user_id == user_id
    ).first()
    if db_assignment:
        update_db_object(db_assignment, assignment_data)
        db.commit()
        db.refresh(db_assignment)
    return db_assignment

def delete_assignment(db: Session, assignment_id: int, user_id: int):
    db_assignment = db.query(models.Assignment).join(models.Class).filter(
        models.Assignment.id == assignment_id, models.Class.user_id == user_id
    ).first()
    if db_assignment:
        db.delete(db_assignment)
        db.commit()
        return db_assignment
    return None

# Grade CRUD operations
def create_or_update_grade(db: Session, student_id: int, assignment_id: int, grade_data: schemas.GradeUpdate, user_id: int):
    student = db.query(models.Student).join(models.Class).filter(models.Student.id == student_id, models.Class.user_id == user_id).first()
    assignment = db.query(models.Assignment).join(models.Class).filter(models.Assignment.id == assignment_id, models.Class.user_id == user_id).first()

    if not student or not assignment or student.class_id != assignment.class_id:
        return None

    db_grade = db.query(models.Grade).filter(
        models.Grade.student_id == student_id, models.Grade.assignment_id == assignment_id
    ).first()

    if db_grade:
        db_grade.grade = grade_data.grade
    else:
        db_grade = models.Grade(student_id=student_id, assignment_id=assignment_id, grade=grade_data.grade)
        db.add(db_grade)
    
    db.commit()
    db.refresh(db_grade)
    return db_grade

# Complex queries
def import_data_from_excel(db: Session, class_id: int, file_path: str):
    df = pd.read_excel(file_path, header=0)

    existing_students = {s.full_name: s.id for s in db.query(models.Student).filter(models.Student.class_id == class_id).all()}
    existing_assignments = {a.title: a.id for a in db.query(models.Assignment).filter(models.Assignment.class_id == class_id).all()}

    student_name_col = df.columns[0]
    assignment_cols = df.columns[1:]

    with db.begin_nested():
        for col_title in assignment_cols:
            if col_title not in existing_assignments:
                new_assignment = models.Assignment(title=col_title, class_id=class_id)
                db.add(new_assignment)
                db.flush()
                existing_assignments[col_title] = new_assignment.id

        for index, row in df.iterrows():
            student_name = row[student_name_col]
            if pd.isna(student_name):
                continue

            if student_name not in existing_students:
                new_student = models.Student(full_name=student_name, class_id=class_id)
                db.add(new_student)
                db.flush()
                student_id = new_student.id
                existing_students[student_name] = student_id
            else:
                student_id = existing_students[student_name]

            for assignment_title in assignment_cols:
                grade_val = row[assignment_title]
                if pd.isna(grade_val) or str(grade_val).strip() == '':
                    continue

                assignment_id = existing_assignments[assignment_title]
                db_grade = db.query(models.Grade).filter(
                    models.Grade.student_id == student_id, models.Grade.assignment_id == assignment_id
                ).first()

                if db_grade:
                    db_grade.grade = str(grade_val)
                else:
                    new_grade = models.Grade(student_id=student_id, assignment_id=assignment_id, grade=str(grade_val))
                    db.add(new_grade)
    db.commit()

def get_class_details(db: Session, class_id: int, user_id: int) -> models.Class:
    """Get class details with an optimized query to load all related data."""
    return (
        db.query(models.Class)
        .filter(models.Class.id == class_id, models.Class.user_id == user_id)
        .options(
            selectinload(models.Class.students).selectinload(models.Student.grades),
            selectinload(models.Class.assignments),
        )
        .first()
    )
