from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Optional
import math

router = APIRouter(prefix="/api/training", tags=["training"])

class DatasetConfig(BaseModel):
    trainDir: Optional[str] = None
    valDir: Optional[str] = None
    csvPath: Optional[str] = None
    imageColumn: Optional[str] = "image_path"
    labelColumn: Optional[str] = "label"
    npyPath: Optional[str] = None
    xTrainKey: Optional[str] = "x_train"
    yTrainKey: Optional[str] = "y_train"
    xValKey: Optional[str] = "x_val"
    yValKey: Optional[str] = "y_val"
    hfDatasetName: Optional[str] = None
    hfConfigName: Optional[str] = None
    hfSplit: Optional[str] = "train"
    hfImageColumn: Optional[str] = "image"
    hfLabelColumn: Optional[str] = "label"

class TrainConfig(BaseModel):
    dataset: str = "MNIST"
    dataset_type: str = "builtin"
    dataset_config: Optional[DatasetConfig] = None
    optimizer: str = "Adam"
    learning_rate: float = 0.001
    batch_size: int = 32
    epochs: int = 10
    lr_scheduler: Optional[str] = "CosineAnnealing"
    early_stopping: bool = False
    patience: int = 5
    checkpoint_restore: bool = False
    loss_function: str = "cross_entropy"
    weight_decay: float = 0.0001
    graph_nodes: list = []

class LRPreviewRequest(BaseModel):
    scheduler: str
    epochs: int = 10
    steps_per_epoch: int = 100
    initial_lr: float = 0.001

class ExportRequest(BaseModel):
    format: str = "onnx"
    output_path: Optional[str] = None

@router.post("/start")
async def start_training(config: TrainConfig):
    from ..training.manager import TrainingManager
    
    manager = TrainingManager()
    
    try:
        # 使用前端传来的节点数据
        graph_nodes = config.graph_nodes if config.graph_nodes else []
        train_id = await manager.start_training(
            graph_nodes=graph_nodes,
            config=config.model_dump(),
        )
        return {"train_id": train_id, "status": "started"}
    except Exception as e:
        return {"error": str(e), "status": "failed"}

@router.post("/stop")
async def stop_training():
    from ..training.manager import TrainingManager
    
    manager = TrainingManager()
    
    try:
        manager.stop_training()
        return {"status": "stopped"}
    except Exception as e:
        return {"error": str(e)}

@router.get("/status")
async def get_training_status():
    from ..training.manager import TrainingManager
    
    manager = TrainingManager()
    
    status = manager.get_status()
    return status

@router.post("/lr-preview")
async def get_lr_preview(request: LRPreviewRequest):
    scheduler = request.scheduler
    epochs = request.epochs
    steps_per_epoch = request.steps_per_epoch
    initial_lr = request.initial_lr
    total_steps = epochs * steps_per_epoch
    
    points = []
    
    for step in range(total_steps + 1):
        epoch = step / steps_per_epoch
        
        if scheduler == "step_lr":
            # StepLR: decay by 0.1 every 30% of total epochs
            step_size = max(1, int(epochs * 0.3))
            gamma = 0.1
            lr = initial_lr * (gamma ** (int(epoch) // step_size))
        elif scheduler == "cosine":
            # CosineAnnealingLR
            T_max = total_steps
            lr = initial_lr * 0.5 * (1 + math.cos(math.pi * step / T_max))
        elif scheduler == "plateau":
            # ReduceLROnPlateau: simulate with step decay
            patience = max(1, int(epochs * 0.2))
            factor = 0.1
            lr = initial_lr * (factor ** (int(epoch) // patience))
        elif scheduler == "one_cycle":
            # OneCycleLR: warm up then cosine decay
            max_lr = initial_lr * 10
            pct_start = 0.3
            if step <= total_steps * pct_start:
                # Warm up
                progress = step / (total_steps * pct_start)
                lr = initial_lr + (max_lr - initial_lr) * progress
            else:
                # Cosine decay
                decay_steps = total_steps - total_steps * pct_start
                progress = (step - total_steps * pct_start) / decay_steps
                lr = initial_lr + (max_lr - initial_lr) * 0.5 * (1 + math.cos(math.pi * progress))
        else:
            lr = initial_lr
        
        points.append({"step": step, "lr": round(lr, 8)})
    
    # Downsample to max 200 points for visualization
    if len(points) > 200:
        step_size = len(points) // 200
        points = points[::step_size]
    
    return points

@router.post("/export")
async def export_model(request: ExportRequest):
    from ..training.manager import TrainingManager
    
    manager = TrainingManager()
    
    if manager._is_training:
        raise HTTPException(status_code=400, detail="训练进行中，请等待训练完成后再导出")
    
    # Check if there's a trained model
    if manager._model is None:
        raise HTTPException(status_code=400, detail="没有已训练的模型，请先完成训练")
    
    try:
        from ..config import settings
        # 如果没有指定输出路径，使用 nn_UI/exports/
        output_path = request.output_path or settings.EXPORTS_DIR
        result = manager.export_model(request.format, output_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"导出失败: {str(e)}")

from ..state import get_state