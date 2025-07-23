"""
Main entry point for the Professor AI Helper backend application.
This file serves as a launcher for the FastAPI application defined in app/main.py.
"""
import uvicorn

if __name__ == "__main__":
    print("Starting Professor AI Helper backend server...")
    print("Access the API at: http://localhost:8000/api/v1")
    print("Access the API documentation at: http://localhost:8000/docs")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)