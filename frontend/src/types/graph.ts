export interface NodeData {
  label: string;
  type: string;
  params: Record<string, any>;
  inputShape?: string[];
  outputShape?: string[];
  index: number;
  hasError?: boolean;
}

export interface EdgeData {
  label?: string;
}

export type NodeType = 'input' | 'output' | 'linear' | 'conv2d' | 'relu' | 'leaky_relu' 
  | 'sigmoid' | 'tanh' | 'gelu' | 'softmax' | 'batch_norm' | 'layer_norm'
  | 'dropout' | 'max_pool2d' | 'avg_pool2d' | 'adaptive_avg_pool2d' | 'flatten'
  | 'reshape' | 'concat' | 'add' | 'lstm' | 'gru' | 'embedding'
  | 'multihead_attention' | 'transformer_encoder' | 'block';

export interface LayerNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: NodeData;
}