@echo off
echo Restarting Professor AI Helper...
echo.

echo Stopping containers...
docker-compose down

echo.
echo Starting containers...
docker-compose up -d

echo.
echo Application restarted!
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:8000/api/v1
echo API Documentation: http://localhost:8000/docs
echo.
echo Press any key to exit...
pause > nul