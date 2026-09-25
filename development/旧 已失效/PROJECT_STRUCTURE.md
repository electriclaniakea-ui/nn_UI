# nn_UI 项目文件清单

## 完整项目结构

```
nn_UI/
│
├── backend/                          # Python 后端服务
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                   # FastAPI 应用入口
│   │   ├── config.py                 # 配置管理（pydantic-settings）
│   │   ├── dependencies.py           # 依赖注入
│   │   ├── state.py                  # 全局状态管理
│   │   ├── lockfile.py               # 项目锁文件管理
│   │   └── autosave.py               # 自动保存功能
│   │
│   ├── api/                          # API 路由层
│   │   ├── __init__.py
│   │   ├── layers.py                 # 层类型 API
│   │   ├── graph.py                  # 图操作 API
│   │   ├── codegen.py                # 代码生成 API
│   │   ├── project.py                # 项目管理 API
│   │   ├── training.py               # 训练控制 API
│   │   ├── system.py                 # 系统信息 API
│   │   └── model_summary.py          # 模型摘要 API
│   │
│   ├── core/                         # 核心业务逻辑
│   │   ├── __init__.py
│   │   ├── graph.py                  # 图数据结构与算法
│   │   ├── validator.py              # 图验证器
│   │   ├── shape.py                  # 形状推断引擎
│   │   ├── codegen.py                # PyTorch 代码生成器
│   │   ├── serializer.py             # 项目序列化/反序列化
│   │   ├── block.py                  # Block 管理系统
│   │   ├── summary.py                # 模型摘要生成
│   │   │
│   │   └── layers/                   # 层定义与注册
│   │       ├── __init__.py
│   │       ├── base.py               # 层基类与参数规范
│   │       ├── registry.py           # 层注册表
│   │       ├── linear.py             # Linear 层
│   │       ├── conv2d.py             # Conv2d 层
│   │       ├── activations.py        # 激活函数层（ReLU, Sigmoid, Tanh, GELU, Softmax, LeakyReLU）
│   │       ├── normalization.py      # 归一化层（BatchNorm, LayerNorm）
│   │       ├── pooling.py            # 池化层（MaxPool2d, AvgPool2d, AdaptiveAvgPool2d）
│   │       ├── dropout.py            # Dropout 层
│   │       ├── reshape.py            # 形状变换层（Flatten, Reshape）
│   │       ├── rnn.py                # 循环神经网络（LSTM, GRU）
│   │       ├── transformer.py        # Transformer 组件（Embedding, MultiheadAttention, TransformerEncoder）
│   │       └── special.py            # 特殊层（Input, Output, Concat, Add）
│   │
│   ├── training/                     # 训练系统
│   │   ├── __init__.py
│   │   ├── manager.py                # 训练管理器
│   │   ├── scheduler.py              # 学习率调度器
│   │   ├── dataset.py                # 数据集管理
│   │   └── optimizer.py              # 优化器管理
│   │
│   ├── pyproject.toml                # Python 项目配置与依赖
│   ├── .env.example                  # 环境变量示例
│   └── venv/                         # Python 虚拟环境（gitignore）
│
├── frontend/                         # React 前端应用
│   ├── public/
│   │   └── vite.svg
│   │
│   ├── src/
│   │   ├── app/
│   │   │   ├── main.tsx              # React 入口
│   │   │   ├── App.tsx               # 主应用组件
│   │   │   └── index.css
│   │   │
│   │   ├── components/               # 通用 UI 组件库
│   │   │   ├── TopBar.tsx            # 顶栏组件
│   │   │   ├── BottomBar.tsx         # 底栏组件
│   │   │   └── ui/                   # shadcn/ui 风格组件
│   │   │       ├── button.tsx
│   │   │       ├── input.tsx
│   │   │       ├── select.tsx
│   │   │       ├── switch.tsx
│   │   │       ├── card.tsx
│   │   │       ├── dialog.tsx
│   │   │       ├── tabs.tsx
│   │   │       ├── tooltip.tsx
│   │   │       ├── scroll-area.tsx
│   │   │       ├── separator.tsx
│   │   │       ├── toast.tsx
│   │   │       └── slider.tsx
│   │   │
│   │   ├── features/                 # 功能模块
│   │   │   ├── canvas/               # 画布模块
│   │   │   │   ├── store/
│   │   │   │   │   └── canvasStore.ts    # Zustand 状态管理
│   │   │   │   │
│   │   │   │   ├── components/
│   │   │   │   │   ├── FlowCanvas.tsx    # 主画布（React Flow）
│   │   │   │   │   ├── AddLayerDialog.tsx # 添加层弹窗
│   │   │   │   │   └── PropertyPanel.tsx  # 参数面板
│   │   │   │   │
│   │   │   │   ├── nodes/            # 节点组件
│   │   │   │   │   ├── index.ts         # 节点导出
│   │   │   │   │   ├── BaseNode.tsx     # 基础节点
│   │   │   │   │   ├── InputNode.tsx    # 输入节点
│   │   │   │   │   ├── LinearNode.tsx   # Linear 节点
│   │   │   │   │   ├── Conv2dNode.tsx   # Conv2d 节点
│   │   │   │   │   ├── ReLUNode.tsx     # ReLU 节点
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
│   │   │   │   │   ├── LSTMLayer.tsx
│   │   │   │   │   ├── GRULayer.tsx
│   │   │   │   │   ├── EmbeddingNode.tsx
│   │   │   │   │   ├── MultiheadAttentionNode.tsx
│   │   │   │   │   ├── TransformerEncoderNode.tsx
│   │   │   │   │   ├── AddNode.tsx
│   │   │   │   │   ├── ConcatNode.tsx
│   │   │   │   │   └── BlockNode.tsx
│   │   │   │   │
│   │   │   │   └── hooks/            # 自定义 Hooks
│   │   │   │       ├── useGraphSync.ts    # 图同步
│   │   │   │       ├── useCodeGen.ts      # 代码生成
│   │   │   │       ├── useNodeValidation.ts # 节点验证
│   │   │   │       ├── useUndoRedo.ts     # 撤销/重做
│   │   │   │       └── useShortcuts.ts    # 快捷键
│   │   │   │
│   │   │   ├── training/            # 训练模块
│   │   │   │   ├── components/
│   │   │   │   │   ├── TrainingPanel.tsx    # 训练面板
│   │   │   │   │   ├── LossChart.tsx        # 损失曲线图
│   │   │   │   │   ├── LogViewer.tsx        # 日志查看器
│   │   │   │   │   ├── DatasetPicker.tsx    # 数据集选择
│   │   │   │   │   ├── LRSchedulerPicker.tsx # LR 调度选择
│   │   │   │   │   └── AdvancedOptions.tsx  # 高级选项
│   │   │   │   └── hooks/
│   │   │   │       └── useTrainingWs.ts     # WebSocket 训练通信
│   │   │   │
│   │   │   ├── project/             # 项目管理模块
│   │   │   │   └── components/
│   │   │   │       ├── ProjectToolbar.tsx      # 项目工具栏
│   │   │   │       ├── ProjectDialog.tsx       # 项目列表对话框
│   │   │   │       └── ModelSummaryDialog.tsx  # 模型摘要对话框
│   │   │   │
│   │   │   └── block/               # Block 模块
│   │   │       ├── components/
│   │   │       │   ├── BlockContextMenu.tsx   # 右键菜单
│   │   │       │   └── BlockNameDialog.tsx    # 命名对话框
│   │   │       └── hooks/
│   │   │           └── useBlockPack.ts         # 打包逻辑
│   │   │
│   │   ├── lib/                      # 工具库
│   │   │   ├── utils.ts             # 工具函数（cn, debounce 等）
│   │   │   ├── api.ts               # API 客户端
│   │   │   ├── constants.ts         # 常量定义
│   │   │   ├── theme.ts             # 主题配置
│   │   │   └── ws.ts                # WebSocket 客户端
│   │   │
│   │   ├── types/                    # TypeScript 类型定义
│   │   │   ├── graph.ts             # 图相关类型
│   │   │   ├── layer.ts             # 层相关类型
│   │   │   ├── training.ts          # 训练相关类型
│   │   │   └── block.ts             # Block 相关类型
│   │   │
│   │   └── styles/
│   │       └── globals.css          # 全局样式（Tailwind + 自定义 CSS 变量）
│   │
│   ├── .env.local                    # 前端环境变量
│   ├── tailwind.config.js           # Tailwind CSS 配置
│   ├── tsconfig.json                # TypeScript 配置
│   ├── vite.config.ts               # Vite 构建配置
│   ├── package.json                 # Node.js 依赖
│   ├── tsconfig.node.json           # Node.js TypeScript 配置
│   └── components.json              # shadcn/ui 配置
│
├── examples/                         # 示例项目
│   ├── simple_mlp.json              # MLP 示例
│   ├── cnn_cifar10.json             # CNN 示例
│   └── residual_block.json          # 残差连接示例
│
├── tests/                            # 测试文件
│   ├── __init__.py
│   ├── test_graph.py                # 图测试
│   ├── test_validator.py            # 验证器测试
│   └── test_codegen.py              # 代码生成测试
│
├── scripts/                          # 辅助脚本
│   ├── dev.bat                      # Windows 开发脚本
│   └── dev.sh                       # Linux/Mac 开发脚本
│
├── start.bat                         # 一键启动脚本（Windows）
├── install.bat                       # 完整安装脚本（前后端 + PyTorch）
├── install_frontend.bat              # 仅前端安装脚本
├── QUICKSTART.md                     # 快速开始指南
├── README.md                         # 项目说明文档
├── nn_UI · UI 设计文档 v1.md         # UI 设计规范
├── nn_UI项目规格书.md                 # 技术规格书
├── .gitignore                        # Git 忽略规则
└── PROJECT_STRUCTURE.md              # 本文件 - 项目结构说明
```

