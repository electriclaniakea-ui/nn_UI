# nn_UI 完整安装与使用指南

## 📋 目录
- [系统要求](#系统要求)
- [快速开始（推荐）](#快速开始推荐)
- [手动安装](#手动安装)
- [常见问题](#常见问题)
- [开发指南](#开发指南)

---

## 系统要求

### 必需软件
- **Python**: 3.10 或更高版本
  - 下载地址: https://www.python.org/downloads/
  - 安装时务必勾选 "Add Python to PATH"
  
- **Node.js**: 18.0 或更高版本
  - 下载地址: https://nodejs.org/
  - 推荐使用 LTS (长期支持) 版本
  
- **npm**: 通常随 Node.js 自动安装
  - 验证: `npm --version`

### 可选软件
- **Git**: 用于版本控制（可选）
- **VS Code**: 推荐的代码编辑器
- **PyTorch**: 如需真实训练功能（可选）

---

## 快速开始（推荐）

### Windows 用户

#### 方法一：使用一键启动脚本

1. **打开命令提示符或 PowerShell**（以管理员身份运行）

2. **进入项目目录**
   ```cmd
   cd d:\hws\programming\nn_UI
   ```

3. **运行安装脚本**
   ```cmd
   install.bat
   ```
   这将自动完成所有安装：
   - ✅ 检查 Python 和 Node.js 环境
   - ✅ 创建 Python 虚拟环境
   - ✅ 安装后端依赖（FastAPI, Uvicorn 等）
   - ✅ 可选安装 PyTorch（用于真实训练）
   - ✅ 安装前端 npm 依赖
   - ✅ 验证安装结果

4. **启动应用**
   ```cmd
   start.bat
   ```
   
   应用将在浏览器中自动打开：
   - 前端: http://localhost:5173
   - 后端 API: http://localhost:8765

> **注意**: 如果 `install.bat` 安装失败，可以尝试单独运行：
> - 仅后端：参考下方"手动安装"的步骤 1
> - 仅前端：`install_frontend.bat`

#### 方法二：分步安装

**步骤 1: 安装后端**
```cmd
cd backend
python -m venv venv
venv\Scripts\activate
pip install fastapi uvicorn pydantic pydantic-settings torch torchvision
```

**步骤 2: 安装前端**（新终端）
```cmd
cd frontend
npm install
```

**步骤 3: 启动后端**（终端 1）
```cmd
cd backend
venv\Scripts\activate
uvicorn app.main:app --host 127.0.0.1 --port 8765 --reload --app-dir app
```

**步骤 4: 启动前端**（终端 2）
```cmd
cd frontend
npm run dev
```

### Linux/Mac 用户

#### 使用 Shell 脚本

1. **赋予执行权限**
   ```bash
   chmod +x scripts/install.sh scripts/dev.sh
   ```

2. **运行安装脚本**
   ```bash
   ./scripts/install.sh
   ```

3. **启动应用**
   ```bash
   ./scripts/dev.sh
   ```

#### 手动安装

**步骤 1: 安装后端**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn pydantic pydantic-settings torch torchvision
```

**步骤 2: 安装前端**（新终端）
```bash
cd frontend
npm install
```

**步骤 3: 启动后端**（终端 1）
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8765 --reload --app-dir app
```

**步骤 4: 启动前端**（终端 2）
```bash
cd frontend
npm run dev
```

---

## 手动安装详解

### 1. 环境检查

在开始之前，请确认已安装所需软件：

**检查 Python:**
```bash
python --version
# 应该显示: Python 3.10.x 或更高版本
```

**检查 Node.js:**
```bash
node --version
# 应该显示: v18.x.x 或更高版本

npm --version
# 应该显示: 9.x.x 或更高版本
```

如果未安装，请先下载并安装。

### 2. 后端安装

**创建虚拟环境：**
```bash
cd backend
python -m venv venv
```

**激活虚拟环境：**

Windows:
```bash
venv\Scripts\activate
```

Linux/Mac:
```bash
source venv/bin/activate
```

**安装依赖：**
```bash
pip install --upgrade pip
pip install fastapi uvicorn[standard] pydantic pydantic-settings torch torchvision python-multipart websockets
```

> **注意:** PyTorch 安装可能需要较长时间。如果不需要真实训练功能，可以跳过 `torch` 和 `torchvision`。

**验证安装：**
```bash
python -c "import fastapi; print('FastAPI:', fastapi.__version__)"
python -c "import uvicorn; print('Uvicorn installed')"
```

### 3. 前端安装

**进入前端目录：**
```bash
cd frontend
```

**安装 npm 依赖：**
```bash
npm install
```

这可能需要几分钟时间，取决于网络速度。

**验证安装：**
```bash
npm run build
# 如果成功，说明所有依赖正确安装
```

### 4. 配置环境变量

**后端配置** (`backend/.env`):
```env
PORT=8765
HOST=127.0.0.1
DEBUG=True
PROJECT_DIR=~/.nnbuilder/projects
BLOCKS_DIR=~/.nnbuilder/blocks
AUTOSAVE_PATH=~/.nnbuilder/autosave.json
```

**前端配置** (`frontend/.env.local`):
```env
VITE_API_BASE_URL=http://localhost:8765
VITE_WS_URL=ws://localhost:8765/ws
```

---

## 常见问题

### ❌ 问题 1: "Python is not recognized"

**原因:** Python 未添加到系统 PATH

**解决方案:**
1. 重新运行 Python 安装程序
2. 勾选 "Add Python to PATH"
3. 重启命令提示符

或手动添加:
- Windows: 设置 → 系统 → 高级系统设置 → 环境变量 → 编辑 Path → 添加 Python 路径

### ❌ 问题 2: "npm : 无法加载文件"

**原因:** PowerShell 执行策略限制

**解决方案:**
```powershell
Set-ExecutionPolicy -Scope Process -Bypass
```

或使用 CMD 代替 PowerShell。

### ❌ 问题 3: 端口被占用

**错误信息:** `Address already in use`

**解决方案:**

查找占用端口的进程:
```bash
# Windows
netstat -ano | findstr :8765
taskkill /PID <进程ID> /F

# Linux/Mac
lsof -i :8765
kill -9 <进程ID>
```

或修改端口:
- 后端: 编辑 `backend/app/config.py` 中的 `PORT`
- 前端: 编辑 `frontend/vite.config.ts` 中的 `port`

### ❌ 问题 4: pip 安装超时

**解决方案:**
```bash
pip install --default-timeout=100 <包名>
```

或使用国内镜像源:
```bash
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple <包名>
```

### ❌ 问题 5: npm install 失败

**清除缓存重试:**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### ❌ 问题 6: 前端无法连接后端

**检查:**
1. 后端是否正在运行
2. 访问 http://localhost:8765/docs 是否能看到 Swagger 文档
3. 检查浏览器控制台是否有 CORS 错误
4. 确认 `frontend/vite.config.ts` 中的代理配置正确

### ❌ 问题 7: 虚拟环境激活失败

**Windows:**
```bash
# 如果遇到执行策略问题
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

**Linux/Mac:**
```bash
# 如果权限不足
chmod +x venv/bin/activate
```

---

## 开发指南

### 项目结构速览

详细结构请查看 [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)

### 运行测试

**后端测试:**
```bash
cd tests
python -m pytest test_*.py -v
```

**或单独运行:**
```bash
python test_graph.py
python test_validator.py
python test_codegen.py
```

### 代码质量检查

**前端 lint:**
```bash
cd frontend
npm run lint
```

**TypeScript 类型检查:**
```bash
cd frontend
npx tsc --noEmit
```

### 构建生产版本

**构建前端:**
```bash
cd frontend
npm run build
```

产物在 `frontend/dist/` 目录，可部署到任何静态文件服务器。

### 开发模式热更新

- **前端修改**: Vite 支持热模块替换（HMR），保存后自动刷新
- **后端修改**: Uvicorn 的 `--reload` 参数会自动重启服务器

### 调试技巧

**1. 查看后端日志:**
启动后端的终端会显示所有请求日志。

**2. 浏览器开发者工具:**
- F12 打开控制台
- Network 标签查看 API 请求
- Console 标签查看错误信息

**3. Swagger UI:**
访问 http://localhost:8765/docs 可以直接测试 API。

**4. React DevTools:**
安装浏览器扩展以便调试 React 组件。

---

## 性能优化建议

### 开发环境
1. 关闭不必要的浏览器扩展
2. 使用轻量级编辑器（如 VS Code）
3. 增加 Node.js 内存限制:
   ```bash
   set NODE_OPTIONS=--max-old-space-size=4096
   ```

### 生产部署
1. 使用 Gunicorn + Uvicorn 部署后端
2. 前端使用 Nginx 托管静态文件
3. 启用 gzip 压缩
4. 配置 CDN 加速静态资源

---

## 下一步

✅ **完成安装后，你可以:**

1. 📖 阅读 [UI 设计文档](nn_UI%20·%20UI%20设计文档%20v1.md) 了解界面规范
2. 📖 阅读 [项目规格书](nn_UI项目规格书.md) 了解技术细节
3. 🎮 查看 `examples/` 目录中的示例项目
4. 🧪 运行测试确保一切正常
5. 🚀 开始使用 nn_UI 构建你的神经网络！

---

## 获取帮助

如果遇到问题:

1. 查看本指南的[常见问题](#常见问题)部分
2. 检查 `backend.log` 文件获取详细错误信息
3. 确保所有依赖版本符合要求
4. 尝试删除 `node_modules` 和 `venv` 后重新安装

---

**祝您使用愉快！** 🎉

如有任何问题或建议，欢迎反馈！

---

*最后更新: 2026-09-20*
*版本: 1.0.0*