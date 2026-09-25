from .base import LayerSpec, ParamSpec
from .registry import register

@register
class LSTMLayer(LayerSpec):
    type = "lstm"
    display = "LSTM"
    category = "layer"
    color = "#7C3AED"
    
    params = [
        ParamSpec(name="input_size", type="int", default=128, min=1, label="输入大小"),
        ParamSpec(name="hidden_size", type="int", default=256, min=1, label="隐藏层大小"),
        ParamSpec(name="num_layers", type="int", default=1, min=1, max=4, label="层数"),
        ParamSpec(name="batch_first", type="bool", default=True, label="批次优先"),
        ParamSpec(name="bidirectional", type="bool", default=False, label="双向"),
    ]
    
    def infer_shape(self, input_shapes):
        hidden_size = self.params[1].default
        bidirectional = self.params[4].default
        return (hidden_size * 2 if bidirectional else hidden_size,)
    
    def codegen_init(self, node_id, params):
        return f"self.{node_id} = nn.LSTM(input_size={params.get('input_size', 128)}, hidden_size={params.get('hidden_size', 256)}, num_layers={params.get('num_layers', 1)}, batch_first={params.get('batch_first', True)}, bidirectional={params.get('bidirectional', False)})"
    
    def codegen_forward(self, node_id, inputs):
        return f"x, _ = self.{node_id}(x)"

@register
class GRULayer(LayerSpec):
    type = "gru"
    display = "GRU"
    category = "layer"
    color = "#7C3AED"
    
    params = [
        ParamSpec(name="input_size", type="int", default=128, min=1, label="输入大小"),
        ParamSpec(name="hidden_size", type="int", default=256, min=1, label="隐藏层大小"),
        ParamSpec(name="num_layers", type="int", default=1, min=1, max=4, label="层数"),
        ParamSpec(name="batch_first", type="bool", default=True, label="批次优先"),
        ParamSpec(name="bidirectional", type="bool", default=False, label="双向"),
    ]
    
    def infer_shape(self, input_shapes):
        hidden_size = self.params[1].default
        bidirectional = self.params[4].default
        return (hidden_size * 2 if bidirectional else hidden_size,)
    
    def codegen_init(self, node_id, params):
        return f"self.{node_id} = nn.GRU(input_size={params.get('input_size', 128)}, hidden_size={params.get('hidden_size', 256)}, num_layers={params.get('num_layers', 1)}, batch_first={params.get('batch_first', True)}, bidirectional={params.get('bidirectional', False)})"
    
    def codegen_forward(self, node_id, inputs):
        return f"x, _ = self.{node_id}(x)"