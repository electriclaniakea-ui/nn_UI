# nn_UI 脚本文件清单

## ✅ 实际存在的启动/安装脚本

### 根目录脚本（可直接双击运行）

| 脚本名 | 功能 | 使用场景 |
|--------|------|----------|
| **`install.bat`** | ⭐ **完整一键安装** | 首次使用，自动安装所有依赖 |
| **`install_frontend.bat`** | 仅安装前端依赖 | 后端已装好，只需前端 |
| **`start.bat`** | 一键启动应用 | 安装完成后使用 |

### scripts 目录脚本

| 脚本名 | 功能 | 使用场景 |
|--------|------|----------|
| `scripts/dev.bat` | Windows 开发模式启动 | 开发者使用 |
| `scripts/dev.sh` | Linux/Mac 开发模式启动 | Mac/Linux 用户 |
| `scripts/install.bat` | ⚠️ **旧版安装脚本**（仅前端） | **不推荐使用** |

---

## 🚀 推荐使用流程

### 第一次使用（全新安装）

```bash
# 步骤 1: 完整安装
install.bat

# 步骤 2: 启动应用
start.bat
```

### 日常使用（已安装过）

```bash
# 直接启动
start.bat
```

### 仅更新前端依赖

```bash
install_frontend.bat
```

---

## 📝 各脚本详细说明

### 1. install.bat （⭐ 推荐）

**位置**: 项目根目录  
**功能**: 一键完成所有安装
- ✅ 检查 Python 3.10+ 环境
- ✅ 检查 Node.js 18+ 环境
- ✅ 创建 Python 虚拟环境 (backend/venv)
- ✅ 安装后端依赖 (FastAPI, Uvicorn, Pydantic 等)
- ✅ 可选安装 PyTorch（用于真实训练）
- ✅ 安装前端依赖 (npm install)
- ✅ 验证安装结果

**运行方式**:
```cmd
# 双击文件，或在命令行执行：
cd d:\hws\programming\nn_UI
install.bat
```

**预计时间**: 5-15 分钟（取决于网络速度和是否安装 PyTorch）

**输出示例**:
```
============================================
  nn_UI - 完整安装脚本
============================================

[检查环境]
----------------------------------------
[✓] Python 版本: 3.11.5
[✓] Node.js 版本: v20.10.0
[✓] npm 版本: 10.2.3

[1/4] 创建 Python 虚拟环境...
----------------------------------------
[✓] 虚拟环境创建成功

[2/4] 安装后端依赖...
----------------------------------------
是否安装 PyTorch（用于真实训练功能）？
安装 PyTorch? (y/n, 默认: y): y
正在安装安装 PyTorch（CPU 版本）...
[✓] PyTorch 安装成功

[3/4] 安装前端依赖...
----------------------------------------
正在安装 npm 依赖...
[✓] 前端依赖安装成功

[4/4] 验证安装...
----------------------------------------
[✓] FastAPI: 0.109.0
[✓] Uvicorn 已安装
[✓] PyTorch: 2.1.2+cpu
[✓] 前端 node_modules 存在

============================================
  ✅ 安装完成！
============================================
```

---

### 2. start.bat

**位置**: 项目根目录  
**功能**: 一键启动前后端服务

**运行方式**:
```cmd
start.bat
```

