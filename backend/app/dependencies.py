from fastapi import Depends
from .state import get_state
from .config import settings

async def get_current_graph(state=Depends(get_state)):
    return state.current_graph

async def get_training_manager():
    from .training.manager import TrainingManager
    return TrainingManager()