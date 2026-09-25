from typing import Any
from pydantic import BaseModel

class GraphState(BaseModel):
    nodes: list = []
    edges: list = []
    version: str = "1.0"

class AppState:
    def __init__(self):
        self._current_graph = GraphState()
        self._current_project_path: str | None = None
    
    @property
    def current_graph(self) -> GraphState:
        return self._current_graph
    
    @current_graph.setter
    def current_graph(self, value: GraphState):
        self._current_graph = value
    
    @property
    def current_project_path(self) -> str | None:
        return self._current_project_path
    
    @current_project_path.setter
    def current_project_path(self, value: str | None):
        self._current_project_path = value

_app_state: AppState | None = None

def get_state() -> AppState:
    global _app_state
    if _app_state is None:
        _app_state = AppState()
    return _app_state