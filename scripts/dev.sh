#!/bin/bash

echo "Starting nn_UI Development Environment..."
echo "=========================================="

echo "[1/2] Starting Backend on port 8765..."
cd backend
python -m uvicorn app.main:app --reload --port 8765 &
BACKEND_PID=$!
cd ..

sleep 2

echo "[2/2] Starting Frontend on port 3000..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "=========================================="
echo "nn_UI is running!"
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:8765"
echo "=========================================="
echo ""
echo "Press Ctrl+C to stop all services..."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT

wait