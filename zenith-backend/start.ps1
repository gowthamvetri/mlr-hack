# Start MLRIT Backend Server

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " MLRIT Campus Assistant - Backend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to backend directory
Set-Location -Path $PSScriptRoot

# Check if venv exists
if (!(Test-Path "venv")) {
    Write-Host "Virtual environment not found!" -ForegroundColor Red
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    & ".\venv\Scripts\Activate.ps1"
    pip install -r requirements.txt
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Green
& ".\venv\Scripts\Activate.ps1"

# Check if .env exists
if (!(Test-Path ".env")) {
    Write-Host "WARNING: .env file not found!" -ForegroundColor Yellow
    Write-Host "Copying from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host ""
    Write-Host "IMPORTANT: Edit .env file with your credentials!" -ForegroundColor Red
    Write-Host "- Add your OPENAI_API_KEY" -ForegroundColor Yellow
    Write-Host "- Verify MongoDB and Pinecone credentials" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter after you've updated .env file"
}

# Start server
Write-Host ""
Write-Host "Starting FastAPI backend server..." -ForegroundColor Green
Write-Host "Server will be available at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "API docs at: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press CTRL+C to stop the server" -ForegroundColor Yellow
Write-Host ""

uvicorn app.main:app --reload --port 8000
