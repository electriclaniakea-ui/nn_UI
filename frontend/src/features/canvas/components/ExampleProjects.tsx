import { useCanvasStore } from '../store/canvasStore'
import { BookOpen, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ExampleProjectsProps {
  onClose: () => void
}

interface ExampleProject {
  name: string
  description: string
  icon: string
  layers: Array<{ type: string; params: Record<string, any> }>
}

const EXAMPLES: ExampleProject[] = [
  {
    name: 'MNIST MLP',
    description: '用于手写数字识别的简单多层感知机',
    icon: '🔢',
    layers: [
      { type: 'input', params: { shape: [1, 28, 28] } },
      { type: 'flatten', params: {} },
      { type: 'linear', params: { in_features: 784, out_features: 256, bias: true } },
      { type: 'relu', params: {} },
      { type: 'dropout', params: { p: 0.2 } },
      { type: 'linear', params: { in_features: 256, out_features: 128, bias: true } },
      { type: 'relu', params: {} },
      { type: 'dropout', params: { p: 0.2 } },
      { type: 'linear', params: { in_features: 128, out_features: 10, bias: true } },
      { type: 'output', params: { num_classes: 10 } },
    ],
  },
  {
    name: 'CIFAR-10 CNN',
    description: '用于图像分类的卷积神经网络',
    icon: '🖼️',
    layers: [
      { type: 'input', params: { shape: [3, 32, 32] } },
      { type: 'conv2d', params: { in_channels: 3, out_channels: 32, kernel_size: 3, stride: 1, padding: 1 } },
      { type: 'batch_norm', params: { num_features: 32 } },
      { type: 'max_pool2d', params: { kernel_size: 2, stride: 2 } },
      { type: 'conv2d', params: { in_channels: 32, out_channels: 64, kernel_size: 3, stride: 1, padding: 1 } },
      { type: 'batch_norm', params: { num_features: 64 } },
      { type: 'max_pool2d', params: { kernel_size: 2, stride: 2 } },
      { type: 'conv2d', params: { in_channels: 64, out_channels: 128, kernel_size: 3, stride: 1, padding: 1 } },
      { type: 'batch_norm', params: { num_features: 128 } },
      { type: 'max_pool2d', params: { kernel_size: 2, stride: 2 } },
      { type: 'flatten', params: {} },
      { type: 'linear', params: { in_features: 2048, out_features: 256, bias: true, activation: 'relu' } },
      { type: 'dropout', params: { p: 0.5 } },
      { type: 'linear', params: { in_features: 256, out_features: 10, bias: true, activation: 'none' } },
      { type: 'output', params: { num_classes: 10 } },
    ],
  },
  {
    name: '简单 Transformer',
    description: '用于序列建模的 Transformer 编码器',
    icon: '⚡',
    layers: [
      { type: 'input', params: { shape: [512] } },
      { type: 'embedding', params: { num_embeddings: 10000, embedding_dim: 512 } },
      { type: 'multihead_attention', params: { embed_dim: 512, num_heads: 8 } },
      { type: 'layer_norm', params: { normalized_shape: [512] } },
      { type: 'linear', params: { in_features: 512, out_features: 2048, bias: true, activation: 'relu' } },
      { type: 'dropout', params: { p: 0.1 } },
      { type: 'linear', params: { in_features: 2048, out_features: 512, bias: true, activation: 'none' } },
      { type: 'layer_norm', params: { normalized_shape: [512] } },
      { type: 'linear', params: { in_features: 512, out_features: 10000, bias: true, activation: 'none' } },
      { type: 'output', params: { num_classes: 10000 } },
    ],
  },
]

export function ExampleProjects({ onClose }: ExampleProjectsProps) {
  const { clearAll, addNode } = useCanvasStore()

  const loadExample = (example: ExampleProject) => {
    if (
      useCanvasStore.getState().layers.length > 0 &&
      !confirm(`加载 "${example.name}" 将替换当前画布内容，是否继续？`)
    ) {
      return
    }

    // 清空当前画布
    clearAll()

    // 逐个添加层
    setTimeout(() => {
      example.layers.forEach((layer) => {
        addNode(layer.type, layer.params)
      })
    }, 100)

    onClose()
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
    >
      <div
        className="bg-bg-panel rounded-xl shadow-2xl flex flex-col animate-zoom-in"
        style={{ width: '90vw', maxWidth: '600px', height: 'auto', maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="h-14 border-b border-layer-border flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-text-primary">示例项目</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-sm text-text-secondary mb-4">
            选择一个示例项目快速开始，或作为学习参考。
          </p>
          <div className="space-y-3">
            {EXAMPLES.map((example) => (
              <button
                key={example.name}
                onClick={() => loadExample(example)}
                className="w-full text-left p-4 border border-layer-border rounded-lg hover:border-accent hover:bg-accent/5 transition-all duration-200 group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{example.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
                      {example.name}
                    </h3>
                    <p className="text-xs text-text-secondary mt-1">
                      {example.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] px-2 py-0.5 bg-bg-canvas rounded text-text-tertiary">
                        {example.layers.length} 层
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-bg-canvas rounded text-text-tertiary">
                        {example.layers.filter(l => l.type === 'conv2d').length > 0 ? 'CNN' : 'MLP'}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="h-14 border-t border-layer-border flex items-center justify-end px-6 shrink-0">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
        </div>
      </div>
    </div>
  )
}