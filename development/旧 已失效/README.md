# nn_UI - Visual Neural Network Builder

可视化神经网络构建器，基于 UI 设计文档 v1.0 和项目规格书 v1.0 开发。

## 技术栈

### 前端
- React 19 + TypeScript
- Vite 6
- Tailwind CSS 4
- Zustand 5 (状态管理)
- @xyflow/react (画布引擎)
- Lucide React (图标)

### 后端
- Python 3.10+
- FastAPI
- PyTorch (可选，用于形状推断)

## 项目结构

```
nn_UI/
├── frontend/              # React 前端
│   ├── src/
│   │   ├── app/          # 主应用组件
│   │   ├── components/   # 通用组件（顶栏、底栏）
│   │   ├── features/
│   │   │   └── canvas/   # 画布功能
│   │   │       ├── components/  # 画布组件
│   │   │       ├── nodes/      # 节点组件
│   │   │       └── store/      # Zustand 状态
│   │   ├── types/        # 类型定义
│   │   └── styles/       # 全局样式
│   └── package.json
├── backend/               # Python 后端
│   └── app/
│       └── main.py       # FastAPI 入口
├── scripts/              # 启动脚本
│   ├── dev.sh           # Linux/Mac
│   └── dev.bat          # Windows
└── docs/                 # 设计文档
```

## 快速开始

### 前置要求
- Node.js 18+
- Python 3.10+ (可选，仅后端需要)
- npm 或 pnpm

### 安装依赖

```bash
# 安装前端依赖
cd frontend
npm install
cd ..

# 安装后端依赖（可选）
cd backend
pip install -r requirements.txt  # 或使用 uv
cd ..
```

### 启动开发服务器

**Windows:**
```bash
scripts\dev.bat
```

**Linux/Mac:**
```bash
chmod +x scripts/dev.sh
./scripts/dev.sh
```

或手动启动：

```bash
# 终端 1: 启动后端
cd backend
python -m uvicorn app.main:app --reload --port 8765

# 终端 2: 启动前端
cd frontend
npm run dev
```

访问 http://localhost:3000 查看应用。

## 功能特性

### 已实现 (P0)
- ✅ 米色系主题配色
- ✅ 菱形节点横向扑克牌式叠放
- ✅ Input/Output 三角形节点
- ✅ 加号按钮添加层
- ✅ 添加层弹窗（搜索 + 分类）
- ✅ 右侧参数面板（点击节点滑入）
- ✅ 顶栏（Logo + 设置/保存/导出/训练按钮）
- ✅ 底栏（状态显示 + 缩略图）
- ✅ 节点悬停动画
- ✅ 错误状态显示
- ✅ 快捷键支持 (Ctrl+S, Ctrl+Z, Esc)

### 支持的层类型
- **全连接**: Linear
- **卷积**: Conv2d
- **激活函数**: ReLU, LeakyReLU, Sigmoid, Tanh, GELU, Softmax
- **归一化**: BatchNorm, LayerNorm
- **正则化**: Dropout
- **池化**: MaxPool2d, AvgPool2d, AdaptiveAvgPool2d
- **变形**: Flatten, Reshape
- **特殊层**: Concat, Add
- **循环**: LSTM, GRU
- **注意力**: MultiheadAttention, TransformerEncoder
- **嵌入**: Embedding
- **IO**: Input, Output

## API 接口

### GET /api/layers
获取所有可用层的定义和参数。

### POST /api/graph
验证网络图结构，返回形状推断结果和错误信息。

### GET /api/system
获取系统信息。

## 设计文档

- [UI 设计文档 v1.0](./nn_UI%20·%20UI%20设计文档%20v1.md) - 前端视觉和交互规范
- [项目规格书](./nn_UI项目规格书.md) - 技术决策和架构设计

## 开发计划

- [x] P0: 基础骨架（画布、节点、参数面板）
- [ ] P1: Block 功能、分支连接
- [ ] P2: 训练界面、代码生成
- [ ] P3: 动画打磨、完整快捷键

## License

MIT