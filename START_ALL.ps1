# Zenith RAG + MLR-Hack - Quick Start Script
# This script starts all three services needed for the integrated application

Write-Host "🚀 Starting Zenith RAG + MLR-Hack Integration..." -ForegroundColor Green
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = $scriptPath

# Function to start a new terminal window
function Start-Service {
    param(
        [string]$Name,
        [string]$Path,
        [string]$Command,
        [string]$Color
    )
    
    Write-Host "▶️  Starting $Name..." -ForegroundColor $Color
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Path'; Write-Host '$Name' -ForegroundColor $Color; $Command"
    Start-Sleep -Seconds 2
}

# Check if zenith-backend venv exists
$venvPath = Join-Path $projectRoot "zenith-backend\venv"
if (-not (Test-Path $venvPath)) {
    Write-Host "⚠️  Virtual environment not found!" -ForegroundColor Yellow
    Write-Host "Creating virtual environment for Zenith backend..." -ForegroundColor Yellow
    cd (Join-Path $projectRoot "zenith-backend")
    python -m venv venv
    Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
    & ".\venv\Scripts\Activate.ps1"
    pip install -r requirements.txt
    cd $projectRoot
    Write-Host "✅ Virtual environment created!" -ForegroundColor Green
    Write-Host ""
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  STARTING SERVICES" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Start Zenith RAG Backend (Python FastAPI)
Start-Service `
    -Name "Zenith RAG Backend (Port 8000)" `
    -Path (Join-Path $projectRoot "zenith-backend") `
    -Command "& '.\venv\Scripts\Activate.ps1'; uvicorn app.main:app --reload --port 8000" `
    -Color "Magenta"

# Start MLR-Hack Node Backend
Start-Service `
    -Name "MLR-Hack Backend (Port 5000)" `
    -Path (Join-Path $projectRoot "backend") `
    -Command "npm start" `
    -Color "Blue"

# Start Frontend
Start-Service `
    -Name "Frontend (Port 5173)" `
    -Path (Join-Path $projectRoot "frontend") `
    -Command "npm run dev" `
    -Color "Green"

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  ✅ ALL SERVICES STARTED!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Service URLs:" -ForegroundColor White
Write-Host "  • Frontend:           http://localhost:5173" -ForegroundColor White
Write-Host "  • Zenith RAG API:     http://localhost:8000/docs" -ForegroundColor Magenta
Write-Host "  • MLR-Hack API:       http://localhost:5000" -ForegroundColor Blue
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Yellow
Write-Host "  • Wait 10-15 seconds for all services to fully start" -ForegroundColor Gray
Write-Host "  • Check individual terminal windows for any errors" -ForegroundColor Gray
Write-Host "  • Press Ctrl+C in each window to stop services" -ForegroundColor Gray
Write-Host ""
Write-Host "🧪 Test the chatbot:" -ForegroundColor Green
Write-Host "  1. Open http://localhost:5173 in your browser" -ForegroundColor Gray
Write-Host "  2. Click the chatbot button (bottom-right)" -ForegroundColor Gray
Write-Host "  3. Ask: `"What companies visited for placements?`"" -ForegroundColor Gray
Write-Host ""

# Wait for user input
Write-Host "Press any key to exit this window..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
