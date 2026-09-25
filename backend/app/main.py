from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime
import os
import json

# Import all layer modules to trigger registration
from .core.layers import linear, conv2d, activations, dropout, pooling, normalization, rnn, transformer, special, reshape

# Import API routers
from .api.layers import router as layers_router
from .api.graph import router as graph_router
from .api.codegen import router as codegen_router
from .api.project import router as project_router
from .api.training import router as training_router
from .api.system import router as system_router
from .api.model_summary import router as model_summary_router
from .config import settings

# 示例工程数据
EXAMPLE_PROJECTS = {
    "MNIST MLP": {
        "version": "1.0",
        "name": "MNIST MLP",
        "description": "用于手写数字识别的简单多层感知机",
        "saved_at": "",
        "is_example": True,
        "nodes": [
            {"id": "node-1", "type": "input", "params": {"shape": [1, 28, 28]}},
            {"id": "node-2", "type": "flatten", "params": {}},
            {"id": "node-3", "type": "linear", "params": {"in_features": 784, "out_features": 256, "bias": True}},
            {"id": "node-4", "type": "relu", "params": {}},
            {"id": "node-5", "type": "dropout", "params": {"p": 0.2}},
            {"id": "node-6", "type": "linear", "params": {"in_features": 256, "out_features": 128, "bias": True}},
            {"id": "node-7", "type": "relu", "params": {}},
            {"id": "node-8", "type": "dropout", "params": {"p": 0.2}},
            {"id": "node-9", "type": "linear", "params": {"in_features": 128, "out_features": 10, "bias": True}},
            {"id": "node-10", "type": "output", "params": {"num_classes": 10}}
        ],
        "edges": []
    },
    "CIFAR-10 CNN": {
        "version": "1.0",
        "name": "CIFAR-10 CNN",
        "description": "用于图像分类的卷积神经网络",
        "saved_at": "",
        "is_example": True,
        "nodes": [
            {"id": "node-1", "type": "input", "params": {"shape": [3, 32, 32]}},
            {"id": "node-2", "type": "conv2d", "params": {"in_channels": 3, "out_channels": 32, "kernel_size": 3, "stride": 1, "padding": 1}},
            {"id": "node-3", "type": "batch_norm", "params": {"num_features": 32}},
            {"id": "node-4", "type": "max_pool2d", "params": {"kernel_size": 2, "stride": 2}},
            {"id": "node-5", "type": "conv2d", "params": {"in_channels": 32, "out_channels": 64, "kernel_size": 3, "stride": 1, "padding": 1}},
            {"id": "node-6", "type": "batch_norm", "params": {"num_features": 64}},
            {"id": "node-7", "type": "max_pool2d", "params": {"kernel_size": 2, "stride": 2}},
            {"id": "node-8", "type": "conv2d", "params": {"in_channels": 64, "out_channels": 128, "kernel_size": 3, "stride": 1, "padding": 1}},
            {"id": "node-9", "type": "batch_norm", "params": {"num_features": 128}},
            {"id": "node-10", "type": "max_pool2d", "params": {"kernel_size": 2, "stride": 2}},
            {"id": "node-11", "type": "flatten", "params": {}},
            {"id": "node-12", "type": "linear", "params": {"in_features": 2048, "out_features": 256, "bias": True}},
            {"id": "node-13", "type": "dropout", "params": {"p": 0.5}},
            {"id": "node-14", "type": "linear", "params": {"in_features": 256, "out_features": 10, "bias": True}},
            {"id": "node-15", "type": "output", "params": {"num_classes": 10}}
        ],
        "edges": []
    },
    "简单 Transformer": {
        "version": "1.0",
        "name": "简单 Transformer",
        "description": "用于序列建模的 Transformer 编码器",
        "saved_at": "",
        "is_example": True,
        "nodes": [
            {"id": "node-1", "type": "input", "params": {"shape": [512]}},
            {"id": "node-2", "type": "embedding", "params": {"num_embeddings": 10000, "embedding_dim": 512}},
            {"id": "node-3", "type": "multihead_attention", "params": {"embed_dim": 512, "num_heads": 8}},
            {"id": "node-4", "type": "layer_norm", "params": {"normalized_shape": [512]}},
            {"id": "node-5", "type": "linear", "params": {"in_features": 512, "out_features": 2048, "bias": True}},
            {"id": "node-6", "type": "dropout", "params": {"p": 0.1}},
            {"id": "node-7", "type": "linear", "params": {"in_features": 2048, "out_features": 512, "bias": True}},
            {"id": "node-8", "type": "layer_norm", "params": {"normalized_shape": [512]}},
            {"id": "node-9", "type": "linear", "params": {"in_features": 512, "out_features": 10000, "bias": True}},
            {"id": "node-10", "type": "output", "params": {"num_classes": 10000}}
        ],
        "edges": []
    }
}

def init_example_projects():
    """初始化示例工程，只在不存在时创建"""
    project_dir = settings.PROJECT_DIR
    os.makedirs(project_dir, exist_ok=True)

    for name, data in EXAMPLE_PROJECTS.items():
        safe_name = name.replace("/", "_").replace("\\", "_")
        filepath = os.path.join(project_dir, f"{safe_name}.nnproj")

        # 如果文件已存在，跳过（保留用户可能做的修改）
        if os.path.exists(filepath):
            print(f"示例工程已存在，跳过: {name}")
            continue

        # 更新保存时间
        data["saved_at"] = datetime.now().isoformat()

        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"创建示例工程: {name}")
        except Exception as e:
            print(f"创建示例工程失败 {name}: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("nn_UI Backend starting...")
    init_example_projects()
    yield
    print("nn_UI Backend shutting down...")

app = FastAPI(
    title="nn_UI Backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(os.path.expanduser("~/.nnbuilder"), exist_ok=True)

# Register API routers
app.include_router(layers_router)
app.include_router(graph_router)
app.include_router(codegen_router)
app.include_router(project_router)
app.include_router(training_router)
app.include_router(system_router)
app.include_router(model_summary_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8765)