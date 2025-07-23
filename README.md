# Professor AI Helper

Welcome to the Professor AI Helper project! This is a full-stack web application designed to assist university professors by automating tasks related to educational materials using AI.

## Project Goal

The primary goal is to develop a Minimum Viable Product (MVP) that allows professors to upload documents, generate educational content (tests, quizzes, summaries), and interact with an AI through a chat interface.

## Technology Stack

*   **Frontend:** React (Vite), Tailwind CSS, Axios
*   **Backend:** Python (FastAPI), SQLAlchemy
*   **Database:** PostgreSQL
*   **AI:** Google Gemini API
*   **Containerization:** Docker & Docker Compose

## Getting Started

Follow these steps to get your development environment set up and running.

### Prerequisites

*   [Docker](https://www.docker.com/products/docker-desktop/) and Docker Compose
*   [Node.js](https://nodejs.org/en/) (v18 or later) and npm
*   A code editor like [VS Code](https://code.visualstudio.com/)

### Setup Instructions

1.  **Clone the Repository:**
    ```bash
    git clone <your-repo-url>
    cd professor-ai-helper
    ```

2.  **Create Project Structure:**
    If you are starting from scratch, create the main directories:
    ```bash
    mkdir backend
    mkdir frontend
    ```

3.  **Initialize Frontend:**
    Navigate to the `frontend` directory and initialize a new React project using Vite. **It's important to do this before running Docker.**
    ```bash
    cd frontend
    npm create vite@latest . -- --template react
    # Follow the prompts. When it's done, you can go back to the root directory.
    cd ..
    ```

4.  **Environment Variables:**
    The project uses a `.env` file for configuration. I have already created this file for you with the necessary variables. You can review it to ensure the credentials are correct.

5.  **Build and Run with Docker Compose:**
    From the root directory (`professor-ai-helper/`), run the following command:
    ```bash
    docker compose up --build
    ```
    This command will build the Docker images for the frontend and backend services, start the containers, and set up the database. The first build might take a few minutes.

6.  **Access the Application:**
    *   **Frontend (React App):** [http://localhost:5173](http://localhost:5173)
    *   **Backend (FastAPI Docs):** [http://localhost:8000/docs](http://localhost:8000/docs)

--- 
*This README will be updated as we build more features.*
## Troubleshooting

### Common Issues

1. **"Invalid document ID" error when viewing documents**
   - Make sure the document ID in the URL is a valid positive integer
   - Check that you have permission to access the document
   - Try logging out and logging back in if your session may have expired

2. **AI Assistant not responding**
   - Verify that the GOOGLE_API_KEY environment variable is set correctly in your .env file
   - Check the backend logs for any API errors
   - Ensure your query is not too long (there are character limits)

3. **File upload failures**
   - Check that the file type is supported (PDF, DOCX, TXT)
   - Ensure the file size is not too large
   - Verify that the uploaded_files directory exists and has proper permissions

4. **Database connection issues**
   - Verify that the PostgreSQL container is running
   - Check the DATABASE_URL in your .env file
   - Ensure the database credentials are correct

### Restarting the Application

If you encounter issues, try restarting the application:

```bash
# Stop all containers
docker compose down

# Start everything again
docker compose up
```

For a complete reset (including database):

```bash
# Stop and remove volumes
docker compose down -v

# Rebuild and start
docker compose up --build
```