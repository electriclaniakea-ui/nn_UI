from abc import ABC, abstractmethod
from typing import Any, List, Optional
from pydantic import BaseModel

class ParamSpec(BaseModel):
    name: str
    type: str  # "int", "float", "bool", "str", "select", "tuple"
    default: Any = None
    min: Optional[float] = None
    max: Optional[float] = None
    options: Optional[List[str]] = None
    label: Optional[str] = None

class LayerSpec(ABC):
    type: str = ""
    display: str = ""
    category: str = ""
    color: str = "#7C3AED"
    inputs: List[str] = ["in"]
    outputs: List[str] = ["out"]
    params: List[ParamSpec] = []
    
    @abstractmethod
    def infer_shape(self, input_shapes: List[tuple]) -> tuple:
        pass
    
    @abstractmethod
    def codegen_init(self, node_id: str, params: dict) -> str:
        pass
    
    @abstractmethod
    def codegen_forward(self, node_id: str, inputs: List[str]) -> str:
        pass