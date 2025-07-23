from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from typing import Optional, List

# User Schemas
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Document Schemas
class DocumentBase(BaseModel):
    file_name: str
    file_type: str

class Document(DocumentBase):
    id: int
    user_id: int
    uploaded_at: datetime
    extracted_text_content: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# Chat History Schemas
class ChatHistoryBase(BaseModel):
    user_query: str
    ai_response: str

class ChatHistoryCreate(BaseModel):
    document_id: int
    user_query: str

class ChatHistory(ChatHistoryBase):
    id: int
    user_id: int
    document_id: Optional[int] = None
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)

# Grade Schemas
class GradeBase(BaseModel):
    grade: Optional[str] = None

class GradeCreate(GradeBase):
    student_id: int
    assignment_id: int

class GradeUpdate(GradeBase):
    pass

class Grade(GradeBase):
    id: int
    student_id: int
    assignment_id: int
    model_config = ConfigDict(from_attributes=True)

# Assignment Schemas
class AssignmentBase(BaseModel):
    title: str
    description: Optional[str] = None

class AssignmentCreate(AssignmentBase):
    pass

class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

class Assignment(AssignmentBase):
    id: int
    class_id: int
    model_config = ConfigDict(from_attributes=True)

# Student Schemas
class StudentBase(BaseModel):
    full_name: str

class StudentCreate(StudentBase):
    pass

class StudentUpdate(StudentBase):
    pass

class Student(StudentBase):
    id: int
    class_id: int
    grades: List[Grade] = []
    model_config = ConfigDict(from_attributes=True)

# Class Schemas
class ClassBase(BaseModel):
    name: str

class ClassCreate(ClassBase):
    pass

class ClassUpdate(ClassBase):
    pass

class Class(ClassBase):
    id: int
    user_id: int

class ClassDetails(ClassBase):
    id: int
    assignments: List[Assignment] = []
    students: List[Student] = []
    model_config = ConfigDict(from_attributes=True)


