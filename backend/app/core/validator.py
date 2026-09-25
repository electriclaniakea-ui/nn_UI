from typing import Any
from .graph import Graph

def validate_graph(graph: Graph) -> tuple[list[dict], list | None, list[dict]]:
    errors = []
    node_shapes = []

    if graph.has_cycle():
        errors.append({
            "node_index": 0,
            "node_type": "graph",
            "error": "图中存在环路",
        })
        return errors, None, node_shapes

    # 使用原始节点顺序（与前端一致），而不是拓扑排序
    # 前端节点按数组顺序排列，边表示连接关系
    sorted_nodes = graph.nodes
    print(f"[validate_graph] nodes count: {len(sorted_nodes)}")
    for idx, n in enumerate(sorted_nodes):
        print(f"[validate_graph] node {idx}: type={n.type}, params={n.params}")

    # 从第一个 input 层读取初始形状，如果没有则默认 [784]
    current_shape = [784]
    for node in sorted_nodes:
        if node.type == "input":
            shape = node.params.get("shape", [784])
            if isinstance(shape, list):
                current_shape = shape
            elif isinstance(shape, int):
                current_shape = [shape]
            print(f"[validate_graph] input shape: {current_shape}")
            break

    for i, node in enumerate(sorted_nodes):
        try:
            from .shape import infer_shape
            print(f"[validate_graph] processing node {i}: {node.type}, params={node.params}, input_shape={current_shape}")
            input_shape = list(current_shape)

            # 如果是 block 类型，展开内部层进行验证
            if node.type == "block" and node.params.get("blockData"):
                block_data = node.params["blockData"]
                block_layers = block_data.get("layers", [])
                if block_layers:
                    # 记录 block 的输入形状
                    block_input_shape = list(current_shape)
                    # 逐层验证 block 内部
                    for bl_idx, bl in enumerate(block_layers):
                        bl_type = bl.get("type", "")
                        bl_params = bl.get("params", {})
                        current_shape = infer_shape(bl_type, bl_params, current_shape)
                        print(f"[validate_graph] block internal layer {bl_idx} ({bl_type}) output shape: {current_shape}")
                    # Block 节点的形状信息：输入是 block 的输入，输出是最后一层的输出
                    node_shapes.append({
                        "node_index": i,
                        "node_type": node.type,
                        "input_shape": block_input_shape,
                        "output_shape": list(current_shape),
                    })
                    continue

            current_shape = infer_shape(node.type, node.params, current_shape)
            print(f"[validate_graph] node {i} output shape: {current_shape}")
            
            node_shapes.append({
                "node_index": i,
                "node_type": node.type,
                "input_shape": input_shape,
                "output_shape": list(current_shape),
            })
        except Exception as e:
            print(f"[validate_graph] node {i} error: {e}")
            errors.append({
                "node_index": i,
                "node_type": node.type,
                "error": str(e),
            })
            node_shapes.append({
                "node_index": i,
                "node_type": node.type,
                "input_shape": list(current_shape) if current_shape else [],
                "output_shape": [],
                "error": str(e),
            })

    output_shape = current_shape if not errors else None
    print(f"[validate_graph] errors: {errors}, output_shape: {output_shape}")

    return errors, output_shape, node_shapes

def check_connectivity(graph: Graph) -> list[dict]:
    errors = []
    
    if len(graph.nodes) == 0:
        return errors
    
    visited = set()
    queue = [graph.nodes[0].id]
    
    while queue:
        node_id = queue.pop(0)
        if node_id in visited:
            continue
        
        visited.add(node_id)
        
        for edge in graph.edges:
            if edge.source == node_id and edge.target not in visited:
                queue.append(edge.target)
    
    for node in graph.nodes:
        if node.id not in visited:
            errors.append({
                "node_index": graph.nodes.index(node) + 1,
                "node_type": node.type,
                "error": f"节点 {node.id} 与主图断开连接",
            })
    
    return errors