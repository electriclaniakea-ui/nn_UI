from typing import Any

class OptimizerManager:
    @staticmethod
    def create(name: str, model: Any, **kwargs):
        import torch.optim as optim
        
        optimizers = {
            "SGD": lambda: optim.SGD(
                model.parameters(),
                lr=kwargs.get("learning_rate", 0.01),
                momentum=kwargs.get("momentum", 0.9),
                weight_decay=kwargs.get("weight_decay", 1e-4),
            ),
            "Adam": lambda: optim.Adam(
                model.parameters(),
                lr=kwargs.get("learning_rate", 0.001),
                betas=(kwargs.get("beta1", 0.9), kwargs.get("beta2", 0.999)),
                weight_decay=kwargs.get("weight_decay", 1e-4),
            ),
            "AdamW": lambda: optim.AdamW(
                model.parameters(),
                lr=kwargs.get("learning_rate", 0.001),
                betas=(kwargs.get("beta1", 0.9), kwargs.get("beta2", 0.999)),
                weight_decay=kwargs.get("weight_decay", 0.01),
            ),
            "RMSprop": lambda: optim.RMSprop(
                model.parameters(),
                lr=kwargs.get("learning_rate", 0.001),
                alpha=kwargs.get("alpha", 0.99),
                weight_decay=kwargs.get("weight_decay", 1e-4),
            ),
        }
        
        if name not in optimizers:
            raise ValueError(f"Unknown optimizer: {name}")
        
        return optimizers[name]()
    
    @staticmethod
    def get_available_optimizers() -> list[dict]:
        return [
            {"name": "SGD", "description": "随机梯度下降"},
            {"name": "Adam", "description": "自适应矩估计（推荐）"},
            {"name": "AdamW", "description": "带权重衰减的 Adam"},
            {"name": "RMSprop", "description": "均方根传播"},
        ]