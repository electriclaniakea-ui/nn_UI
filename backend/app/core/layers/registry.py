from typing import List
from .base import LayerSpec

_layer_registry: dict[str, LayerSpec] = {}

def register(layer_class: type) -> type:
    instance = layer_class()
    _layer_registry[instance.type] = instance
    return layer_class

def get(type: str) -> LayerSpec | None:
    return _layer_registry.get(type)

def all() -> List[LayerSpec]:
    return list(_layer_registry.values())

def get_all_layers() -> List[dict]:
    layers = []
    for layer_spec in all():
        layers.append({
            "type": layer_spec.type,
            "display": layer_spec.display,
            "category": layer_spec.category,
            "color": layer_spec.color,
            "params": [
                {
                    "name": p.name,
                    "type": p.type,
                    "default": p.default,
                    "min": p.min,
                    "max": p.max,
                    "options": p.options,
                }
                for p in layer_spec.params
            ],
            "inputs": layer_spec.inputs,
            "outputs": layer_spec.outputs,
        })
    
    return layers