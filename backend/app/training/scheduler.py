from typing import Any

class LRScheduler:
    @staticmethod
    def create(name: str, optimizer: Any, **kwargs):
        import torch.optim.lr_scheduler as lr_scheduler
        
        schedulers = {
            "StepLR": lambda: lr_scheduler.StepLR(
                optimizer,
                step_size=kwargs.get("step_size", 30),
                gamma=kwargs.get("gamma", 0.1),
            ),
            "CosineAnnealing": lambda: lr_scheduler.CosineAnnealingLR(
                optimizer,
                T_max=kwargs.get("T_max", 100),
                eta_min=kwargs.get("eta_min", 0),
            ),
            "ReduceLROnPlateau": lambda: lr_scheduler.ReduceLROnPlateau(
                optimizer,
                mode=kwargs.get("mode", "min"),
                factor=kwargs.get("factor", 0.1),
                patience=kwargs.get("patience", 10),
            ),
            "OneCycle": lambda: lr_scheduler.OneCycleLR(
                optimizer,
                max_lr=kwargs.get("max_lr", 0.01),
                total_steps=kwargs.get("total_steps", 1000),
            ),
        }
        
        if name not in schedulers:
            raise ValueError(f"Unknown scheduler: {name}")
        
        return schedulers[name]()
    
    @staticmethod
    def get_available_schedulers() -> list[dict]:
        return [
            {"name": "StepLR", "description": "每 step_size 步衰减 gamma 倍"},
            {"name": "CosineAnnealing", "description": "余弦退火"},
            {"name": "ReduceLROnPlateau", "description": "指标不再下降时衰减"},
            {"name": "OneCycle", "description": "单周期学习率策略"},
        ]