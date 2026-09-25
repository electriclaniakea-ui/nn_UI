@echo off
chcp 65001 >nul 2>&1
echo ============================================
echo   nn_UI - 完整安装脚本
echo ============================================
echo.

cd /d "%~dp0"

REM 检查环境
echo [检查环境]
echo ----------------------------------------

python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Python！
    echo.
    echo 请先安装 Python 3.10 或更高版本：
    echo https://www.python.org/downloads/
    echo.
    echo 安装时务必勾选 "Add Python to PATH"
    pause
    exit /b 1
) else (
    for /f "tokens=2 delims= " %%v in ('python --version 2^>^&1') do set PYTHON_VERSION=%%v
    echo [✓] Python 版本: %PYTHON_VERSION%
)

node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Node.js！
    echo.
    echo 请先安装 Node.js 18.0 或更高版本：
    echo https://nodejs.org/
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%v in ('node --version') do set NODE_VERSION=%%v
    echo [✓] Node.js 版本: %NODE_VERSION%
)

npm --version >nul 2>&1
if errorlevel 1 (
    echo [错误] npm 不可用！
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%v in ('npm --version') do set NPM_VERSION=%%v
    echo [✓] npm 版本: %NPM_VERSION%
)

echo.
echo [1/4] 创建 Python 虚拟环境...
echo ----------------------------------------
cd backend

if not exist "venv" (
    echo 正在创建虚拟环境...
    python -m venv venv
    if errorlevel 1 (
        echo [错误] 创建虚拟环境失败！
        pause
        exit /b 1
    )
    echo [✓] 虚拟环境创建成功
) else (
    echo [✓] 虚拟环境已存在
)

echo.
echo [2/4] 安装后端依赖...
echo ----------------------------------------
call venv\Scripts\activate.bat

echo 正在升级 pip...
pip install --upgrade pip -q

echo.
echo 正在安装后端依赖（根据 pyproject.toml）...
echo 这可能需要几分钟时间...
pip install -e . -q
if errorlevel 1 (
    echo [错误] 后端依赖安装失败！
    echo.
    echo 可能的解决方案：
    echo 1. 检查网络连接
    echo 2. 尝试更换 pip 镜像源
    echo 3. 手动运行: cd backend ^&^& pip install -e .
    call deactivate
    cd ..
    pause
    exit /b 1
)

echo [✓] 后端依赖安装成功

echo.
echo 是否安装 PyTorch（用于真实训练功能）？
echo 如果不需要训练功能，可以选择跳过
echo.
set /p INSTALL_TORCH="安装 PyTorch? (y/n, 默认: y): "
if /i "%INSTALL_TORCH%"=="" set INSTALL_TORCH=y

if /i "%INSTALL_TORCH%"=="y" (
    echo.
    echo 正在安装 PyTorch（CPU 版本）...
    echo 这可能需要较长时间（5-15 分钟）...
    pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu -q
    if errorlevel 1 (
        echo [警告] PyTorch 安装失败，可以使用模拟训练模式
    ) else (
        echo [✓] PyTorch 安装成功
    )
) else (
    echo [跳过] PyTorch 安装已跳过（将使用模拟训练模式）
)

call deactivate
cd ..

echo.
echo [3/4] 安装前端依赖...
echo ----------------------------------------
cd frontend

if not exist "node_modules" (
    echo 正在安装 npm 依赖...
    echo 这可能需要 2-5 分钟...
    call npm install
    if errorlevel 1 (
        echo [错误] 前端依赖安装失败！
        echo.
        echo 可能的解决方案：
        echo 1. 检查网络连接
        echo 2. 尝试使用淘宝镜像：npm config set registry https://registry.npmmirror.com
        echo 3. 清除缓存：npm cache clean --force
        cd ..
        pause
        exit /b 1
    )
    echo [✓] 前端依赖安装成功
) else (
    echo [✓] 前端依赖已存在，跳过安装
)

cd ..

echo.
echo [4/4] 验证安装...
echo ----------------------------------------

cd backend
call venv\Scripts\activate.bat

python -c "import fastapi; print('[✓] FastAPI:', fastapi.__version__)" 2>nul || echo "[!] FastAPI 未正确安装"
python -c "import uvicorn; print('[✓] Uvicorn 已安装')" 2>nul || echo "[!] Uvicorn 未正确安装"
python -c "import pydantic; print('[✓] Pydantic 已安装')" 2>nul || echo "[!] Pydantic 未正确安装"

python -c "import torch; print('[✓] PyTorch:', torch.__version__)" 2>nul || echo "[!] PyTorch 未安装（将使用模拟模式）"

call deactivate
cd ..

if exist "frontend\node_modules" (
    echo [✓] 前端 node_modules 存在
) else (
    echo [!] 前端依赖可能未完整安装
)

echo.
echo ============================================
echo   ✅ 安装完成！
echo ============================================
echo.
echo 下一步操作：
echo.
echo 1. 启动应用：
echo    双击运行 start.bat
echo    或在命令行执行：start.bat
echo.
echo 2. 手动启动（高级用户）：
echo    终端 1 - 后端：
echo      cd backend
echo      venv\Scripts\activate
echo      python -m app.main
echo.
echo    终端 2 - 前端：
echo      cd frontend
echo      npm run dev
echo.
echo 访问地址：
echo   前端界面: http://localhost:5173
echo   后端 API: http://localhost:8765
echo   API 文档: http://localhost:8765/docs
echo.
pause