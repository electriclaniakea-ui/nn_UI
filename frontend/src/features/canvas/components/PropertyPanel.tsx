import { X, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useCanvasStore, selectedNodeSelector } from '../store/canvasStore'
import { Button } from '@/components/ui/button'
import { DEFAULT_PARAMS } from '@/lib/constants'

interface PropertyPanelProps {
  onClose: () => void
}

// 参数分组配置
const PARAM_GROUPS: Record<string, string[]> = {
  '维度参数': ['in_features', 'out_features', 'in_channels', 'out_channels', 'input_size', 'hidden_size', 'num_layers', 'embed_dim', 'd_model', 'nhead', 'num_heads', 'num_embeddings', 'embedding_dim', 'num_features', 'normalized_shape', 'shape', 'dim', 'num_classes'],
  '卷积参数': ['kernel_size', 'stride', 'padding', 'output_size'],
  '概率参数': ['p', 'negative_slope'],
  '布尔参数': ['bias', 'batch_first'],
  '其他参数': []
}

function getParamGroup(key: string): string {
  for (const [group, keys] of Object.entries(PARAM_GROUPS)) {
    if (keys.includes(key)) return group
  }
  return '其他参数'
}

function getParamLabel(key: string): string {
  const labels: Record<string, string> = {
    in_features: '输入特征',
    out_features: '输出特征',
    in_channels: '输入通道',
    out_channels: '输出通道',
    kernel_size: '核大小',
    stride: '步长',
    padding: '填充',
    bias: '偏置',
    p: '丢弃率',
    num_features: '特征数',
    normalized_shape: '归一化形状',
    negative_slope: '负斜率',
    dim: '维度',
    shape: '形状',
    input_size: '输入大小',
    hidden_size: '隐藏层大小',
    num_layers: '层数',
    batch_first: '批次优先',
    num_embeddings: '嵌入数量',
    embedding_dim: '嵌入维度',
    embed_dim: '嵌入维度',
    num_heads: '头数',
    d_model: '模型维度',
    nhead: '注意力头数',
    output_size: '输出大小',
    num_classes: '类别数',
  }
  return labels[key] || key
}

