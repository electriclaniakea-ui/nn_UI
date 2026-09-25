import { useState } from 'react'
import { Search, ChevronDown, ChevronRight } from 'lucide-react'
import { useCanvasStore } from '../store/canvasStore'
import { DEFAULT_PARAMS } from '@/lib/constants'

const LAYER_CATEGORIES: Record<string, string[]> = {
  'IO节点': ['input', 'output'],
  '基础层': ['linear', 'conv2d'],
  '归一化': ['batch_norm', 'layer_norm'],
  '正则化': ['dropout'],
  '池化层': ['max_pool2d', 'avg_pool2d', 'adaptive_avg_pool2d'],
  '形状变换': ['flatten', 'reshape'],
  '循环网络': ['lstm', 'gru'],
  '嵌入层': ['embedding'],
  '注意力': ['multihead_attention', 'transformer_encoder'],
  '组合': ['concat', 'add'],
  '容器': ['block'],
}

const LAYER_ICONS: Record<string, string> = {
  input: '▸',
  output: '▸',
  linear: '═',
  conv2d: '▦',
  batch_norm: '⚖',
  layer_norm: '⚖',
  dropout: '✕',
  max_pool2d: '▼',
  avg_pool2d: '▼',
  adaptive_avg_pool2d: '▼',
  flatten: '▭',
  reshape: '▭',
  lstm: '↻',
  gru: '↻',
  embedding: '⊡',
  multihead_attention: '👁',
  transformer_encoder: '🔀',
  concat: '∥',
  add: '+',
  block: '◫',
}

interface AddLayerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect?: (type: string, params: Record<string, any>) => void
}

export function AddLayerDialog({ open, onOpenChange, onSelect }: AddLayerDialogProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({
    '循环网络': true,
    '嵌入层': true,
    '注意力': true,
    '组合': true,
  })
  const { addNode } = useCanvasStore()

  if (!open) return null

  const handleAddLayer = (type: string) => {
    // 传入默认参数，让 addNode 中的 inferParamsFromPrev 在此基础上推断
    const defaultParams = DEFAULT_PARAMS[type] || {}
    if (onSelect) {
      onSelect(type, { ...defaultParams })
    } else {
      addNode(type, { ...defaultParams })
    }
    onOpenChange(false)
    setSearchTerm('')
  }

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const filteredCategories = Object.entries(LAYER_CATEGORIES).reduce((acc, [category, layers]) => {
    const filteredLayers = layers.filter(layer =>
      layer.toLowerCase().includes(searchTerm.toLowerCase())
    )
    if (filteredLayers.length > 0) {
      acc.push([category, filteredLayers])
    }
    return acc
  }, [] as [string, string[]][])

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={() => onOpenChange(false)}
      />

      {/* Popover Panel - positioned near the add button */}
      <div
        className="fixed left-20 top-16 z-50 bg-bg-panel border border-layer-border rounded-lg shadow-xl w-[280px] max-h-[70vh] flex flex-col animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search */}
        <div className="p-3 border-b border-layer-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
            <input
              type="text"
              placeholder="搜索层..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-layer-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-bg-canvas text-text-primary placeholder:text-text-tertiary"
              autoFocus
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex-1 overflow-y-auto py-2">
          {filteredCategories.length === 0 ? (
            <div className="text-center text-text-tertiary py-6 text-sm">
              未找到匹配的层
            </div>
          ) : (
            filteredCategories.map(([category, layers]) => {
              const isCollapsed = collapsedCategories[category] && !searchTerm
              return (
                <div key={category} className="px-2">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-bg-canvas transition-colors"
                  >
                    <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      {category}
                    </span>
                    {!searchTerm && (
                      isCollapsed ? (
                        <ChevronRight className="h-3 w-3 text-text-tertiary" />
                      ) : (
                        <ChevronDown className="h-3 w-3 text-text-tertiary" />
                      )
                    )}
                  </button>

                  {!isCollapsed && (
                    <div className="grid grid-cols-2 gap-1 px-2 pb-2">
                      {layers.map(layer => (
                        <button
                          key={layer}
                          onClick={() => handleAddLayer(layer)}
                          className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm text-text-primary hover:bg-layer-hover hover:text-accent transition-all duration-150 text-left"
                          title={layer}
                        >
                          <span className="text-text-tertiary text-xs w-4 text-center">
                            {LAYER_ICONS[layer] || '•'}
                          </span>
                          <span className="truncate">{layer}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer hint */}
        <div className="px-3 py-2 border-t border-layer-border text-xs text-text-tertiary text-center">
          点击层类型添加到画布
        </div>
      </div>
    </>
  )
}