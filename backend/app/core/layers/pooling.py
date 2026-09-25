from .base import LayerSpec, ParamSpec
from .registry import register

@register
class MaxPool2dLayer(LayerSpec):
    type = "max_pool2d"
    display = "MaxPool2d"
    category = "pooling"
    color = "#DC2626"
    
    params = [
        ParamSpec(name="kernel_size", type="int", default=2, min=1, label="核大小"),
        ParamSpec(name="stride", type="int", default=2, min=1, label="步长"),
    ]
    
    def infer_shape(self, input_shapes):
        return (64, 8, 8)
    
    def codegen_init(self, node_id, params):
        return f"self.{node_id} = nn.MaxPool2d(kernel_size={params.get('kernel_size', 2)}, stride={params.get('stride', 2)})"
    
    def codegen_forward(self, node_id, inputs):
        return f"x = self.{node_id}(x)"

@register
class AvgPool2dLayer(LayerSpec):
    type = "avg_pool2d"
    display = "AvgPool2d"
    category = "pooling"
    color = "#DC2626"
    
    params = [
        ParamSpec(name="kernel_size", type="int", default=2, min=1, label="核大小"),
        ParamSpec(name="stride", type="int", default=2, min=1, label="步长"),
    ]
    
    def infer_shape(self, input_shapes):
        return (64, 8, 8)
    
    def codegen_init(self, node_id, params):
        return f"self.{node_id} = nn.AvgPool2d(kernel_size={params.get('kernel_size', 2)}, stride={params.get('stride', 2)})"
    
    def codegen_forward(self, node_id, inputs):
        return f"x = self.{node_id}(x)"

@register
class AdaptiveAvgPool2dLayer(LayerSpec):
    type = "adaptive_avg_pool2d"
    display = "AdaptiveAvgPool2d"
    category = "pooling"
    color = "#DC2626"
    
    params = [
        ParamSpec(name="output_size", type="tuple", default=[1, 1], label="输出大小"),
    ]
    
    def infer_shape(self, input_shapes):
        return (64, 1, 1)
    
    def codegen_init(self, node_id, params):
        return f"self.{node_id} = nn.AdaptiveAvgPool2d(output_size={params.get('output_size', [1, 1])})"
    
    def codegen_forward(self, node_id, inputs):
        return f"x = self.{node_id}(x)"