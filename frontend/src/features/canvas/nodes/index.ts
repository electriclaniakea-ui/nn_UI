import { InputNode } from './InputNode'
import { LinearNode } from './LinearNode'
import { Conv2dNode } from './Conv2dNode'
import { ReLUNode } from './ReLUNode'
import { LeakyReLUNode } from './LeakyReLUNode'
import { SigmoidNode } from './SigmoidNode'
import { TanhNode } from './TanhNode'
import { GELUNode } from './GELUNode'
import { SoftmaxNode } from './SoftmaxNode'
import { BatchNormNode } from './BatchNormNode'
import { LayerNormNode } from './LayerNormNode'
import { DropoutNode } from './DropoutNode'
import { MaxPool2dNode } from './MaxPool2dNode'
import { AvgPool2dNode } from './AvgPool2dNode'
import { AdaptiveAvgPool2dNode } from './AdaptiveAvgPool2dNode'
import { FlattenNode } from './FlattenNode'
import { ReshapeNode } from './ReshapeNode'
import { ConcatNode } from './ConcatNode'
import { AddNode } from './AddNode'
import { LSTMNode } from './LSTMNode'
import { GRUNode } from './GRUNode'
import { EmbeddingNode } from './EmbeddingNode'
import { MultiheadAttentionNode } from './MultiheadAttentionNode'
import { TransformerEncoderNode } from './TransformerEncoderNode'
import { BlockNode } from './BlockNode'

export const nodeTypes = {
  input: InputNode,
  output: InputNode,
  linear: LinearNode,
  conv2d: Conv2dNode,
  relu: ReLUNode,
  leaky_relu: LeakyReLUNode,
  sigmoid: SigmoidNode,
  tanh: TanhNode,
  gelu: GELUNode,
  softmax: SoftmaxNode,
  batch_norm: BatchNormNode,
  layer_norm: LayerNormNode,
  dropout: DropoutNode,
  max_pool2d: MaxPool2dNode,
  avg_pool2d: AvgPool2dNode,
  adaptive_avg_pool2d: AdaptiveAvgPool2dNode,
  flatten: FlattenNode,
  reshape: ReshapeNode,
  concat: ConcatNode,
  add: AddNode,
  lstm: LSTMNode,
  gru: GRUNode,
  embedding: EmbeddingNode,
  multihead_attention: MultiheadAttentionNode,
  transformer_encoder: TransformerEncoderNode,
  block: BlockNode,
}

export type NodeType = keyof typeof nodeTypes