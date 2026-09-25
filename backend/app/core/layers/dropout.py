from .base import LayerSpec, ParamSpec
from .registry import register

@register
class DropoutLayer(LayerSpec):
    type = "dropout"
    display = "Dropout"
    category = "regularization"
    color = "#DC2626"
    
    params = [
        ParamSpec(name="p", type="float", default=0.5, min=0.0, max=1.0, label="丢弃率"),
    ]
    
    def infer_shape(self, input_shapes):
        return input_shapes[0]
    
    def codegen_init(self, node_id, params):
        return f"self.{node_id} = nn.Dropout(p={params.get('p', 0.5)})"
    
    def codegen_forward(self, node_id, inputs):
        return f"x = self.{node_id}(x)"