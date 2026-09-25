@echo off
echo Installing nn_UI Dependencies...
echo ================================

echo [1/2] Installing Frontend dependencies...
cd frontend
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo [2/2] Backend is optional (for training features)
echo        To install backend, run: cd backend && pip install fastapi uvicorn torch torchvision
echo.

echo ================================
echo Installation complete!
echo.
echo To start development:
echo   Windows: scripts\dev.bat
echo   Linux/Mac: ./scripts/dev.sh
echo.
pause