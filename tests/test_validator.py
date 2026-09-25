import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

import unittest
from app.core.graph import Graph, Node
from app.core.validator import validate_graph

class TestValidator(unittest.TestCase):
    def test_valid_graph(self):
        graph = Graph()
        nodes = [
            Node(id="input", type="input", params={"shape": [784]}),
            Node(id="linear1", type="linear", params={"in_features": 784, "out_features": 256}),
            Node(id="relu1", type="relu"),
            Node(id="output", type="output", params={"num_classes": 10}),
        ]
        
        for node in nodes:
            graph.add_node(node)
        
        errors, output_shape = validate_graph(graph)
        
        self.assertEqual(len(errors), 0)
        self.assertIsNotNone(output_shape)
    
    def test_cycle_detection(self):
        graph = Graph()
        node1 = Node(id="1", type="linear")
        node2 = Node(id="2", type="relu")
        node3 = Node(id="3", type="linear")
        
        for node in [node1, node2, node3]:
            graph.add_node(node)
        
        from app.core.graph import Edge
        graph.add_edge(Edge(source="1", target="2"))
        graph.add_edge(Edge(source="2", target="3"))
        graph.add_edge(Edge(source="3", target="1"))
        
        errors, output_shape = validate_graph(graph)
        
        self.assertGreater(len(errors), 0)
        self.assertIsNone(output_shape)

if __name__ == '__main__':
    unittest.main()