## 文件统计

- **后端 Python 文件**: 约 50 个
- **前端 TypeScript/React 文件**: 约 70 个
- **配置文件**: 约 15 个
- **示例项目**: 3 个
- **测试文件**: 3 个
- **总计**: 约 140+ 文件

## 核心功能模块

### 1. 后端核心 (backend/app/core/)
- ✅ 图数据结构与拓扑排序
- ✅ 图验证（环路检测、形状推断）
- ✅ PyTorch 代码生成
- ✅ 22 种神经网络层支持
- ✅ 项目序列化/反序列化
- ✅ Block 管理系统
- ✅ 模型摘要生成

### 2. 训练系统 (backend/app/training/)
- ✅ 训练管理器（异步执行）
- ✅ 学习率调度器（4 种）
- ✅ 数据集支持（MNIST, CIFAR10/100, ImageNet）
- ✅ 优化器管理（SGD, Adam, AdamW, RMSprop）

### 3. API 接口 (backend/app/api/)
- ✅ 层类型查询 API
- ✅ 图操作 API
- ✅ 代码生成 API
- ✅ 项目管理 API
- ✅ 训练控制 API
- ✅ 系统信息 API
- ✅ 模型摘要 API

### 4. 前端画布 (frontend/src/features/canvas/)
- ✅ React Flow 集成
- ✅ 25 种节点可视化
- ✅ 菱形节点设计
- ✅ 扑克牌式横向叠放布局
- ✅ 参数面板
- ✅ 添加层弹窗
- ✅ 快捷键支持

