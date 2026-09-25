from .base import LayerSpec, ParamSpec
from .registry import register

@register
class BatchNormLayer(LayerSpec):
    type = "batch_norm"
    display = "BatchNorm2d"
    category = "normalization"
    color = "#D97706"
    
    params = [
        ParamSpec(name="num_features", type="int", default=64, min=1, label="特征数"),
    ]
    
    def infer_shape(self, input_shapes):
        return input_shapes[0]
    
    def codegen_init(self, node_id, params):
        return f"self.{node_id} = nn.BatchNorm2d(num_features={params.get('num_features', 64)})"
    
    def codegen_forward(self, node_id, inputs):
        return f"x = self.{node_id}(x)"

@register
class LayerNormLayer(LayerSpec):
    type = "layer_norm"
    display = "LayerNorm"
    category = "normalization"
    color = "#D97706"
    
    params = [
        ParamSpec(name="normalized_shape", type="tuple", default=[768], label="归一化形状"),
    ]
    
    def infer_shape(self, input_shapes):
        return input_shapes[0]
    
    def codegen_init(self, node_id, params):
        return f"self.{node_id} = nn.LayerNorm(normalized_shape={params.get('normalized_shape', [768])})"
    
    def codegen_forward(self, node_id, inputs):
        return f"x = self.{node_id}(x)"