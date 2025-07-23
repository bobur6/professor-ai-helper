"""
Professor AI Helper Backend Application Package

This is the main package for the Professor AI Helper backend API.
"""

# Import and expose the main components
from . import (
    models, schemas, schemas_ai, auth, crud, database, 
    ai_services_enhanced as ai_services, file_processing, security
)

# Make frequently used items directly available
from .models import Base, User, Document, ChatHistory, Class, Student, Assignment, Grade
from .schemas import UserCreate, User, Token, TokenData, Document, ChatHistory, Class, Student, Assignment, Grade

# Export security functions and variables
from .security import (
    get_password_hash,
    verify_password,
    create_access_token,
    verify_token,
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

# Make these available when importing from the package
__all__ = [
    'models',
    'schemas',
    'schemas_ai',
    'auth',
    'crud',
    'database',
    'ai_services',
    'file_processing',
    'security',
    'Base',
    'User',
    'Document',
    'ChatHistory',
    'Class',
    'Student',
    'Assignment',
    'Grade',
    'UserCreate',
    'Token',
    'TokenData',
    'get_password_hash',
    'verify_password',
    'create_access_token',
    'verify_token',
    'SECRET_KEY',
    'ALGORITHM',
    'ACCESS_TOKEN_EXPIRE_MINUTES'
]
