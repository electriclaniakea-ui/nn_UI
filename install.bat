@echo off
chcp 65001 >nul 2>&1
echo ============================================
echo   nn_UI - Installation Script
echo ============================================
echo.

cd /d "%~dp0"

REM Check environment
echo [Environment Check]
echo ----------------------------------------

python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not detected!
    echo.
    echo Please install Python 3.10 or higher:
    echo https://www.python.org/downloads/
    echo.
    echo Make sure to check "Add Python to PATH"
    pause
    exit /b 1
) else (
    for /f "tokens=2 delims= " %%v in ('python --version 2^>^&1') do set PYTHON_VERSION=%%v
    echo [OK] Python version: %PYTHON_VERSION%
)

node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not detected!
    echo.
    echo Please install Node.js 18.0 or higher:
    echo https://nodejs.org/
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%v in ('node --version') do set NODE_VERSION=%%v
    echo [OK] Node.js version: %NODE_VERSION%
)

npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm not available!
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%v in ('npm --version') do set NPM_VERSION=%%v
    echo [OK] npm version: %NPM_VERSION%
)

echo.
echo [1/4] Creating Python virtual environment...
echo ----------------------------------------
cd backend

if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment!
        pause
        exit /b 1
    )
    echo [OK] Virtual environment created
) else (
    echo [OK] Virtual environment already exists
)

echo.
echo [2/4] Installing backend dependencies...
echo ----------------------------------------
call venv\Scripts\activate.bat

echo Upgrading pip...
pip install --upgrade pip -i https://pypi.tuna.tsinghua.edu.cn/simple -q
if errorlevel 1 (
    echo Failed to use Tsinghua mirror, trying default source...
    pip install --upgrade pip -q
)

echo.
echo Installing backend dependencies (from pyproject.toml)...
echo This may take a few minutes...
echo Current step: Installing project dependencies...
pip install -e . -i https://pypi.tuna.tsinghua.edu.cn/simple -q
if errorlevel 1 (
    echo Failed to use Tsinghua mirror, trying default source...
    pip install -e . -q
)
if errorlevel 1 (
    echo [ERROR] Backend dependencies installation failed!
    echo.
    echo Possible solutions:
    echo 1. Check network connection
    echo 2. Try changing pip mirror source
    echo 3. Manually run: cd backend ^&^& pip install -e .
    call deactivate
    cd ..
    pause
    exit /b 1
)

echo [OK] Backend dependencies installed

echo.
echo Install PyTorch (for real training functionality)?
echo If you don't need training, you can skip this
echo.
set /p INSTALL_TORCH="Install PyTorch? (y/n, default: y): "
if /i "%INSTALL_TORCH%"=="" set INSTALL_TORCH=y

if /i "%INSTALL_TORCH%"=="y" (
    echo.
    echo Installing PyTorch (CPU version)...
    echo This may take 5-15 minutes...
    echo Current step: Downloading PyTorch from Tsinghua mirror...
    pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu -q
    if errorlevel 1 (
        echo Failed to use official source, trying Tsinghua mirror...
        pip install torch torchvision -i https://pypi.tuna.tsinghua.edu.cn/simple -q
    )
    if errorlevel 1 (
        echo [WARNING] PyTorch installation failed, will use simulation mode
    ) else (
        echo [OK] PyTorch installed successfully
    )
) else (
    echo [Skipped] PyTorch installation skipped (will use simulation mode)
)

call deactivate
cd ..

echo.
echo [3/4] Installing frontend dependencies...
echo ----------------------------------------
cd frontend

if not exist "node_modules" (
    echo Installing npm dependencies...
    echo This may take 2-5 minutes...
    echo Current step: Setting npm registry to Taobao mirror...
    call npm config set registry https://registry.npmmirror.com
    
    echo Current step: Installing npm packages...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Frontend dependencies installation failed!
        echo.
        echo Possible solutions:
        echo 1. Check network connection
        echo 2. Clear cache: npm cache clean --force
        echo 3. Try again later
        cd ..
        pause
        exit /b 1
    )
    echo [OK] Frontend dependencies installed
) else (
    echo [OK] node_modules already exists, skipping installation
)

cd ..

echo.
echo [4/4] Verifying installation...
echo ----------------------------------------

cd backend
call venv\Scripts\activate.bat

echo Current step: Checking FastAPI...
python -c "import fastapi; print('[OK] FastAPI:', fastapi.__version__)" 2>nul || echo "[!] FastAPI not properly installed"

echo Current step: Checking Uvicorn...
python -c "import uvicorn; print('[OK] Uvicorn installed')" 2>nul || echo "[!] Uvicorn not properly installed"

echo Current step: Checking Pydantic...
python -c "import pydantic; print('[OK] Pydantic installed')" 2>nul || echo "[!] Pydantic not properly installed"

echo Current step: Checking PyTorch...
python -c "import torch; print('[OK] PyTorch:', torch.__version__)" 2>nul || echo "[!] PyTorch not installed (simulation mode will be used)"

call deactivate
cd ..

if exist "frontend\node_modules" (
    echo [OK] Frontend node_modules exists
) else (
    echo [!] Frontend dependencies may not be fully installed
)

echo.
echo ============================================
echo   Installation Complete!
echo ============================================
echo.
echo Next steps:
echo.
echo 1. Start the application:
echo    Double-click start.bat
echo    Or run in command line: start.bat
echo.
echo 2. Manual start (advanced users):
echo    Terminal 1 - Backend:
echo      cd backend
echo      venv\Scripts\activate
echo      python -m app.main
echo.
echo    Terminal 2 - Frontend:
echo      cd frontend
echo      npm run dev
echo.
echo Access URLs:
echo   Frontend: http://localhost:5173
echo   Backend API: http://localhost:8765
echo   API Docs: http://localhost:8765/docs
echo.
pause