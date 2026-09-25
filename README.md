# nn_UI - Visual Neural Network Builder

可视化神经网络构建工具，通过拖拽方式快速构建和训练深度学习模型。

## 功能特性

- 可视化神经网络构建：拖拽式节点编辑器
- 多种层类型支持：Linear、Conv2d、RNN、Transformer 等
- 实时训练监控：损失曲线、准确率可视化
- 数据集管理：支持 ImageFolder、CSV、NumPy 格式
- 模型导出：支持导出为 Python 代码或 JSON 配置
- 项目保存：自动保存和手动保存项目

## 技术栈

### 前端
- React 19 + TypeScript
- Vite 构建工具
- Tailwind CSS 样式
- Monaco Editor 代码编辑器
- Recharts 图表库

### 后端
- Python FastAPI
- PyTorch 深度学习框架
- WebSocket 实时通信

## 项目结构

```
nn_UI/
├── frontend/          # React + TypeScript 前端
│   ├── src/
│   │   ├── app/           # 主应用组件
│   │   ├── features/      # 功能模块
│   │   │   ├── canvas/    # 画布编辑器
│   │   │   ├── training/  # 训练管理
│   │   │   ├── project/   # 项目管理
│   │   │   └── block/     # 模块管理
│   │   ├── components/    # 通用组件
│   │   └── lib/           # 工具库
│   ├── public/            # 静态资源
│   └── package.json
├── backend/           # Python FastAPI 后端
│   ├── app/
│   │   ├── api/           # API 路由
│   │   ├── core/          # 核心逻辑
│   │   │   ├── layers/    # 神经网络层
│   │   │   ├── graph.py   # 计算图
│   │   │   └── codegen.py # 代码生成
│   │   └── training/      # 训练管理
│   └── pyproject.toml
├── install.bat        # 完整安装脚本（前后端依赖一键安装）
├── start.bat          # 一键启动脚本
└── README.md
```

## 快速开始

### 环境要求

- Node.js 18+
- Python 3.10+
- npm 或 yarn

### 方式一：使用脚本（推荐 Windows 用户）

#### 1. 安装依赖

双击运行 `install.bat`，或在命令行执行：

```bash
install.bat
```

此脚本会自动：
- 检查 Python 和 Node.js 环境
- 创建 Python 虚拟环境
- 安装后端依赖（FastAPI、Uvicorn、PyTorch 等）
- 安装前端依赖（npm install）

#### 2. 启动应用

双击运行 `start.bat`，或在命令行执行：

```bash
start.bat
```

此脚本会自动：
- 启动后端服务（http://localhost:8765）
- 启动前端开发服务器（http://localhost:5173）

### 方式二：手动启动（适合所有平台）

#### 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 配置环境变量（可选）
cp .env.example .env.local
# 编辑 .env.local 按需修改配置

# 启动开发服务器
npm run dev
```

前端服务默认运行在 http://localhost:5173

#### 后端启动

```bash
cd backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 安装依赖
pip install -e .

# 配置环境变量（可选）
cp .env.example .env
# 编辑 .env 按需修改配置

# 启动服务
python -m app.main
```

后端服务默认运行在 http://localhost:8765

## 环境变量

### 前端 (.env.local)

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| VITE_API_BASE_URL | 后端 API 地址 | http://localhost:8765 |
| VITE_WS_URL | WebSocket 地址 | ws://localhost:8765/ws |

### 后端 (.env)

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| PORT | 服务端口 | 8765 |
| HOST | 绑定地址 | 127.0.0.1 |
| DEBUG | 调试模式 | true |
| AUTO_SAVE_INTERVAL | 自动保存间隔(秒) | 30 |

## 使用说明

1. 启动前后端服务
2. 打开浏览器访问 http://localhost:5173
3. 在画布上拖拽添加神经网络层
4. 连接层节点构建网络结构
5. 配置训练参数并开始训练
6. 查看训练过程和结果

## 数据集格式

### ImageFolder
```
dataset/
├── train/
│   ├── class_a/
│   │   ├── img1.jpg
│   │   └── img2.jpg
│   └── class_b/
│       ├── img1.jpg
│       └── img2.jpg
└── val/
    ├── class_a/
    └── class_b/
```

### CSV
```csv
image_path,label
path/to/image1.jpg,0
path/to/image2.jpg,1
```

### NumPy
```python
# data.npz
{
    'x_train': ...,  # 训练数据
    'y_train': ...,  # 训练标签
    'x_val': ...,    # 验证数据（可选）
    'y_val': ...     # 验证标签（可选）
}
```

## 开发

### 前端开发

```bash
cd frontend
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run lint     # 代码检查
```

### 后端开发

```bash
cd backend
python -m app.main           # 启动服务
python -m pytest             # 运行测试
```

## 许可证

MIT License