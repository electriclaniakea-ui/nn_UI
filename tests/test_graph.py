import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

import unittest
from app.core.graph import Graph, Node, Edge

class TestGraph(unittest.TestCase):
    def setUp(self):
        self.graph = Graph()
    
    def test_add_node(self):
        node = Node(id="1", type="linear")
        self.graph.add_node(node)
        self.assertEqual(len(self.graph.nodes), 1)
    
    def test_get_node(self):
        node = Node(id="1", type="linear")
        self.graph.add_node(node)
        
        found = self.graph.get_node("1")
        self.assertIsNotNone(found)
        self.assertEqual(found.type, "linear")
        
        not_found = self.graph.get_node("2")
        self.assertIsNone(not_found)
    
    def test_add_edge(self):
        node1 = Node(id="1", type="input")
        node2 = Node(id="2", type="linear")
        self.graph.add_node(node1)
        self.graph.add_node(node2)
        
        edge = Edge(source="1", target="2")
        self.graph.add_edge(edge)
        
        self.assertEqual(len(self.graph.edges), 1)
    
    def test_topological_sort(self):
        nodes = [
            Node(id="input", type="input"),
            Node(id="conv1", type="conv2d"),
            Node(id="relu1", type="relu"),
            Node(id="output", type="output"),
        ]
        for node in nodes:
            self.graph.add_node(node)
        
        edges = [
            Edge(source="input", target="conv1"),
            Edge(source="conv1", target="relu1"),
            Edge(source="relu1", target="output"),
        ]
        for edge in edges:
            self.graph.add_edge(edge)
        
        sorted_nodes = self.graph.topological_sort()
        
        self.assertEqual(sorted_nodes[0].id, "input")
        self.assertEqual(sorted_nodes[-1].id, "output")
    
    def test_cycle_detection(self):
        node1 = Node(id="1", type="linear")
        node2 = Node(id="2", type="relu")
        node3 = Node(id="3", type="linear")
        
        for node in [node1, node2, node3]:
            self.graph.add_node(node)
        
        self.graph.add_edge(Edge(source="1", target="2"))
        self.graph.add_edge(Edge(source="2", target="3"))
        self.graph.add_edge(Edge(source="3", target="1"))
        
        self.assertTrue(self.graph.has_cycle())
    
    def test_get_successors_and_predecessors(self):
        node1 = Node(id="1", type="input")
        node2 = Node(id="2", type="linear")
        node3 = Node(id="3", type="relu")
        
        for node in [node1, node2, node3]:
            self.graph.add_node(node)
        
        self.graph.add_edge(Edge(source="1", target="2"))
        self.graph.add_edge(Edge(source="2", target="3"))
        
        successors = self.graph.get_successors("1")
        self.assertEqual(len(successors), 1)
        self.assertEqual(successors[0].id, "2")
        
        predecessors = self.graph.get_predecessors("3")
        self.assertEqual(len(predecessors), 1)
        self.assertEqual(predecessors[0].id, "2")

if __name__ == '__main__':
    unittest.main()