### 5. 前端训练界面 (frontend/src/features/training/)
- ✅ 训练配置面板
- ✅ 损失曲线图（Canvas 绘制）
- ✅ 实时日志查看器
- ✅ 数据集选择器
- ✅ LR 调度可视化
- ✅ 高级选项（早停、断点恢复）

### 6. 前端项目管理 (frontend/src/features/project/)
- ✅ 保存/加载项目
- ✅ 导出 PNG（预留接口）
- ✅ 项目列表浏览
- ✅ 模型摘要查看

### 7. Block 系统 (frontend/src/features/block/)
- ✅ 右键菜单打包
- ✅ Block 命名对话框
- ✅ 打包状态管理

## 技术栈总结

**前端:**
- React 19 + TypeScript
- Vite 6（构建工具）
- Tailwind CSS 4（样式框架）
- Zustand 5（状态管理）
- @xyflow/react（画布引擎）
- Lucide React（图标库）

**后端:**
- Python 3.10+
- FastAPI（Web 框架）
- PyTorch（深度学习框架，可选）
- Pydantic（数据验证）
- Uvicorn（ASGI 服务器）

## 开发完成度

| 模块 | 完成度 | 说明 |
|------|--------|------|
| 后端核心 | 100% | 所有核心功能已实现 |
| API 接口 | 100% | 所有 RESTful API 已实现 |
| 训练系统 | 90% | 模拟训练已完成，真实训练需 PyTorch 环境 |
| 前端 UI | 95% | 主要界面已完成，部分细节可优化 |
| 画布功能 | 100% | 节点、连线、交互全部实现 |
| 测试用例 | 60% | 基础测试已编写，需补充更多场景 |
| 文档 | 90% | 主要文档已完成 |

## 下一步计划

1. **完善测试**: 补充更多单元测试和集成测试
2. **性能优化**: 大规模图的渲染优化
3. **真实训练**: 集成实际 PyTorch 训练流程
4. **代码预览**: 实现 Monaco Editor 显示生成的代码
5. **导出功能**: 完善 PNG 导出和模型导出
6. **国际化**: 支持多语言界面

---

**最后更新**: 2026-09-20
**版本**: v1.0.0