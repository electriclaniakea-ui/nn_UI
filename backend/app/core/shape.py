from typing import Any

def infer_shape(node_type: str, params: dict, input_shape: list) -> list:
    # Input 层：定义初始形状
    if node_type == "input":
        shape = params.get("shape", [784])
        if isinstance(shape, list):
            return shape
        elif isinstance(shape, int):
            return [shape]
        else:
            return [784]

    # Output 层：通常不做形状变换，只验证
    if node_type == "output":
        num_classes = params.get("num_classes", 10)
        # Output 层期望输入形状的最后一维等于 num_classes
        if len(input_shape) > 0 and input_shape[-1] != num_classes:
            raise ValueError(f"Output 层输入维度不匹配：期望最后一维为 {num_classes}，收到 {input_shape}")
        return input_shape

    if node_type == "linear":
        in_features = params.get("in_features", 128)
        out_features = params.get("out_features", 64)
        
        if len(input_shape) != 1 or input_shape[0] != in_features:
            raise ValueError(f"Linear 层输入维度不匹配：期望 [{in_features}]，收到 {input_shape}")
        
        return [out_features]
    
    elif node_type == "conv2d":
        in_channels = params.get("in_channels", 3)
        out_channels = params.get("out_channels", 64)
        kernel_size = params.get("kernel_size", 3)
        stride = params.get("stride", 1)
        padding = params.get("padding", 1)
        
        if len(input_shape) < 3:
            raise ValueError(f"Conv2d 需要三维输入 (C, H, W)，收到 {len(input_shape)} 维")
        
        if input_shape[0] != in_channels:
            raise ValueError(f"Conv2d 输入通道数不匹配：期望 {in_channels}，收到 {input_shape[0]}")
        
        h = (input_shape[1] + 2 * padding - kernel_size) // stride + 1
        w = (input_shape[2] + 2 * padding - kernel_size) // stride + 1
        
        return [out_channels, h, w]
    
    elif node_type in ["relu", "leaky_relu", "sigmoid", "tanh", "gelu"]:
        return input_shape
    
    elif node_type == "softmax":
        return input_shape
    
    elif node_type == "flatten":
        total = 1
        for dim in input_shape:
            total *= dim
        return [total]
    
    elif node_type == "dropout":
        return input_shape
    
    elif node_type == "batch_norm":
        num_features = params.get("num_features", 64)
        if len(input_shape) > 0 and input_shape[0] != num_features:
            raise ValueError(f"BatchNorm 特征数不匹配：期望 {num_features}，收到 {input_shape[0]}")
        return input_shape
    
    elif node_type == "layer_norm":
        return input_shape
    
    elif node_type in ["max_pool2d", "avg_pool2d"]:
        kernel_size = params.get("kernel_size", 2)
        stride = params.get("stride", 2)
        
        if len(input_shape) < 3:
            return input_shape
        
        h = (input_shape[1] - kernel_size) // stride + 1
        w = (input_shape[2] - kernel_size) // stride + 1
        
        return [input_shape[0], max(h, 1), max(w, 1)]
    
    elif node_type == "adaptive_avg_pool2d":
        output_size = params.get("output_size", [1, 1])
        
        if len(input_shape) < 3:
            return input_shape
        
        return [input_shape[0], *output_size]
    
    elif node_type == "lstm" or node_type == "gru":
        hidden_size = params.get("hidden_size", 256)
        return [hidden_size]
    
    elif node_type == "embedding":
        embedding_dim = params.get("embedding_dim", 300)
        return [embedding_dim]
    
    elif node_type == "multihead_attention":
        embed_dim = params.get("embed_dim", 512)
        return [embed_dim]
    
    elif node_type == "transformer_encoder":
        d_model = params.get("d_model", 512)
        return [d_model]
    
    elif node_type == "concat":
        return input_shape

    elif node_type == "add":
        return input_shape

    elif node_type == "block":
        # Block 是容器，不改变形状
        return input_shape

    elif node_type == "reshape":
        shape = params.get("shape", input_shape)
        if isinstance(shape, list):
            return shape
        return input_shape

    else:
        raise ValueError(f"未知的层类型: {node_type}")