**效果**:
- 自动启动后端服务器 (http://localhost:8765)
- 自动启动前端开发服务器 (http://localhost:5173)
- 打开浏览器访问应用

**前提条件**: 必须先运行 `install.bat` 完成安装

---

### 3. install_frontend.bat

**位置**: 项目根目录  
**功能**: 仅安装/更新前端依赖

**适用场景**:
- 后端已经安装好
- 只需要重装前端依赖
- 更新 node_modules

**运行方式**:
```cmd
install_frontend.bat
```

---

### 4. scripts/dev.bat / scripts/dev.sh

**位置**: `scripts/` 目录  
**功能**: 开发者专用启动脚本

**特点**:
- 显示更详细的日志
- 适合调试
- 不自动打开浏览器

**运行方式**:
```cmd
# Windows
scripts\dev.bat

# Linux/Mac
./scripts/dev.sh
```

---

## ⚠️ 已废弃/不推荐使用的脚本

### scripts/install.bat（旧版）

**状态**: ⚠️ **已废弃，不推荐使用**

**原因**:
- 只安装前端依赖
- 功能已被根目录的 `install.bat` 完全替代
- 可能会在未来版本中删除

**替代方案**: 使用根目录的 `install.bat`

---

## 🔧 手动安装（如果脚本失败）

如果所有脚本都无法运行，可以手动安装：

### 后端安装

```cmd
cd backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# 升级 pip
pip install --upgrade pip

# 安装基础依赖（必需）
pip install fastapi uvicorn[standard] pydantic pydantic-settings python-multipart websockets

# 安装 PyTorch（可选，用于真实训练）
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

# 退出虚拟环境
deactivate
```

### 前端安装

```cmd
cd frontend

# 安装依赖
npm install

# 如果遇到网络问题，使用淘宝镜像
npm config set registry https://registry.npmmirror.com
npm install
```

---

## 🐛 常见问题

### Q1: 运行 install.bat 提示"不是内部或外部命令"

**原因**: 当前目录不对

**解决**:
```cmd
cd /d d:\hws\programming\nn_UI
install.bat
```

或直接双击 `install.bat` 文件

### Q2: Python 环境检查失败

**原因**: Python 未安装或未添加到 PATH

**解决**:
1. 下载 Python: https://www.python.org/downloads/
2. 安装时 **务必勾选 "Add Python to PATH"**
3. 重启命令提示符
4. 再次运行 `install.bat`

### Q3: npm 安装超时

**原因**: 网络问题（国内访问 npmjs.com 较慢）

**解决**:
```cmd
# 使用淘宝镜像
npm config set registry https://registry.npmmirror.com

# 清除缓存
npm cache clean --force

# 重新运行
install_frontend.bat
```

### Q4: PyTorch 安装失败

**原因**: 网络慢或内存不足

**解决**:
1. 选择 **n** 跳过 PyTorch 安装（将使用模拟训练模式）
2. 或手动安装：
   ```cmd
   cd backend
   venv\Scripts\activate
   pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
   ```

### Q5: 虚拟环境激活失败

**Windows 报错**: 执行策略限制

**解决**:
```powershell
# 在 PowerShell 中运行
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

然后重新运行 `install.bat`

---

## 📊 安装验证清单

安装完成后，检查以下内容：

### 后端验证

```cmd
cd backend
venv\Scripts\activate

# 检查 Python 包
python -c "import fastapi; print('FastAPI:', fastapi.__version__)"
python -c "import uvicorn; print('Uvicorn: OK')"
python -c "import pydantic; print('Pydantic: OK')"

# 可选：检查 PyTorch
python -c "import torch; print('PyTorch:', torch.__version__)"

deactivate
```

### 前端验证

```cmd
cd frontend

# 检查 node_modules 是否存在
if exist node_modules (
    echo [✓] 前端依赖已安装
) else (
    echo [!] 缺少 node_modules，请运行 install_frontend.bat
)

# 尝试构建
npm run build
```

### 服务启动测试

```cmd
# 终端 1: 启动后端
cd backend
venv\Scripts\activate
uvicorn app.main:app --host 127.0.0.1 --port 8765 --reload --app-dir app

# 终端 2: 启动前端
cd frontend
npm run dev
```

然后访问：
- http://localhost:5173 （前端）
- http://localhost:8765/docs （后端 API 文档）

---

## 📞 获取帮助

如果仍然遇到问题：

1. **查看日志**: 检查命令行输出的错误信息
2. **阅读文档**:
   - [INSTALLATION.md](INSTALLATION.md) - 详细安装教程
   - [QUICKSTART.md](QUICKSTART.md) - 快速开始指南
3. **检查环境**:
   - Python: `python --version`
   - Node.js: `node --version`
   - npm: `npm --version`
4. **尝试手动安装**: 参考本文档"手动安装"部分

---

## 🎯 最佳实践建议

1. **首次使用**: 一定要运行 `install.bat` 完整安装
2. **日常开发**: 直接运行 `start.bat` 启动
3. **团队协作**: 将 `backend/venv` 和 `frontend/node_modules` 加入 `.gitignore`
4. **版本升级**: 重新运行 `install.bat` 更新依赖
5. **问题排查**: 先看日志，再看文档，最后手动安装

---

*最后更新: 2026-09-20*
*验证状态: ✅ 所有脚本已确认存在*