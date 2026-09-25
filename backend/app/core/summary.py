from typing import Any

def generate_summary(nodes: list[dict]) -> list[dict]:
    summary = []
    
    for i, node in enumerate(nodes):
        node_type = node.get("data", {}).get("type", "unknown")
        params = node.get("data", {}).get("params", {})
        
        layer_info = {
            "name": f"layer{i}_{node_type}",
            "type": node_type,
            "input_shape": [],
            "output_shape": [],
            "params": 0,
        }
        
        if node_type == "linear":
            in_features = params.get("in_features", 128)
            out_features = params.get("out_features", 64)
            bias = params.get("bias", True)
            
            layer_info["input_shape"] = [in_features]
            layer_info["output_shape"] = [out_features]
            layer_info["params"] = in_features * out_features + (out_features if bias else 0)
        
        elif node_type == "conv2d":
            in_channels = params.get("in_channels", 3)
            out_channels = params.get("out_channels", 64)
            kernel_size = params.get("kernel_size", 3)
            
            layer_info["input_shape"] = [in_channels, 32, 32]
            layer_info["output_shape"] = [out_channels, 16, 16]
            layer_info["params"] = in_channels * out_channels * kernel_size * kernel_size + out_channels
        
        elif node_type == "batch_norm":
            num_features = params.get("num_features", 64)
            layer_info["params"] = num_features * 2
        
        elif node_type == "layer_norm":
            normalized_shape = params.get("normalized_shape", [768])
            total = 1
            for dim in normalized_shape:
                total *= dim
            layer_info["params"] = total * 2
        
        elif node_type == "lstm" or node_type == "gru":
            input_size = params.get("input_size", 128)
            hidden_size = params.get("hidden_size", 256)
            num_layers = params.get("num_layers", 1)
            
            if node_type == "lstm":
                layer_info["params"] = 4 * (input_size + hidden_size) * hidden_size * num_layers
            else:
                layer_info["params"] = 3 * (input_size + hidden_size) * hidden_size * num_layers
            
            layer_info["input_shape"] = [input_size]
            layer_info["output_shape"] = [hidden_size]
        
        elif node_type == "embedding":
            num_embeddings = params.get("num_embeddings", 10000)
            embedding_dim = params.get("embedding_dim", 300)
            layer_info["params"] = num_embeddings * embedding_dim
            layer_info["output_shape"] = [embedding_dim]
        
        else:
            layer_info["params"] = 0
        
        summary.append(layer_info)
    
    return summary