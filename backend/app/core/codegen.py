from typing import Any

class CodeGenerator:
    def generate_from_nodes(self, nodes: list[dict]) -> dict:
        model_code = self._generate_model(nodes)
        train_code = self._generate_train(nodes)
        
        return {
            "model": model_code,
            "train": train_code,
        }
    
    def _generate_model(self, nodes: list[dict]) -> str:
        lines = [
            "import torch",
            "import torch.nn as nn",
            "import torch.nn.functional as F",
            "",
            "class NeuralNetwork(nn.Module):",
            "    def __init__(self):",
            "        super(NeuralNetwork, self).__init__()",
            "",
        ]
        
        for i, node in enumerate(nodes):
            node_type = node.get("data", {}).get("type", "")
            params = node.get("data", {}).get("params", {})
            
            init_code = self._generate_init(node_type, params, i)
            lines.extend(init_code)
        
        lines.extend([
            "",
            "    def forward(self, x):",
        ])
        
        for i, node in enumerate(nodes):
            node_type = node.get("data", {}).get("type", "")
            params = node.get("data", {}).get("params", {})
            forward_code = self._generate_forward(node_type, i, params)
            lines.append(f"        {forward_code}")
        
        lines.extend([
            "        return x",
            "",
            "# 创建模型实例",
            "model = NeuralNetwork()",
            "print(model)",
        ])
        
        return "\n".join(lines)
    
    def _generate_init(self, node_type: str, params: dict, index: int) -> list[str]:
        var_name = f"layer{index}"
        lines = []
        
        if node_type == "linear":
            lines.append(
                f"        self.{var_name} = nn.Linear("
                f"in_features={params.get('in_features', 128)}, "
                f"out_features={params.get('out_features', 64)}, "
                f"bias={params.get('bias', True)})"
            )
        
        elif node_type == "conv2d":
            lines.append(
                f"        self.{var_name} = nn.Conv2d("
                f"in_channels={params.get('in_channels', 3)}, "
                f"out_channels={params.get('out_channels', 64)}, "
                f"kernel_size={params.get('kernel_size', 3)}, "
                f"stride={params.get('stride', 1)}, "
                f"padding={params.get('padding', 1)})"
            )
        
        elif node_type == "relu":
            lines.append(f"        self.{var_name} = nn.ReLU()")
        
        elif node_type == "leaky_relu":
            lines.append(
                f"        self.{var_name} = nn.LeakyReLU("
                f"negative_slope={params.get('negative_slope', 0.01)})"
            )
        
        elif node_type == "dropout":
            lines.append(f"        self.{var_name} = nn.Dropout(p={params.get('p', 0.5)})")
        
        elif node_type == "batch_norm":
            lines.append(
                f"        self.{var_name} = nn.BatchNorm2d("
                f"num_features={params.get('num_features', 64)})"
            )
        
        elif node_type == "flatten":
            lines.append(f"        self.{var_name} = nn.Flatten()")
        
        else:
            lines.append(f"        # {node_type} - 待实现")
        
        return lines
    
    def _generate_forward(self, node_type: str, index: int, params: dict = None) -> str:
        var_name = f"layer{index}"
        
        if node_type == "linear":
            activation = params.get('activation', 'none') if params else 'none'
            if activation and activation != 'none':
                return f"x = F.{activation}(self.{var_name}(x))"
            return f"x = self.{var_name}(x)"
        
        if node_type in ["conv2d", "relu", "leaky_relu", 
                          "dropout", "batch_norm", "flatten"]:
            return f"x = self.{var_name}(x)"
        
        else:
            return f"# {node_type} forward pass"
    
    def _generate_train(self, nodes: list[dict]) -> str:
        return '''# 训练脚本
import torch
import torch.optim as optim
from model import NeuralNetwork

# 超参数配置
BATCH_SIZE = 32
LEARNING_RATE = 0.001
EPOCHS = 10

# 初始化模型、损失函数和优化器
model = NeuralNetwork()
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)

# 训练循环
for epoch in range(EPOCHS):
    running_loss = 0.0
    for i, data in enumerate(trainloader, 0):
        inputs, labels = data
        
        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item()
        if i % 100 == 99:
            print(f'[{epoch + 1}, {i + 1}] loss: {running_loss / 100:.3f}')
            running_loss = 0.0

print('训练完成')
'''