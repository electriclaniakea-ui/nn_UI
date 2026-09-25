@echo off
echo ============================================
echo   nn_UI - Visual Neural Network Builder
echo ============================================
echo.

cd /d "%~dp0"

REM 检查 Python 环境
echo [1/3] 检查 Python 环境...
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] Python 未安装或未添加到 PATH
    echo 请先运行 install.bat 安装依赖
    pause
    exit /b 1
)

REM 检查虚拟环境
echo [2/3] 检查后端环境...
if not exist "backend\venv" (
    echo [错误] 虚拟环境不存在！
    echo 请先运行 install.bat 安装依赖
    pause
    exit /b 1
)

REM 检查前端依赖
echo [3/3] 检查前端环境...
if not exist "frontend\node_modules" (
    echo [错误] 前端依赖未安装！
    echo 请先运行 install.bat 安装依赖
    pause
    exit /b 1
)

echo.
echo [启动后端服务...]
echo 后端将运行在: http://localhost:8765
echo.

start /b cmd /c "cd backend && venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8765 --reload > backend.log 2>&1"

timeout /t 3 /nobreak >nul

echo.
echo [启动前端开发服务器...]
echo 前端将运行在: http://localhost:5173
echo.

cd frontend
start cmd /c "npm run dev"
cd ..

echo.
echo ============================================
echo   ✅ 应用已启动！
echo ============================================
echo.
echo 访问地址：
echo   前端界面: http://localhost:5173
echo   后端 API: http://localhost:8765
echo   API 文档: http://localhost:8765/docs
echo.
echo 按任意键退出此窗口（服务仍在后台运行）
pause >nul