from fastapi import APIRouter
from ..core.layers.registry import get_all_layers

router = APIRouter(prefix="/api/layers", tags=["layers"])

@router.get("")
async def get_all_available_layers():
    layers = get_all_layers()
    return [
        {
            "type": layer.type,
            "display": layer.display,
            "category": layer.category,
            "color": layer.color,
            "params": [
                {
                    "name": p.name,
                    "type": p.type,
                    "default": p.default,
                    "min": p.min,
                    "max": p.max,
                    "options": p.options,
                }
                for p in layer.params
            ],
            "inputs": layer.inputs,
            "outputs": layer.outputs,
        }
        for layer in layers
    ]