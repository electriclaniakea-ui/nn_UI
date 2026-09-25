# 可视化神经网络构建器nn_UI · 项目规格书

> 版本：v1.0
> 用途：项目开发基线，所有 Agent 编码以本文档为准
> 结构：决策基线 → 技术选型 → 完整文件树 → 模块详解

---

## 一、项目概述

一个可视化构建神经网络的桌面级 Web 应用。用户拖拽节点搭建网络，实时生成 PyTorch 代码，并可直接在界面中训练模型。

**核心目标**：用户画出的图 → 生成的代码 → 实际训练的模型，三者完全一致。

**技术核心**：一套 `LayerSpec` 语义模型作为唯一真相源，驱动 UI 渲染、形状推断、代码生成、模型执行四条链路。

---

## 二、决策基线（DECISIONS）

### 2.1 产品范围

| 项 | 决策 |
|----|------|
| 网络类型 | MLP + CNN + RNN + Transformer（全支持） |
| 目标用户 | 教学演示 + 研究者快速原型 |
| 自定义 Python 层 | 不支持（不做沙箱） |
| 子图封装 | 支持（用户框选打包成 Block，可复用） |

### 2.2 图的语义

| 项 | 决策 |
|----|------|
| 输入节点 | 显式 `Input` 节点，用户填 shape |
| 输出节点 | 自动取「无出边节点」，允许多输出（返回 tuple） |
| 分支支持 | 支持 |
| 残差连接 | 支持 |
| 动态维度 | 统一用 `-1` |
| 多输入层 | 支持 Concat 和 Add |
| 作用域 | 节点带 `scope` 字段（`main` / `block_xxx`），输出只在 `main` 推导 |
| Block 内层数上限 | 10 层；不支持嵌套 Block |

### 2.3 代码生成

| 项 | 决策 |
|----|------|
| 文件组织 | `model.py` + `train.py` |
| 变量命名 | 按类型+序号（`conv1`、`fc1`），允许用户改 |
| 分支处理 | 每个节点结果独立命名，不覆盖 |
| 注释 | 带节点溯源注释（`# node n3: Conv2d`） |
| 测试块 | 生成 `__main__` 块，dummy input 跑 forward |
| 模型摘要 | UI 按钮触发，后端沙箱跑 dummy forward，不进生成代码 |

### 2.4 训练功能

| 项 | 决策 |
|----|------|
| 数据集 | ImageFolder + CSV + NPZ + `DatasetAdapter` 接口 |
| 训练配置 | UI 表单 + 每字段推荐数值 |
| LR 调度 | StepLR / CosineAnnealing / ReduceLROnPlateau / OneCycle，下拉 + 形状示意 |
| 早停/checkpoint | 可选，高级选项 |
| 中断恢复 | 可选，高级选项 |
| 多 GPU | 不支持 |
| 训练时改图 | 锁定画布（只读） |
| 推送频率 | epoch 必推 + step 节流（每 10 步或每 0.5 秒） |

### 2.5 状态与同步

| 项 | 决策 |
|----|------|
| 同步策略 | 防抖 300ms，POST `/api/graph` |
| 撤销/重做 | 前端 Zustand 历史栈，最多 50 步；无 UI 按钮，仅 Ctrl+Z / Ctrl+Y |
| 多标签页 | 锁文件机制，第二个标签页弹窗拒绝加载 |
| 后端重启 | 自动恢复（`~/.nnbuilder/autosave.json`） |
| 保存方式 | 可设置：默认自动 + 手动 Ctrl+S |

### 2.6 工程与部署

| 项 | 决策 |
|----|------|
| 分发方式 | 源码运行 + PyInstaller 打包（双轨） |
| 端口 | 固定 8765，UI 可改 |
| 远程访问 | 不支持，只绑 `127.0.0.1` |
| 前端托管 | FastAPI StaticFiles |
| Python 依赖 | uv |
| 前端包管理 | pnpm |

### 2.7 UI 与体验

| 项 | 决策 |
|----|------|
| 主题 | 固定深紫配色，不做明暗切换 |
| 节点配色 | 暂统一，后续 UI 设计阶段再按 category 分色 |
| 画布引擎 | React Flow（@xyflow/react），扑克牌式横向叠放由前端自定义坐标实现，主链相邻节点不渲染 Edge（后端 Edge 保留用于拓扑排序） |
| 导出图 | PNG（React Flow `toPng()`） |
| 国际化 | 不做，只中文 |
| 快捷键 | Ctrl+C / V / Z / S |
| 节点搜索 | 支持 |
| 代码 diff | 不做 |
| 示例项目 | 3 个（MNIST MLP、CIFAR CNN、简单 Transformer） |
| `.nnproj` 版本迁移 | 需要，带 `version` 字段 + 迁移链 |

