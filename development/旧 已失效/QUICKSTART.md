# nn_UI 快速开始指南

## 系统要求

- **Python**: 3.10 或更高版本
- **Node.js**: 18.0 或更高版本
- **npm**: 9.0 或更高版本（随 Node.js 安装）
- **操作系统**: Windows 10/11, macOS, Linux

## 安装步骤

### 1. 克隆或下载项目

```bash
cd d:\hws\programming\nn_UI
```

### 2. 一键安装（推荐）

**Windows:**
```bash
install.bat
```
此脚本会自动：
- 检查 Python 和 Node.js 环境
- 创建 Python 虚拟环境并安装后端依赖
- 安装前端 npm 依赖
- 可选安装 PyTorch（用于真实训练）

**Linux/Mac:**
```bash
chmod +x scripts/install.sh
./scripts/install.sh
```

### 3. 手动安装（可选）

如果一键安装失败，可以手动分步安装：

**步骤 A: 后端依赖**
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# 基础依赖（必需）
pip install fastapi uvicorn[standard] pydantic pydantic-settings python-multipart websockets

# PyTorch（可选，用于真实训练）
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
```

**步骤 B: 前端依赖**
```bash
cd frontend
npm install
```

## 启动应用

### 方式一：使用启动脚本（推荐）

Windows:
```bash
start.bat
```

Linux/Mac:
```bash
chmod +x scripts/dev.sh
./scripts/dev.sh
```

### 方式二：分别启动后端和前端

**启动后端：**
```bash
cd backend
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows
uvicorn app.main:app --host 127.0.0.1 --port 8765 --reload --app-dir app
```

**启动前端（新终端）：**
```bash
cd frontend
npm run dev
```

## 访问应用

- **前端界面**: http://localhost:5173
- **后端 API**: http://localhost:8765
- **API 文档**: http://localhost:8765/docs (Swagger UI)

## 使用示例

项目包含三个示例网络：

1. **Simple MLP for MNIST** - `examples/simple_mlp.json`
   - 简单的多层感知机，用于手写数字识别
   
2. **CNN for CIFAR-10** - `examples/cnn_cifar10.json`
   - 卷积神经网络，用于图像分类
   
3. **ResNet Block Example** - `examples/residual_block.json`
   - 带残差连接的网络示例

## 项目结构

```
nn_UI/
├── backend/                 # Python 后端
│   ├── app/
│   │   ├── main.py         # FastAPI 应用入口
│   │   ├── api/            # API 路由
│   │   ├── core/           # 核心逻辑
│   │   ├── training/       # 训练系统
│   │   └── config.py       # 配置
│   └── pyproject.toml      # Python 依赖
├── frontend/               # React 前端
│   ├── src/
│   │   ├── app/           # 主应用组件
│   │   ├── components/    # 通用 UI 组件
│   │   ├── features/      # 功能模块
│   │   └── lib/           # 工具函数
│   └── package.json       # Node.js 依赖
├── examples/              # 示例项目
├── tests/                 # 测试文件
├── start.bat             # Windows 启动脚本
└── README.md             # 项目说明
```

## 常见问题

### 端口被占用

如果端口 8765 或 5173 被占用，可以修改配置：

**后端端口**：编辑 `backend/app/config.py`，修改 `PORT` 变量

**前端端口**：编辑 `frontend/vite.config.ts`，修改 port 配置

### npm 权限错误（Linux/Mac）

```bash
sudo npm install -g npm@latest
```

或使用 nvm 管理 Node.js 版本。

### Python 虚拟环境问题

删除并重新创建虚拟环境：

```bash
rm -rf backend/venv
python -m venv backend/venv
```

## 开发模式

### 运行测试

```bash
cd tests
python -m pytest test_*.py -v
```

### 代码格式化

前端：
```bash
cd frontend
npm run lint
```

### 构建生产版本

前端：
```bash
cd frontend
npm run build
```

构建产物在 `frontend/dist/` 目录。

## 技术支持

如遇问题，请检查：
1. Python 和 Node.js 版本是否符合要求
2. 所有依赖是否正确安装
3. 防火墙是否阻止了端口访问
4. 查看日志文件：`backend.log`

## 下一步

- 阅读 [UI 设计文档](nn_UI%20·%20UI%20设计文档%20v1.md) 了解界面设计规范
- 阅读 [项目规格书](nn_UI项目规格书.md) 了解技术细节
- 查看 `examples/` 目录中的示例项目学习用法

祝您使用愉快！🚀