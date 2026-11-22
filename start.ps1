# ==============================================================================
# AI Content Generator - Start Script (PowerShell)
# Launches AI Service (8000), Backend (5000), and Frontend (5173) in separate windows
# ==============================================================================

$RootPath = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Starting AI Content Generator System...                 " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Start AI Service (Python FastAPI)
Write-Host "[1/3] Launching AI Service (FastAPI) on http://localhost:8000..." -ForegroundColor Yellow
$AiServiceDir = Join-Path $RootPath "ai-service"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$AiServiceDir'; Write-Host '--- AI Service (FastAPI on Port 8000) ---' -ForegroundColor Green; python -m uvicorn app.main:app --reload --port 8000"

# 2. Start Backend API (Node.js + Express)
Write-Host "[2/3] Launching Backend API on http://localhost:5000..." -ForegroundColor Yellow
$BackendDir = Join-Path $RootPath "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$BackendDir'; Write-Host '--- Backend API (Express on Port 5000) ---' -ForegroundColor Green; npm run dev"

# 3. Start Frontend (React + Vite)
Write-Host "[3/3] Launching Frontend (React + Vite) on http://localhost:5173..." -ForegroundColor Yellow
$FrontendDir = Join-Path $RootPath "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$FrontendDir'; Write-Host '--- Frontend (React + Vite on Port 5173) ---' -ForegroundColor Green; npm run dev"

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " All 3 services have been launched!                       " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  * Frontend UI:    http://localhost:5173" -ForegroundColor White
Write-Host "  * Backend API:    http://localhost:5000" -ForegroundColor White
Write-Host "  * AI Swagger API: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "To stop all services, run: .\stop.ps1 or double click stop.bat" -ForegroundColor Cyan