**深紫主题色值**：

| 变量 | 值 | 用途 |
|------|-----|------|
| `--primary` | `#7C3AED` | 主色（按钮、选中态） |
| `--primary-dark` | `#6D28D9` | 主色悬停 |
| `--primary-light` | `#A78BFA` | 主色浅调（连线、高亮） |
| `--background` | `#0F0F14` | 页面背景 |
| `--surface` | `#1A1A24` | 卡片/面板背景 |
| `--border` | `#2A2A38` | 边框 |
| `--foreground` | `#E8E8F0` | 主文字 |
| `--muted` | `#8888A0` | 次要文字 |
| `--accent` | `#F59E0B` | 警告/高亮 |
| `--error` | `#EF4444` | 错误 |

### 2.8 测试策略

| 项 | 决策 |
|----|------|
| 后端测试 | pytest + httpx |
| 前端测试 | Vitest（单元）+ Playwright（E2E） |
| 覆盖率 | `core/` ≥ 90%，其余 ≥ 60% |
| 代码生成验证 | 必须 `exec()` + forward dummy tensor |
| CI/CD | GitHub Actions |

---

## 三、技术选型总览

### 3.1 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.x | UI 框架 |
| TypeScript | 5.x | 类型安全 |
| Vite | 6.x | 构建工具 + 开发服务器 + 代理 |
| Tailwind CSS | 4.x | 样式系统 |
| shadcn/ui | CLI | 全局 UI 组件 |
| Zustand | 5.x | 状态管理 |
| @xyflow/react | 12.x | 画布引擎（React Flow） |
| React Flow UI | CLI | 节点/边基础组件 |
| Recharts | 2.x | 训练曲线 |
| @monaco-editor/react | 4.x | 代码预览 |
| Lucide React | 最新 | 图标 |
| react-resizable-panels | 2.x | 可拖拽分隔条 |
| react-router-dom | 7.x | 路由（如需要） |
| lodash.debounce | 4.x | 防抖 |

### 3.2 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| Python | 3.10+ | 运行时 |
| FastAPI | 0.115+ | Web 框架 |
| Uvicorn | 0.34+ | ASGI 服务器 |
| Pydantic | 2.x | 数据校验与序列化 |
| PyTorch | 2.x | 训练引擎 |
| torchvision | 2.x | 数据集与 transforms |
| python-multipart | 最新 | 文件上传 |
| websockets | 最新 | WebSocket 支持 |
| multiprocessing | 标准库 | 训练进程隔离 |

### 3.3 工具链

| 工具 | 用途 |
|------|------|
| uv | Python 依赖管理 |
| pnpm | 前端包管理 |
| pytest | 后端测试 |
| Vitest | 前端单元测试 |
| Playwright | 前端 E2E |
| PyInstaller | 打包为 exe |
| GitHub Actions | CI/CD |

### 3.4 UI 借用清单（关键）

| UI 需求 | 借用来源 | 自写量 |
|---------|---------|--------|
| 节点画布 | React Flow | 仅配置封装 |
| 节点外观 | React Flow UI 的 BaseNode | 每层声明参数 |
| 全局 UI 组件 | shadcn/ui CLI | 0 |
| 训练曲线 | Recharts | 数据绑定 |
| 代码编辑器 | Monaco Editor | 包装 |
| 图标 | Lucide Icons | 0 |
| 样式系统 | Tailwind CSS | 主题配置 |

---

## 四、完整文件树

