export const PORT = 8765
export const DEFAULT_DEVICE = 'cpu'
export const AUTO_SAVE_INTERVAL = 30000
export const MAX_UNDO_STEPS = 50
export const DEBOUNCE_DELAY = 300

export const LAYER_CATEGORIES = {
  IO: ['input', 'output', 'concat', 'add'],
  layer: ['linear', 'conv2d', 'lstm', 'gru', 'embedding', 'multihead_attention', 'transformer_encoder'],
  activation: ['relu', 'leaky_relu', 'sigmoid', 'tanh', 'gelu', 'softmax'],
  normalization: ['batch_norm', 'layer_norm'],
  regularization: ['dropout'],
  pooling: ['max_pool2d', 'avg_pool2d', 'adaptive_avg_pool2d'],
  reshape: ['flatten', 'reshape'],
} as const

export const DEFAULT_PARAMS: Record<string, Record<string, any>> = {
  linear: { in_features: 128, out_features: 64, bias: true, activation: 'relu' },
  conv2d: { in_channels: 3, out_channels: 64, kernel_size: 3, stride: 1, padding: 1 },
  batch_norm: { num_features: 64 },
  layer_norm: { normalized_shape: [768] },
  dropout: { p: 0.5 },
  max_pool2d: { kernel_size: 2, stride: 2 },
  avg_pool2d: { kernel_size: 2, stride: 2 },
  adaptive_avg_pool2d: { output_size: [1, 1] },
  flatten: {},
  reshape: { shape: [-1] },
  concat: { dim: 1 },
  add: {},
  lstm: { input_size: 128, hidden_size: 256, num_layers: 1, batch_first: true },
  gru: { input_size: 128, hidden_size: 256, num_layers: 1, batch_first: true },
  embedding: { num_embeddings: 10000, embedding_dim: 300 },
  multihead_attention: { embed_dim: 512, num_heads: 8 },
  transformer_encoder: { d_model: 512, nhead: 8, num_layers: 6 },
  input: { shape: [1, 28, 28] },
  output: { num_classes: 10 },
  block: { name: 'Block', layerCount: 0 },
}

export const ACTIVATION_OPTIONS = [
  'ReLU',
  'LeakyReLU',
  'Sigmoid',
  'Tanh',
  'GELU',
  'None',
]

export const OPTIMIZER_OPTIONS = ['Adam', 'SGD', 'RMSprop', 'AdamW']
export const LR_SCHEDULER_OPTIONS = ['StepLR', 'CosineAnnealing', 'ReduceLROnPlateau', 'OneCycle']
export const DATASET_OPTIONS = ['MNIST', 'FashionMNIST', 'CIFAR-10', 'Custom ImageFolder']