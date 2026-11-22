@echo off
title AI Content Generator - Launcher
echo ==========================================================
echo  Starting AI Content Generator System...
echo ==========================================================

set ROOT_DIR=%~dp0

echo [1/3] Starting AI Service (Python FastAPI) on port 8000...
start "AI Service (FastAPI :8000)" cmd /k "cd /d %ROOT_DIR%ai-service && python -m uvicorn app.main:app --reload --port 8000"

echo [2/3] Starting Backend API (Node.js Express) on port 5000...
start "Backend API (Express :5000)" cmd /k "cd /d %ROOT_DIR%backend && npm run dev"

echo [3/3] Starting Frontend (React Vite) on port 5173...
start "Frontend (Vite :5173)" cmd /k "cd /d %ROOT_DIR%frontend && npm run dev"

timeout /t 2 >nul

echo.
echo ==========================================================
echo  All 3 services have been launched in separate windows!
echo ==========================================================
echo   * Frontend UI:    http://localhost:5173
echo   * Backend API:    http://localhost:5000
echo   * AI Swagger API: http://localhost:8000/docs
echo.
echo To stop all services, run stop.bat or stop.ps1
echo ==========================================================
pause
