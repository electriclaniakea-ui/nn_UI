from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any

router = APIRouter(prefix="/api/codegen", tags=["codegen"])

class CodeGenIn(BaseModel):
    nodes: list[dict[str, Any]]

@router.post("")
async def generate_code(request: CodeGenIn):
    from ..core.codegen import CodeGenerator
    
    generator = CodeGenerator()
    
    try:
        code = generator.generate_from_nodes(request.nodes)
        return {
            "model_code": code.get("model", ""),
            "train_code": code.get("train", ""),
        }
    except Exception as e:
        return {
            "error": str(e),
            "model_code": "",
            "train_code": "",
        }