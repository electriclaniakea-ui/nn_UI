from .base import LayerSpec, ParamSpec
from .registry import register

@register
class Conv2dLayer(LayerSpec):
    type = "conv2d"
    display = "卷积层 (Conv2d)"
    category = "layer"
    color = "#7C3AED"
    
    params = [
        ParamSpec(name="in_channels", type="int", default=3, min=1, label="输入通道"),
        ParamSpec(name="out_channels", type="int", default=64, min=1, label="输出通道"),
        ParamSpec(name="kernel_size", type="int", default=3, min=1, label="核大小"),
        ParamSpec(name="stride", type="int", default=1, min=1, label="步长"),
        ParamSpec(name="padding", type="int", default=1, min=0, label="填充"),
    ]
    
    def infer_shape(self, input_shapes):
        return (64, 16, 16)
    
    def codegen_init(self, node_id, params):
        return f"self.{node_id} = nn.Conv2d(in_channels={params.get('in_channels', 3)}, out_channels={params.get('out_channels', 64)}, kernel_size={params.get('kernel_size', 3)}, stride={params.get('stride', 1)}, padding={params.get('padding', 1)})"
    
    def codegen_forward(self, node_id, inputs):
        return f"x = self.{node_id}(x)"