from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any

router = APIRouter(prefix="/api/model", tags=["model"])

class ModelSummaryRequest(BaseModel):
    nodes: list[dict[str, Any]]

@router.post("/summary")
async def get_model_summary(request: ModelSummaryRequest):
    from ..core.summary import generate_summary
    
    try:
        summary = generate_summary(request.nodes)
        return {
            "layers": summary,
            "total_params": sum(layer.get("params", 0) for layer in summary),
        }
    except Exception as e:
        return {
            "error": str(e),
            "layers": [],
            "total_params": 0,
        }