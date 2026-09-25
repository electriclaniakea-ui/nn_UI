from .base import LayerSpec, ParamSpec
from .registry import register

@register
class EmbeddingLayer(LayerSpec):
    type = "embedding"
    display = "Embedding"
    category = "layer"
    color = "#7C3AED"
    
    params = [
        ParamSpec(name="num_embeddings", type="int", default=10000, min=1, label="词汇量"),
        ParamSpec(name="embedding_dim", type="int", default=300, min=1, label="嵌入维度"),
    ]
    
    def infer_shape(self, input_shapes):
        return (self.params[1].default,)
    
    def codegen_init(self, node_id, params):
        return f"self.{node_id} = nn.Embedding(num_embeddings={params.get('num_embeddings', 10000)}, embedding_dim={params.get('embedding_dim', 300)})"
    
    def codegen_forward(self, node_id, inputs):
        return f"x = self.{node_id}(x)"

@register
class MultiheadAttentionLayer(LayerSpec):
    type = "multihead_attention"
    display = "MultiheadAttention"
    category = "layer"
    color = "#7C3AED"
    
    params = [
        ParamSpec(name="embed_dim", type="int", default=512, min=1, label="嵌入维度"),
        ParamSpec(name="num_heads", type="int", default=8, min=1, label="头数"),
    ]
    
    def infer_shape(self, input_shapes):
        return (self.params[0].default,)
    
    def codegen_init(self, node_id, params):
        return f"self.{node_id} = nn.MultiheadAttention(embed_dim={params.get('embed_dim', 512)}, num_heads={params.get('num_heads', 8)})"
    
    def codegen_forward(self, node_id, inputs):
        return f"x, _ = self.{node_id}(x, x, x)"

@register
class TransformerEncoderLayer(LayerSpec):
    type = "transformer_encoder"
    display = "TransformerEncoder"
    category = "layer"
    color = "#7C3AED"
    
    params = [
        ParamSpec(name="d_model", type="int", default=512, min=1, label="模型维度"),
        ParamSpec(name="nhead", type="int", default=8, min=1, label="注意力头数"),
        ParamSpec(name="num_layers", type="int", default=6, min=1, max=12, label="编码器层数"),
    ]
    
    def infer_shape(self, input_shapes):
        return (self.params[0].default,)
    
    def codegen_init(self, node_id, params):
        encoder_layer = f"nn.TransformerEncoderLayer(d_model={params.get('d_model', 512)}, nhead={params.get('nhead', 8)})"
        return f"self.{node_id} = nn.TransformerEncoder({encoder_layer}, num_layers={params.get('num_layers', 6)})"
    
    def codegen_forward(self, node_id, inputs):
        return f"x = self.{node_id}(x)"