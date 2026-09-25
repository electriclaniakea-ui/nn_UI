from typing import Any
from dataclasses import dataclass, field

@dataclass
class Node:
    id: str
    type: str
    params: dict = field(default_factory=dict)

@dataclass
class Edge:
    source: str
    target: str
    data: dict = field(default_factory=dict)

@dataclass
class Graph:
    nodes: list[Node] = field(default_factory=list)
    edges: list[Edge] = field(default_factory=list)
    
    def add_node(self, node: Node):
        self.nodes.append(node)
    
    def add_edge(self, edge: Edge):
        self.edges.append(edge)
    
    def get_node(self, node_id: str) -> Node | None:
        for node in self.nodes:
            if node.id == node_id:
                return node
        return None
    
    def get_successors(self, node_id: str) -> list[Node]:
        successors = []
        for edge in self.edges:
            if edge.source == node_id:
                target_node = self.get_node(edge.target)
                if target_node:
                    successors.append(target_node)
        return successors
    
    def get_predecessors(self, node_id: str) -> list[Node]:
        predecessors = []
        for edge in self.edges:
            if edge.target == node_id:
                source_node = self.get_node(edge.source)
                if source_node:
                    predecessors.append(source_node)
        return predecessors
    
    def topological_sort(self) -> list[Node]:
        in_degree = {node.id: 0 for node in self.nodes}
        
        for edge in self.edges:
            if edge.target in in_degree:
                in_degree[edge.target] += 1
        
        queue = [node for node in self.nodes if in_degree[node.id] == 0]
        sorted_nodes = []
        
        while queue:
            node = queue.pop(0)
            sorted_nodes.append(node)
            
            for successor in self.get_successors(node.id):
                in_degree[successor.id] -= 1
                if in_degree[successor.id] == 0:
                    queue.append(successor)
        
        if len(sorted_nodes) != len(self.nodes):
            raise ValueError("Graph contains a cycle")
        
        return sorted_nodes
    
    def has_cycle(self) -> bool:
        try:
            self.topological_sort()
            return False
        except ValueError:
            return True