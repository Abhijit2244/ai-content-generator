#!/usr/bin/env bash
# ==============================================================================
# AI Content Generator - Start Script (Bash)
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================================="
echo " Starting AI Content Generator System..."
echo "=========================================================="

echo "[1/3] Starting AI Service on port 8000..."
(cd "$ROOT_DIR/ai-service" && python -m uvicorn app.main:app --reload --port 8000) &
AI_PID=$!

echo "[2/3] Starting Backend API on port 5000..."
(cd "$ROOT_DIR/backend" && npm run dev) &
BACKEND_PID=$!

echo "[3/3] Starting Frontend on port 5173..."
(cd "$ROOT_DIR/frontend" && npm run dev) &
FRONTEND_PID=$!

# Save PIDs to .pids file for clean stopping
echo "$AI_PID" > "$ROOT_DIR/.pids"
echo "$BACKEND_PID" >> "$ROOT_DIR/.pids"
echo "$FRONTEND_PID" >> "$ROOT_DIR/.pids"

sleep 2

echo ""
echo "=========================================================="
echo " All services running in background!"
echo "=========================================================="
echo "  * Frontend UI:    http://localhost:5173"
echo "  * Backend API:    http://localhost:5000"
echo "  * AI Swagger API: http://localhost:8000/docs"
echo ""
echo "To stop services, run: ./stop.sh"
