@echo off
echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Starting FastAPI backend server...
uvicorn app.main:app --reload --port 8000

pause
