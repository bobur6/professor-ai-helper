import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Use SQLite for development if PostgreSQL is not available
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL or "postgresql" in DATABASE_URL:
    # Fallback to SQLite for development
    DATABASE_URL = "sqlite:///./professor_ai.db"
    print(f"Using SQLite database: {DATABASE_URL}")
else:
    print(f"Using PostgreSQL database: {DATABASE_URL}")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
