from .base import LayerSpec, ParamSpec
from .registry import register

@register
class InputLayer(LayerSpec):
    type = "input"
    display = "输入层 (Input)"
    category = "IO"
    color = "#059669"
    
    params = [
        ParamSpec(name="shape", type="tuple", default=[784], label="输入形状"),
    ]
    
    def infer_shape(self, input_shapes):
        return tuple(self.params[0].default)
    
    def codegen_init(self, node_id, params):
        return f"# Input layer: shape={params.get('shape', [784])}"
    
    def codegen_forward(self, node_id, inputs):
        return f"# {node_id}: input"

@register
class OutputLayer(LayerSpec):
    type = "output"
    display = "输出层 (Output)"
    category = "IO"
    color = "#DC2626"
    
    params = [
        ParamSpec(name="num_classes", type="int", default=10, min=1, label="类别数"),
    ]
    
    def infer_shape(self, input_shapes):
        return (self.params[0].default,)
    
    def codegen_init(self, node_id, params):
        return f"self.{node_id} = nn.Linear(in_features=last_dim, out_features={params.get('num_classes', 10)})"
    
    def codegen_forward(self, node_id, inputs):
        return f"x = self.{node_id}(x)"

@register
class ConcatLayer(LayerSpec):
    type = "concat"
    display = "拼接 (Concat)"
    category = "IO"
    color = "#D97706"
    inputs = ["in1", "in2"]
    
    def infer_shape(self, input_shapes):
        if len(input_shapes) >= 2:
            return (input_shapes[0][0] + input_shapes[1][0],)
        return input_shapes[0] if input_shapes else (0,)
    
    def codegen_init(self, node_id, params):
        return f"# Concat layer: {node_id}"
    
    def codegen_forward(self, node_id, inputs):
        if len(inputs) >= 2:
            return f"x = torch.cat([{', '.join(inputs)}], dim=1)"
        return f"x = {inputs[0]}"

@register
class AddLayer(LayerSpec):
    type = "add"
    display = "加法 (Add)"
    category = "IO"
    color = "#D97706"
    inputs = ["in1", "in2"]
    
    def infer_shape(self, input_shapes):
        return input_shapes[0] if input_shapes else (0,)
    
    def codegen_init(self, node_id, params):
        return f"# Add layer: {node_id}"
    
    def codegen_forward(self, node_id, inputs):
        if len(inputs) >= 2:
            result = inputs[0]
            for inp in inputs[1:]:
                result = f"{result} + {inp}"
            return f"x = {result}"
        return f"x = {inputs[0]}"

# Import all layers to register them
from .linear import LinearLayer
from .conv2d import Conv2dLayer
from .activations import ReLULayer, LeakyReLULayer, SigmoidLayer, TanhLayer, GELULayer, SoftmaxLayer
from .normalization import BatchNormLayer, LayerNormLayer
from .pooling import MaxPool2dLayer, AvgPool2dLayer, AdaptiveAvgPool2dLayer
from .dropout import DropoutLayer
from .reshape import FlattenLayer, ReshapeLayer
from .rnn import LSTMLayer, GRULayer
from .transformer import EmbeddingLayer, MultiheadAttentionLayer, TransformerEncoderLayer
from .special import InputLayer, OutputLayer, ConcatLayer, AddLayer