export function PropertyPanel({ onClose }: PropertyPanelProps) {
  const selectedNode = useCanvasStore(selectedNodeSelector)
  const { updateNodeData, resetNodeParams } = useCanvasStore()
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})

  if (!selectedNode) return null

  const nodeType = selectedNode.type
  const defaultParams = DEFAULT_PARAMS[nodeType] || {}
  const currentParams = selectedNode.data.params || {}

  console.log('[PropertyPanel] selectedNode:', selectedNode.id, 'type:', nodeType, 'params:', currentParams)

  // 按分组组织参数
  const groupedParams: Record<string, [string, any][]> = {}
  Object.entries(currentParams).forEach(([key, value]) => {
    const group = getParamGroup(key)
    if (!groupedParams[group]) groupedParams[group] = []
    groupedParams[group].push([key, value])
  })

  // 过滤空分组
  const nonEmptyGroups = Object.entries(groupedParams).filter(([, params]) => params.length > 0)

  const handleParamChange = (key: string, value: any) => {
    updateNodeData(selectedNode.id, {
      params: {
        ...currentParams,
        [key]: value
      }
    })
  }

  const handleReset = () => {
    if (confirm('确定要恢复默认参数吗？')) {
      resetNodeParams(selectedNode.id, defaultParams)
    }
  }

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }))
  }

  const renderInput = (key: string, value: any) => {
    const defaultValue = defaultParams[key]
    const isModified = JSON.stringify(value) !== JSON.stringify(defaultValue)
    const baseClasses = `px-2 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-bg-canvas
      ${isModified ? 'border-accent text-accent' : 'border-layer-border text-text-primary'}`

    // Activation dropdown for linear layers
    if (key === 'activation') {
      return (
        <select
          value={String(value)}
          onChange={(e) => handleParamChange(key, e.target.value)}
          className={`w-32 ${baseClasses}`}
        >
          <option value="relu">ReLU</option>
          <option value="leaky_relu">LeakyReLU</option>
          <option value="sigmoid">Sigmoid</option>
          <option value="tanh">Tanh</option>
          <option value="gelu">GELU</option>
          <option value="softmax">Softmax</option>
          <option value="none">None</option>
        </select>
      )
    }

    if (typeof value === 'boolean') {
      return (
        <select
          value={value ? 'true' : 'false'}
          onChange={(e) => handleParamChange(key, e.target.value === 'true')}
          className={`w-32 ${baseClasses}`}
        >
          <option value="true">是</option>
          <option value="false">否</option>
        </select>
      )
    }

    if (Array.isArray(value)) {
      // 对于 shape 参数，提供维度输入框
      if (key === 'shape' || key === 'normalized_shape') {
        return (
          <div className="flex items-center gap-1">
            <span className="text-text-secondary">[</span>
            {value.map((v: number, i: number) => (
              <input
                key={i}
                type="number"
                value={v}
                onChange={(e) => {
                  const newValue = [...value]
                  newValue[i] = parseInt(e.target.value) || 0
                  handleParamChange(key, newValue)
                }}
                className={`w-14 ${baseClasses} text-center`}
              />
            ))}
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => handleParamChange(key, [...value, 1])}
                className="px-1 py-0 text-xs bg-bg-canvas border border-layer-border rounded hover:bg-accent hover:text-white transition-colors"
                title="添加维度"
              >
                +
              </button>
              {value.length > 1 && (
                <button
                  onClick={() => handleParamChange(key, value.slice(0, -1))}
                  className="px-1 py-0 text-xs bg-bg-canvas border border-layer-border rounded hover:bg-red-500 hover:text-white transition-colors"
                  title="删除维度"
                >
                  -
                </button>
              )}
            </div>
            <span className="text-text-secondary">]</span>
          </div>
        )
      }
      return (
        <input
          type="text"
          value={JSON.stringify(value)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value)
              handleParamChange(key, parsed)
            } catch {
              // 忽略无效输入
            }
          }}
          className={`flex-1 ${baseClasses} font-mono`}
        />
      )
    }

    if (typeof value === 'number') {
      return (
        <input
          type="number"
          value={value}
          onChange={(e) => handleParamChange(key, parseFloat(e.target.value))}
          className={`w-24 ${baseClasses}`}
        />
      )
    }

    return (
      <input
        type="text"
        value={String(value)}
        onChange={(e) => handleParamChange(key, e.target.value)}
        className={`flex-1 ${baseClasses}`}
      />
    )
  }

  return (
    <div className="w-80 bg-bg-panel border-l border-layer-border flex flex-col shadow-lg animate-slide-in-right">
      {/* Header */}
      <div className="h-12 border-b border-layer-border flex items-center justify-between px-4">
        <h3 className="font-semibold text-text-primary">
          属性 - {selectedNode.data.label}
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* 基本信息 */}
        <div className="p-4 border-b border-layer-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-text-secondary">节点名称</span>
            <input
              type="text"
              value={selectedNode.data.label}
              onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
              className="flex-1 ml-4 px-2 py-1.5 border border-layer-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-bg-canvas text-text-primary text-right"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">类型</span>
            <span className="text-sm text-text-primary font-mono">{nodeType}</span>
          </div>
        </div>

        {/* 参数分组 */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-text-primary">参数设置</h4>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-xs text-text-secondary hover:text-accent transition-colors px-2 py-1 rounded hover:bg-bg-canvas"
              title="恢复默认参数"
            >
              <RotateCcw className="h-3 w-3" />
              恢复默认
            </button>
          </div>

          {nonEmptyGroups.length === 0 ? (
            <p className="text-sm text-text-tertiary italic">该节点无参数</p>
          ) : (
            nonEmptyGroups.map(([group, params]) => {
              const isCollapsed = collapsedGroups[group]
              return (
                <div key={group} className="border border-layer-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleGroup(group)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-bg-canvas hover:bg-opacity-80 transition-colors"
                  >
                    <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{group}</span>
                    {isCollapsed ? (
                      <ChevronRight className="h-3.5 w-3.5 text-text-tertiary" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-text-tertiary" />
                    )}
                  </button>
                  {!isCollapsed && (
                    <div className="p-3 space-y-2.5">
                      {params.map(([key, value]) => {
                        const defaultValue = defaultParams[key]
                        const isModified = JSON.stringify(value) !== JSON.stringify(defaultValue)
                        return (
                          <div key={key} className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-sm text-text-primary truncate">{getParamLabel(key)}</span>
                              {isModified && (
                                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-accent" title="已修改" />
                              )}
                            </div>
                            <div className="shrink-0">
                              {renderInput(key, value)}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}