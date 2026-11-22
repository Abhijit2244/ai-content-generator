#!/usr/bin/env bash
# ==============================================================================
# AI Content Generator - Stop Script (Bash)
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================================="
echo " Stopping AI Content Generator System..."
echo "=========================================================="

if [ -f "$ROOT_DIR/.pids" ]; then
    while read -r pid; do
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            echo "Terminating PID $pid..."
            kill "$pid" 2>/dev/null
        fi
    done < "$ROOT_DIR/.pids"
    rm -f "$ROOT_DIR/.pids"
fi

# Also free ports 8000, 5000, 5173
for port in 8000 5000 5173; do
    pid=$(lsof -ti :$port 2>/dev/null)
    if [ -n "$pid" ]; then
        echo "Killing remaining process on port $port (PID: $pid)..."
        kill -9 $pid 2>/dev/null
    fi
done

echo ""
echo "=========================================================="
echo " All services stopped."
echo "=========================================================="
