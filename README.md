# Professor AI Helper

A web application for managing educational documents and AI-powered content generation. Includes backend (FastAPI), frontend (React), and PostgreSQL database. Fully containerized for easy deployment.

## Project Structure
```
professor-ai-helper/
├── backend/
├── frontend/
├── docker-compose.yml
├── .env.example
```

## Quick Start (Docker)

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd professor-ai-helper
   ```

2. **Create .env file in the root directory** (example below):
   ```env
   POSTGRES_DB=professordb
   POSTGRES_USER=professor
   POSTGRES_PASSWORD=strongpassword123
   DATABASE_URL=postgresql://professor:strongpassword123@db:5432/professordb
   SECRET_KEY=a_very_secret_key_that_should_be_long_and_random
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   GOOGLE_API_KEY=AIzaSyCRcplZEHU6TrcwNSboq-1hyRti-FpPxYc
   ```

3. **Build and run all services**
   ```bash
   docker compose up --build
   ```

4. **Open in browser:**
   - Frontend: http://localhost:5173
   - API docs: http://localhost:8000/docs

## Docker Images
- Backend: `bobur0/professor-ai-backend:latest`
- Frontend: `bobur0/professor-ai-frontend:latest`

## Troubleshooting
- Ensure Docker is running
- Check that `.env` file is present and filled
- For database errors, try removing Docker volumes and rebuilding
- For API errors, check API key and backend logs

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