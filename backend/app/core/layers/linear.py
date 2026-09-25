from .base import LayerSpec, ParamSpec
from .registry import register

@register
class LinearLayer(LayerSpec):
    type = "linear"
    display = "全连接层 (Linear)"
    category = "layer"
    color = "#7C3AED"
    
    params = [
        ParamSpec(name="in_features", type="int", default=128, min=1, label="输入维度"),
        ParamSpec(name="out_features", type="int", default=64, min=1, label="输出维度"),
        ParamSpec(name="bias", type="bool", default=True, label="偏置"),
    ]
    
    def infer_shape(self, input_shapes):
        in_f = self.params[0].default
        out_f = self.params[1].default
        return (out_f,)
    
    def codegen_init(self, node_id, params):
        return f"self.{node_id} = nn.Linear(in_features={params.get('in_features', 128)}, out_features={params.get('out_features', 64)}, bias={params.get('bias', True)})"
    
    def codegen_forward(self, node_id, inputs):
        return f"x = self.{node_id}(x)"