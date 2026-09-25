from .base import LayerSpec, ParamSpec
from .registry import register

@register
class FlattenLayer(LayerSpec):
    type = "flatten"
    display = "Flatten"
    category = "reshape"
    color = "#8A8074"
    
    def infer_shape(self, input_shapes):
        return (1024,)
    
    def codegen_init(self, node_id, params):
        return f"self.{node_id} = nn.Flatten()"
    
    def codegen_forward(self, node_id, inputs):
        return f"x = self.{node_id}(x)"

@register
class ReshapeLayer(LayerSpec):
    type = "reshape"
    display = "Reshape"
    category = "reshape"
    color = "#8A8074"
    
    params = [
        ParamSpec(name="shape", type="tuple", default=[-1], label="目标形状"),
    ]
    
    def infer_shape(self, input_shapes):
        shape = self.params[0].default
        if -1 in shape:
            total = 1
            for dim in input_shapes[0]:
                total *= dim
            other_dims = [s for s in shape if s != -1]
            auto_dim = total // (1 if not other_dims else 1)
            return tuple(auto_dim if s == -1 else s for s in shape)
        return tuple(shape)
    
    def codegen_init(self, node_id, params):
        return f"self.{node_id}_shape = {params.get('shape', [-1])}"
    
    def codegen_forward(self, node_id, inputs):
        return f"x = x.view(*self.{node_id}_shape)"