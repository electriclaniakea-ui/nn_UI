from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any
from ..core.validator import validate_graph
from ..state import get_state

router = APIRouter(prefix="/api/graph", tags=["graph"])

class GraphIn(BaseModel):
    nodes: list[dict[str, Any]]
    edges: list[dict[str, Any]] = []

class GraphOut(BaseModel):
    errors: list[dict] = []
    output_shape: list | None = None
    node_shapes: list[dict] = []

@router.post("")
async def update_graph(graph: GraphIn) -> GraphOut:
    state = get_state()
    
    from ..core.graph import Graph, Node, Edge
    graph_obj = Graph(
        nodes=[
            Node(
                id=n.get("id", f"node_{i}"),
                type=n.get("data", {}).get("type", "unknown"),
                params=n.get("data", {}).get("params", {}),
            )
            for i, n in enumerate(graph.nodes)
        ],
        edges=[
            Edge(source=e.get("source", ""), target=e.get("target", ""))
            for e in graph.edges
        ],
    )
    
    errors, output_shape, node_shapes = validate_graph(graph_obj)
    
    state.current_graph.nodes = graph.nodes
    state.current_graph.edges = graph.edges
    
    return GraphOut(
        errors=[
            {
                "node_index": err.get("node_index", 0),
                "node_type": err.get("node_type", ""),
                "error": err.get("error", ""),
            }
            for err in errors
        ],
        output_shape=output_shape,
        node_shapes=node_shapes,
    )

@router.get("")
async def get_current_graph():
    state = get_state()
    return {
        "nodes": state.current_graph.nodes,
        "edges": state.current_graph.edges,
    }