```
nn-builder/
│
├── frontend/                              # React + TypeScript 前端
│   ├── public/
│   │   └── favicon.ico
│   │
│   ├── src/
│   │   ├── app/
│   │   │   ├── App.tsx                    # 根组件，三栏布局
│   │   │   ├── main.tsx                   # ReactDOM 渲染入口
│   │   │   ├── providers.tsx              # ReactFlow/Theme/Toaster Provider
│   │   │   └── router.tsx                 # 路由（如需要）
│   │   │
│   │   ├── components/
│   │   │   └── ui/                        # shadcn/ui 生成
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       ├── input.tsx
│   │   │       ├── select.tsx
│   │   │       ├── switch.tsx
│   │   │       ├── slider.tsx
│   │   │       ├── dialog.tsx
│   │   │       ├── tabs.tsx
│   │   │       ├── tooltip.tsx
│   │   │       ├── toast.tsx
│   │   │       ├── scroll-area.tsx
│   │   │       ├── separator.tsx
│   │   │       └── base-node.tsx          # React Flow UI 生成
│   │   │
│   │   ├── features/
│   │   │   ├── canvas/
│   │   │   │   ├── components/
│   │   │   │   │   ├── FlowCanvas.tsx     # ReactFlow 封装
│   │   │   │   │   ├── NodePalette.tsx    # 左侧层列表
│   │   │   │   │   ├── PropertyPanel.tsx  # 右侧属性编辑
│   │   │   │   │   ├── CodePanel.tsx      # 底部代码预览
│   │   │   │   │   ├── BlockLibrary.tsx   # Block 库面板
│   │   │   │   │   ├── BlockEditor.tsx    # 进入 Block 内部编辑
│   │   │   │   │   └── edges/
│   │   │   │   │       └── CustomEdge.tsx
│   │   │   │   ├── nodes/                 # 自定义节点（每层一个）
│   │   │   │   │   ├── BaseNode.tsx       # 节点基础卡片
│   │   │   │   │   ├── InputNode.tsx
│   │   │   │   │   ├── LinearNode.tsx
│   │   │   │   │   ├── Conv2dNode.tsx
│   │   │   │   │   ├── ReLUNode.tsx
│   │   │   │   │   ├── LeakyReLUNode.tsx
│   │   │   │   │   ├── SigmoidNode.tsx
│   │   │   │   │   ├── TanhNode.tsx
│   │   │   │   │   ├── GELUNode.tsx
│   │   │   │   │   ├── SoftmaxNode.tsx
│   │   │   │   │   ├── BatchNormNode.tsx
│   │   │   │   │   ├── LayerNormNode.tsx
│   │   │   │   │   ├── DropoutNode.tsx
│   │   │   │   │   ├── MaxPool2dNode.tsx
│   │   │   │   │   ├── AvgPool2dNode.tsx
│   │   │   │   │   ├── AdaptiveAvgPool2dNode.tsx
│   │   │   │   │   ├── FlattenNode.tsx
│   │   │   │   │   ├── ReshapeNode.tsx
│   │   │   │   │   ├── ConcatNode.tsx
│   │   │   │   │   ├── AddNode.tsx
│   │   │   │   │   ├── LSTMNode.tsx
│   │   │   │   │   ├── GRUNode.tsx
│   │   │   │   │   ├── EmbeddingNode.tsx
│   │   │   │   │   ├── MultiheadAttentionNode.tsx
│   │   │   │   │   ├── TransformerEncoderNode.tsx
│   │   │   │   │   ├── BlockNode.tsx      # 自定义 Block 折叠节点
│   │   │   │   │   └── index.ts           # nodeTypes 映射
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useGraphSync.ts    # 防抖同步
│   │   │   │   │   ├── useCodeGen.ts      # 触发代码生成
│   │   │   │   │   ├── useNodeValidation.ts
│   │   │   │   │   ├── useUndoRedo.ts     # 历史栈
│   │   │   │   │   └── useShortcuts.ts    # 快捷键
│   │   │   │   └── store/
│   │   │   │       └── canvasStore.ts     # Zustand 主状态
│   │   │   │
│   │   │   ├── training/
│   │   │   │   ├── components/
│   │   │   │   │   ├── TrainingPanel.tsx  # 训练配置 + 启停
│   │   │   │   │   ├── LossChart.tsx      # Recharts 曲线
│   │   │   │   │   ├── LogViewer.tsx      # 日志滚动
│   │   │   │   │   ├── DatasetPicker.tsx  # 数据集选择
│   │   │   │   │   ├── LRSchedulerPicker.tsx  # LR 调度下拉 + 示意
│   │   │   │   │   └── AdvancedOptions.tsx    # 高级选项折叠面板
│   │   │   │   └── hooks/
│   │   │   │       └── useTrainingWs.ts
│   │   │   │
│   │   │   ├── project/
│   │   │   │   └── components/
│   │   │   │       ├── ProjectToolbar.tsx # 保存/加载/导出
│   │   │   │       ├── ProjectDialog.tsx
│   │   │   │       └── ModelSummaryDialog.tsx  # 模型摘要表格
│   │   │   │
│   │   │   └── block/                     # 自定义 Block 功能
│   │   │       ├── components/
│   │   │       │   ├── BlockContextMenu.tsx   # 右键打包
│   │   │       │   └── BlockNameDialog.tsx
│   │   │       └── hooks/
│   │   │           └── useBlockPack.ts
│   │   │
│   │   ├── lib/
│   │   │   ├── api.ts                     # fetch 封装
│   │   │   ├── ws.ts                      # WebSocket 客户端
│   │   │   ├── utils.ts                   # cn()、防抖、格式化
│   │   │   ├── constants.ts               # 常量
│   │   │   └── theme.ts                   # 深紫主题色值
│   │   │
│   │   ├── store/
│   │   │   └── appStore.ts                # 全局状态（主题、当前项目）
│   │   │
│   │   ├── types/
│   │   │   ├── graph.ts                   # 图类型
│   │   │   ├── layer.ts                   # 层 Schema 类型
│   │   │   ├── training.ts                # 训练类型
│   │   │   └── block.ts                   # Block 类型
│   │   │
│   │   ├── styles/
│   │   │   └── globals.css                # Tailwind 指令 + CSS 变量
│   │   │
│   │   └── assets/
│   │       └── logo.svg
│   │
│   ├── .env.local
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── components.json
│
├── backend/                               # Python FastAPI 后端
│   ├── pyproject.toml                     # uv 依赖管理
│   ├── uv.lock
│   ├── .env.example
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                        # FastAPI 入口 + lifespan
│   │   ├── config.py                      # 配置
│   │   ├── dependencies.py                # 依赖注入
│   │   ├── state.py                       # 全局状态
│   │   ├── lockfile.py                    # 标签页锁文件
│   │   ├── autosave.py                    # 自动落盘
│   │   │
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── layers.py                  # GET /api/layers
│   │   │   ├── graph.py                   # GET/POST /api/graph
│   │   │   ├── codegen.py                 # POST /api/codegen
│   │   │   ├── project.py                 # 项目存取
│   │   │   ├── training.py                # 训练启停
│   │   │   ├── system.py                  # 设备/版本
│   │   │   └── model_summary.py           # POST /api/model/summary
│   │   │
│   │   ├── ws/
│   │   │   ├── __init__.py
│   │   │   ├── manager.py                 # 连接管理
│   │   │   └── routes.py                  # /ws 端点
│   │   │
│   │   ├── core/                          # ★ 编译器内核
│   │   │   ├── __init__.py
│   │   │   ├── graph.py                   # Node/Edge/Graph，拓扑排序
│   │   │   ├── validator.py               # 环检测、形状推断、断连
│   │   │   ├── codegen.py                 # 图 → PyTorch 源码
│   │   │   ├── serializer.py              # .nnproj 读写 + 版本迁移
│   │   │   ├── shape.py                   # 形状推断工具
│   │   │   ├── block.py                   # Block 封装与展开
│   │   │   ├── summary.py                 # 模型摘要生成
│   │   │   └── layers/
│   │   │       ├── __init__.py
│   │   │       ├── base.py                # LayerSpec + ParamSpec
│   │   │       ├── registry.py            # 层注册表
│   │   │       ├── input.py               # Input 节点
│   │   │       ├── linear.py
│   │   │       ├── conv.py                # Conv1d/2d/3d
│   │   │       ├── activations.py         # ReLU/LeakyReLU/Sigmoid/Tanh/GELU/Softmax
│   │   │       ├── norm.py                # BatchNorm/LayerNorm/Dropout
│   │   │       ├── pooling.py             # MaxPool/AvgPool/AdaptiveAvgPool
│   │   │       ├── recurrent.py           # LSTM/GRU
│   │   │       ├── attention.py           # MultiheadAttention/TransformerEncoder
│   │   │       ├── embedding.py           # Embedding
│   │   │       ├── shape_ops.py           # Flatten/Reshape/Concat/Add
│   │   │       └── custom.py              # 自定义 Block
│   │   │
│   │   ├── training/
│   │   │   ├── __init__.py
│   │   │   ├── manager.py                 # 主进程侧：启停/监控
│   │   │   ├── worker.py                  # 独立进程训练循环
│   │   │   ├── ipc.py                     # 进程间通信
│   │   │   ├── dataset.py                 # 数据集加载
│   │   │   ├── dataset_adapter.py         # DatasetAdapter 抽象类
│   │   │   ├── callbacks.py               # 进度回调
│   │   │   ├── scheduler.py               # LR 调度器封装
│   │   │   ├── checkpoint.py              # 早停/断点恢复
│   │   │   └── device.py                  # 设备检测
│   │   │
│   │   └── schemas/
│   │       ├── __init__.py
│   │       ├── layer.py                   # LayerSchema/ParamSchema
│   │       ├── graph.py                   # GraphIn/Out
│   │       ├── training.py                # TrainConfig/Status
│   │       ├── project.py                 # ProjectMeta
│   │       └── block.py                   # BlockSchema
│   │
│   ├── tests/
│   │   ├── test_validator.py
│   │   ├── test_codegen.py
│   │   ├── test_serializer.py
│   │   ├── test_block.py
│   │   ├── test_training.py
│   │   └── test_api.py
│   │
│   └── static/                            # 生产：vite build 输出
│       └── (构建产物)
│
├── projects/                              # 用户项目文件
│   ├── example_mnist_mlp.nnproj
│   ├── example_cifar_cnn.nnproj
│   └── example_transformer.nnproj
│
├── scripts/
│   ├── dev.sh                             # 起前后端
│   ├── build.sh                           # 构建 + 打包
│   ├── package.sh                         # PyInstaller 打包
│   └── gen_ts_types.py                    # Pydantic → TS 类型
│
├── docs/
│   ├── DECISIONS.md                       # 决策基线（本文档）
│   ├── PROTOCOL.md                        # 前后端接口契约
│   ├── ARCHITECTURE.md                    # 架构说明
│   └── LAYER_SPEC.md                      # 层定义规范
│
├── .github/
│   └── workflows/
│       └── ci.yml                         # GitHub Actions
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## 五、核心数据流

```
┌─────────────────────────────────────────────────────────────┐
│                        浏览器                                │
│                                                              │
│  NodePalette ──→ FlowCanvas ──→ PropertyPanel               │
│       │              │                │                      │
│       │              ▼                │                      │
│       │      Zustand canvasStore ←────┘                      │
│       │              │                                       │
│       │              ├──→ useGraphSync（防抖 300ms）         │
│       │              │                                       │
│       └──→ BlockLibrary（复用 Block）                        │
│                                                              │
│  CodePanel ←── useCodeGen ←── WS: code_update               │
│  TrainingPanel ←── useTrainingWs ←── WS: train_progress     │
└──────────────────────────┬───────────────────────────────────┘
                           │ HTTP + WebSocket
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI 后端                              │
│                                                              │
│  api/graph ──→ core/validator ──→ 返回校验结果              │
│  api/codegen ──→ core/codegen ──→ 返回源码                  │
│  api/model_summary ──→ core/summary ──→ 返回形状表          │
│                                                              │
│  training/manager ──→ IPC Queue ──→ training/worker（独立进程）│
│         ▲                                     │              │
│         │                                     ▼              │
│         └──────── ws/manager ←──── 进度回调 ──┘              │
│                                                              │
│  core/layers/registry ←── 唯一真相源                         │
│         │                                                    │
│         ├──→ /api/layers（前端动态渲染）                     │
│         ├──→ validator（形状推断）                           │
│         ├──→ codegen（代码生成）                             │
│         └──→ worker（模型构建）★ 单一执行路径                 │
└─────────────────────────────────────────────────────────────┘
```

**核心约束**：
- 后端是真相源，前端只持有副本
- `LayerSpec` 唯一真相，四处使用
- `worker.py` 必须调用 `codegen.build_model_from_graph()`，模型和代码同源
- 训练在独立进程，崩溃不拖垮主进程和 UI

---

## 六、模块详解

### 6.1 前端

#### `src/app/`

| 文件 | 功能 | 技术要点 |
|------|------|---------|
| `App.tsx` | 三栏布局 | `react-resizable-panels` 实现可拖拽分隔条 |
| `main.tsx` | 渲染入口 | `ReactDOM.createRoot` + `<StrictMode>` |
| `providers.tsx` | 全局 Provider | `ReactFlowProvider` + `ThemeProvider` + `Toaster` |
| `router.tsx` | 路由 | `react-router-dom` v7（如单页可省略） |

#### `src/features/canvas/`

| 文件 | 功能 | 技术要点 |
|------|------|---------|
| `FlowCanvas.tsx` | 画布主体 | `<ReactFlow>` + `<Background>` + `<Controls>` + `<MiniMap>`；`nodeTypes` 定义在组件外；`useReactFlow<CustomNode, CustomEdge>()` 泛型 |
| `NodePalette.tsx` | 左侧层列表 | 从 `/api/layers` 拉 Schema；`ScrollArea` + 折叠分组；HTML5 Drag and Drop；顶部搜索框 |
| `PropertyPanel.tsx` | 右侧属性 | 根据 `ParamSpec.type` 动态渲染控件：`int/float` → Input，`bool` → Switch，`select` → Select，`tuple` → 多个 Input；`Card` + `Separator` 分区 |
| `CodePanel.tsx` | 代码预览 | Monaco Editor：`language="python"`、`theme="vs-dark"`、`readOnly`、`minimap.enabled=false`、`automaticLayout=true` |
| `BlockLibrary.tsx` | Block 库 | 从 `~/.nnbuilder/blocks/` 读取，可拖出复用 |
| `BlockEditor.tsx` | Block 内部编辑 | 进入 Block 内部子画布 |
| `CustomEdge.tsx` | 自定义边 | `<BaseEdge>` + `getBezierPath`；悬停加粗变色 |
| `BaseNode.tsx` | 节点基础卡片 | 基于 React Flow UI 的 BaseNode，用 Tailwind 定制 |
| 各层节点 | 每个层一个组件 | `memo` 包裹；`<Handle>` 定义端口；节点组件定义在 `nodeTypes` 对象外部 |
| `index.ts` | nodeTypes 映射 | 所有节点类型统一导出 |
| `useGraphSync.ts` | 图同步 | 监听 Store 变化，`lodash.debounce` 300ms 后 POST `/api/graph` |
| `useCodeGen.ts` | 代码生成 | 图变化稳定后触发，或等 WS 推送 |
| `useNodeValidation.ts` | 错误高亮 | 订阅 Store 的 `validationErrors`，映射到节点 `data._error` |
| `useUndoRedo.ts` | 撤销重做 | Zustand 历史栈，最多 50 步 |
| `useShortcuts.ts` | 快捷键 | Ctrl+C/V/Z/S |
| `canvasStore.ts` | 主状态 | Zustand + `subscribeWithSelector` + `immer` |

#### `src/features/training/`

| 文件 | 功能 | 技术要点 |
|------|------|---------|
| `TrainingPanel.tsx` | 训练配置 | 表单 + 每字段推荐值 |
| `LossChart.tsx` | Loss/Acc 曲线 | Recharts `<LineChart>` + 双 Y 轴；WS 收到 `train_progress` 时 append |
| `LogViewer.tsx` | 日志窗口 | `ScrollArea` + 自动滚动；级别着色 |
| `DatasetPicker.tsx` | 数据集选择 | ImageFolder / CSV / NPZ / 自定义 |
| `LRSchedulerPicker.tsx` | LR 调度 | 下拉 + 40×20 SVG 迷你曲线示意 |
| `AdvancedOptions.tsx` | 高级选项 | 折叠面板：早停、checkpoint、断点恢复 |
| `useTrainingWs.ts` | 训练 WS | 自动重连（指数退避）；心跳；消息分发 |

#### `src/features/project/`

| 文件 | 功能 |
|------|------|
| `ProjectToolbar.tsx` | 保存/加载/导出 PNG |
| `ProjectDialog.tsx` | 项目列表弹窗 |
| `ModelSummaryDialog.tsx` | 模型摘要表格（后端返回每层形状） |

#### `src/features/block/`

| 文件 | 功能 |
|------|------|
| `BlockContextMenu.tsx` | 右键菜单：打包为 Block |
| `BlockNameDialog.tsx` | 输入 Block 名称 |
| `useBlockPack.ts` | 框选节点 → 打包逻辑 |

#### `src/lib/`

| 文件 | 功能 | 技术要点 |
|------|------|---------|
| `api.ts` | fetch 封装 | 统一 base URL；`AbortController` 超时；错误归一化为 `{ ok, data, error }` |
| `ws.ts` | WebSocket 客户端 | 自动重连、心跳、消息队列 |
| `utils.ts` | 工具 | `cn()`（clsx + tailwind-merge）、防抖、格式化 |
| `constants.ts` | 常量 | 端口、默认参数、颜色映射 |
| `theme.ts` | 主题色值 | 深紫配色常量 |

### 6.2 后端

#### `app/` 根

| 文件 | 功能 | 技术要点 |
|------|------|---------|
| `main.py` | FastAPI 入口 | `lifespan` 初始化 `TrainingManager`；静态托管放最后；路由挂载 |
| `config.py` | 配置 | 端口 8765、路径、设备选择 |
| `dependencies.py` | 依赖注入 | 获取当前图、训练管理器 |
| `state.py` | 全局状态 | 当前图、当前项目路径 |
| `lockfile.py` | 标签页锁 | `.lock` 文件存 UUID + 时间戳；10 秒过期 |
| `autosave.py` | 自动落盘 | 每 5 秒或图变更时写 `~/.nnbuilder/autosave.json` |

#### `app/api/`

| 文件 | 路由 | 技术要点 |
|------|------|---------|
| `layers.py` | `GET /api/layers` | 从 registry 取所有 LayerSpec，`model_dump()` 返回 |
| `graph.py` | `GET/POST /api/graph` | POST 调 `validator.validate()`，返回 errors + output_shape |
| `codegen.py` | `POST /api/codegen` | 调 `codegen.generate()` |
| `project.py` | 项目存取 | `serializer` 读写 `.nnproj` |
| `training.py` | 训练启停 | 调 `TrainingManager.start()` / `.stop()` |
| `system.py` | 系统信息 | `torch.cuda.is_available()`、设备名、显存 |
| `model_summary.py` | `POST /api/model/summary` | 沙箱跑 dummy forward，返回每层形状 |

#### `app/ws/`

| 文件 | 功能 |
|------|------|
| `manager.py` | `ConnectionManager`：连接管理、广播、断线清理 |
| `routes.py` | `/ws` 端点；处理客户端消息（ping 等） |

#### `app/core/` ★ 编译器内核

| 文件 | 功能 | 技术要点 |
|------|------|---------|
| `graph.py` | 图数据结构 | `Node(id, type, params, scope)`、`Edge`、`Graph`；Kahn 拓扑排序 + 环检测 |
| `validator.py` | 校验器 | 环检测 → 拓扑排序 → 形状传播 → 收集错误；错误类型：`cycle`/`shape`/`disconnected`/`missing_input` |
| `codegen.py` | 代码生成 | 拓扑排序 → 生成 `__init__` 层声明 → 生成 `forward` 调用 → 组装 `model.py` + `train.py`；**不依赖 PyTorch，纯字符串拼接** |
| `serializer.py` | 序列化 | `.nnproj` JSON 读写；`version` 字段 + 迁移链 |
| `shape.py` | 形状工具 | `conv_output_size`、`pool_output_size`、`flatten_shape`、`broadcast_shapes`；必须和 PyTorch 行为一致 |
| `block.py` | Block 封装 | 子图打包、展开、聚合输入输出端口 |
| `summary.py` | 模型摘要 | 构造模型 + dummy input + forward hook 采集每层形状 |
| `layers/base.py` | 层基类 | `LayerSpec` 抽象基类 + `ParamSpec`；定义 `infer_shape`、`codegen_init`、`codegen_forward` |
| `layers/registry.py` | 注册表 | `register()` / `all()` / `get(type)` |
| `layers/*.py` | 各层实现 | 每层一个文件，模块加载时注册 |

**`LayerSpec` 基类核心接口**：

```python
class ParamSpec(BaseModel):
    name: str
    type: Literal["int", "float", "bool", "str", "select", "tuple"]
    default: Any
    min: float | None = None
    max: float | None = None
    options: list[str] | None = None
    label: str | None = None

class LayerSpec(BaseModel):
    type: str
    display: str
    category: str
    color: str
    inputs: list[str] = ["in"]
    outputs: list[str] = ["out"]
    params: list[ParamSpec]

    def infer_shape(self, input_shapes: list[tuple]) -> tuple: ...
    def codegen_init(self, node_id: str, params: dict) -> str: ...
    def codegen_forward(self, node_id: str, inputs: list[str]) -> str: ...
```

#### `app/training/`

| 文件 | 功能 | 技术要点 |
|------|------|---------|
| `manager.py` | 主进程侧 | `multiprocessing.Process` 启动 worker；`asyncio.to_thread(queue.get)` 读进度；`ws_manager.broadcast()` 推送；崩溃检测 |
| `worker.py` | 子进程训练 | **必须调 `codegen.build_model_from_graph()`**；标准训练循环；进度 `queue.put()`；异常捕获后 raise |
| `ipc.py` | 进程通信 | 封装 `multiprocessing.Queue`；语义化方法 `send_progress()` / `send_log()` / `send_finished()` / `send_error()` |
| `dataset.py` | 数据集加载 | 内置 MNIST/CIFAR/FashionMNIST（torchvision） |
| `dataset_adapter.py` | 自定义适配器 | `DatasetAdapter` 抽象类，用户实现 `__getitem__` |
| `callbacks.py` | 进度回调 | 每 N step 或每 epoch 结束上报 |
| `scheduler.py` | LR 调度 | StepLR / CosineAnnealing / ReduceLROnPlateau / OneCycle 封装 |
| `checkpoint.py` | 早停/断点 | 保存最佳模型 + optimizer + scheduler 状态 |
| `device.py` | 设备检测 | CUDA / MPS / CPU |

#### `app/schemas/`

| 文件 | 模型 |
|------|------|
| `layer.py` | `ParamSpec`、`LayerSchema` |
| `graph.py` | `NodeIn`、`EdgeIn`、`GraphIn`、`GraphOut`、`ValidationErrorOut` |
| `training.py` | `TrainConfig`、`TrainStatus` |
| `project.py` | `ProjectMeta` |
| `block.py` | `BlockSchema` |

### 6.3 脚本与文档

| 文件 | 功能 |
|------|------|
| `scripts/dev.sh` | 同时起前后端（开发模式） |
| `scripts/build.sh` | 构建前端 + 打包后端 |
| `scripts/package.sh` | PyInstaller 打包为 exe |
| `scripts/gen_ts_types.py` | 从 Pydantic 生成 TS 类型 |
| `docs/PROTOCOL.md` | 前后端接口契约 |
| `docs/ARCHITECTURE.md` | 架构说明 |
| `docs/LAYER_SPEC.md` | 层定义规范 |

---

## 七、WebSocket 消息协议

| type | 字段 | 说明 |
|------|------|------|
| `train_progress` | `epoch`, `step`, `loss`, `acc` | 训练进度（epoch 必推 + step 节流） |
| `train_log` | `level`, `line` | 日志 |
| `train_finished` | `exit_code` | 训练结束 |
| `train_error` | `message` | 训练异常 |
| `code_update` | `code` | 代码更新推送 |
| `graph_invalid` | `errors[]` | 图校验失败 |

---

## 八、开发顺序建议

| 阶段 | 模块 | 依赖 |
|------|------|------|
| 1 | `core/layers/base.py` + `registry.py` + `linear.py` + `input.py` | 无 |
| 2 | `core/graph.py` + `shape.py` + `validator.py` | 1 |
| 3 | `core/codegen.py` | 1, 2 |
| 4 | `schemas/` | 1, 2 |
| 5 | `api/` + `main.py` | 3, 4 |
| 6 | 前端骨架 + `FlowCanvas` + `InputNode` + `LinearNode` | 5 |
| 7 | 其余节点 + `PropertyPanel` + `CodePanel` | 6 |
| 8 | `training/` + `ws/` | 3, 5 |
| 9 | 前端训练面板 + `useTrainingWs` | 8 |
| 10 | `core/block.py` + Block 相关 UI | 3, 7 |
| 11 | Transformer 层（形状推断最难） | 2, 7 |
| 12 | 高级选项（早停、断点恢复、LR 调度） | 8 |
| 13 | 测试 + 打包 + 打磨 | 全部 |

---

## 九、代码量预估

| 部分 | 行数 |
|------|------|
| 前端自写 | 3,000～3,500 |
| 前端自动生成（shadcn/ui） | ~800 |
| 后端自写 | 5,500～6,500 |
| 脚本/文档 | ~800 |
| **合计（自写）** | **约 9,300～10,800** |

---

## 十、关键约定

| 约定 | 说明 |
|------|------|
| 后端是真相源 | 前端只持有图副本，改动即同步 |
| LayerSpec 唯一真相 | 一份定义驱动 UI、校验、代码生成、训练 |
| 单一执行路径 | `worker.py` 调 `codegen.build_model_from_graph()` |
| 进程隔离 | 训练在独立进程，崩溃不拖垮主进程 |
| 开发用代理 | Vite 代理 `/api` 和 `/ws`，无跨域 |
| 生产用静态托管 | 前端 build 产物拷入 `backend/static/`，单端口同源 |
| 形状推断纯 Python | `validator.py` 和 `shape.py` 不 import torch |
| 代码生成验证 | 测试必须 `exec()` 生成代码 + forward dummy tensor |

---

## 十一、待实现功能（后续升级）

以下功能已在决策中预留，当前版本不实现，留待后续迭代：

| 功能 | 说明 |
|------|------|
| 代码预览面板 | 实时显示生成的 PyTorch 代码（model.py / train.py），Monaco Editor 只读展示 |
| 模型摘要弹窗 | 后端沙箱跑 dummy forward，返回每层输入输出形状表 |

---

**本文档为项目开发唯一基线。所有 Agent 编码以本文档为准，如有异议先改文档再改代码。**