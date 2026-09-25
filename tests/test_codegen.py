import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

import unittest
from app.core.codegen import CodeGenerator

class TestCodegen(unittest.TestCase):
    def setUp(self):
        self.generator = CodeGenerator()
    
    def test_generate_simple_mlp(self):
        nodes = [
            {
                "id": "input",
                "data": {
                    "type": "input",
                    "params": {"shape": [784]},
                }
            },
            {
                "id": "linear1",
                "data": {
                    "type": "linear",
                    "params": {"in_features": 784, "out_features": 256, "bias": True},
                }
            },
            {
                "id": "relu1",
                "data": {
                    "type": "relu",
                    "params": {},
                }
            },
            {
                "id": "output",
                "data": {
                    "type": "output",
                    "params": {"num_classes": 10},
                }
            },
        ]
        
        code = self.generator.generate_from_nodes(nodes)
        
        self.assertIn("class NeuralNetwork", code["model"])
        self.assertIn("nn.Linear", code["model"])
        self.assertIn("nn.ReLU", code["model"])
        self.assertIn("def forward", code["model"])

if __name__ == '__main__':
    unittest.main()