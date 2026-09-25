@echo off
echo Starting nn_UI Development Environment...
echo ==========================================

echo [1/2] Starting Backend on port 8765...
start /B cd backend && python -m uvicorn app.main:app --reload --port 8765
timeout /t 2 /nobreak >nul

echo [2/2] Starting Frontend on port 3000...
cd frontend
start /B npm run dev
cd ..

echo.
echo ==========================================
echo nn_UI is running!
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8765
echo ==========================================
echo.
echo Press any key to stop all services...
pause >nul

taskkill /F /IM node.exe 2>nul
taskkill /F /IM python.exe 2>nul