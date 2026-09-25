from fastapi import APIRouter
import torch
import os
import signal
import sys

router = APIRouter(prefix="/api/system", tags=["system"])

@router.get("")
async def get_system_info():
    return {
        "version": "1.0.0",
        "device": "cuda" if torch.cuda.is_available() else "cpu",
        "cuda_available": torch.cuda.is_available(),
        "cuda_device_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
        "cuda_memory": {
            "total": torch.cuda.get_device_properties(0).total_mem if torch.cuda.is_available() else 0,
            "allocated": torch.cuda.memory_allocated() if torch.cuda.is_available() else 0,
            "cached": torch.cuda.memory_reserved() if torch.cuda.is_available() else 0,
        } if torch.cuda.is_available() else None,
        "python_version": "3.10+",
        "pytorch_version": torch.__version__,
    }


@router.post("/shutdown")
async def shutdown():
    """关闭后端服务进程"""
    import threading

    def delayed_exit():
        import time
        time.sleep(0.5)
        os.kill(os.getpid(), signal.SIGTERM)

    threading.Thread(target=delayed_exit, daemon=True).start()
    return {"status": "shutting_down"}