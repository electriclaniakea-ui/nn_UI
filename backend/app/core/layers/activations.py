from .base import LayerSpec, ParamSpec
from .registry import register

@register
class ReLULayer(LayerSpec):
    type = "relu"
    display = "ReLU"
    category = "activation"
    color = "#059669"
    
    def infer_shape(self, input_shapes):
        return input_shapes[0]
    
    def codegen_init(self, node_id, params):
        return f"self.{node_id} = nn.ReLU()"
    
    def codegen_forward(self, node_id, inputs):
        return f"x = self.{node_id}(x)"

@register
class LeakyReLULayer(LayerSpec):
    type = "leaky_relu"
    display = "LeakyReLU"
    category = "activation"
    color = "#059669"
    
    params = [
        ParamSpec(name="negative_slope", type="float", default=0.01, min=0.0, max=1.0),
    ]
    
    def infer_shape(self, input_shapes):
        return input_shapes[0]
    
    def codegen_init(self, node_id, params):
        return f"self.{node_id} = nn.LeakyReLU(negative_slope={params.get('negative_slope', 0.01)})"
    
    def codegen_forward(self, node_id, inputs):
        return f"x = self.{node_id}(x)"

@register
class SigmoidLayer(LayerSpec):
    type = "sigmoid"
    display = "Sigmoid"
    category = "activation"
    color = "#059669"
    
    def infer_shape(self, input_shapes):
        return input_shapes[0]
    
    def codegen_init(self, node_id, params):
        return f"self.{node_id} = nn.Sigmoid()"
    
    def codegen_forward(self, node_id, inputs):
        return f"x = self.{node_id}(x)"

@register
class TanhLayer(LayerSpec):
    type = "tanh"
    display = "Tanh"
    category = "activation"
    color = "#059669"
    
    def infer_shape(self, input_shapes):
        return input_shapes[0]
    
    def codegen_init(self, node_id, params):
        return f"self.{node_id} = nn.Tanh()"
    
    def codegen_forward(self, node_id, inputs):
        return f"x = self.{node_id}(x)"

@register
class GELULayer(LayerSpec):
    type = "gelu"
    display = "GELU"
    category = "activation"
    color = "#059669"
    
    def infer_shape(self, input_shapes):
        return input_shapes[0]
    
    def codegen_init(self, node_id, params):
        return f"self.{node_id} = nn.GELU()"
    
    def codegen_forward(self, node_id, inputs):
        return f"x = self.{node_id}(x)"

@register
class SoftmaxLayer(LayerSpec):
    type = "softmax"
    display = "Softmax"
    category = "activation"
    color = "#059669"
    
    params = [
        ParamSpec(name="dim", type="int", default=-1, label="维度"),
    ]
    
    def infer_shape(self, input_shapes):
        return input_shapes[0]
    
    def codegen_init(self, node_id, params):
        return f"self.{node_id} = nn.Softmax(dim={params.get('dim', -1)})"
    
    def codegen_forward(self, node_id, inputs):
        return f"x = self.{node_id}(x)"