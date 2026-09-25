import { useState, useRef } from 'react'
import { useCanvasStore, type BlockDefinition, type BlockLayerNode } from '../store/canvasStore'
import { X, Plus, Trash2, GripHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AddLayerDialog } from './AddLayerDialog'

interface BlockEditorProps {
  onClose: () => void
}

export function BlockEditor({ onClose }: BlockEditorProps) {
  const {
    layers,
    editingBlockId,
    updateBlockLayer,
    addBlockLayer,
    removeBlockLayer,
    moveBlockLayer,
    updateNodeData,
  } = useCanvasStore()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const dragStateRef = useRef<{ startX: number; nodeStartX: number }>({ startX: 0, nodeStartX: 0 })

  const blockLayer = layers.find(l => l.id === editingBlockId)
  const blockData: BlockDefinition | undefined = blockLayer?.blockData

  if (!blockData) {
    console.error('[BlockEditor] blockData not found:', { editingBlockId, blockLayer, layersCount: layers.length })
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
        <div className="bg-bg-panel rounded-xl shadow-2xl p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-2">⚠️ 错误</h2>
          <p className="text-text-secondary">无法加载 Block 数据</p>
          <p className="text-text-tertiary text-sm mt-1">editingBlockId: {editingBlockId}</p>
          <p className="text-text-tertiary text-sm">blockLayer found: {blockLayer ? '是' : '否'}</p>
          <Button onClick={onClose} className="mt-4">关闭</Button>
        </div>
      </div>
    )
  }

  const NODE_SIZE = 80
  const NODE_GAP = 48
  const START_X = 40
  const START_Y = 80

  const handleMouseDown = (e: React.MouseEvent, layerId: string) => {
    if (e.button !== 0) return
    const idx = blockData.layers.findIndex(l => l.id === layerId)
    dragStateRef.current = {
      startX: e.clientX,
      nodeStartX: START_X + idx * (NODE_SIZE + NODE_GAP),
    }
    setDraggingId(layerId)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId) return
    const deltaX = e.clientX - dragStateRef.current.startX
    const newX = dragStateRef.current.nodeStartX + deltaX
    const targetIndex = Math.round((newX - START_X - NODE_SIZE / 2) / (NODE_SIZE + NODE_GAP))
    const clampedTarget = Math.max(0, Math.min(targetIndex, blockData.layers.length - 1))
    const currentIndex = blockData.layers.findIndex(l => l.id === draggingId)
    if (clampedTarget !== currentIndex) {
      moveBlockLayer(editingBlockId!, draggingId, clampedTarget)
    }
  }

  const handleMouseUp = () => {
    setDraggingId(null)
  }

  const handleBlockNameChange = (name: string) => {
    if (blockLayer) {
      updateNodeData(blockLayer.id, {
        params: { ...blockLayer.params, name }
      })
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-bg-panel rounded-xl shadow-2xl flex flex-col animate-zoom-in"
        style={{ width: '90vw', maxWidth: '1000px', height: '85vh', maxHeight: '700px' }}
      >
        {/* Header */}
        <div className="h-14 border-b border-layer-border flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-text-primary">📦 编辑 Block</h2>
            <input
              className="text-sm bg-bg-canvas border border-layer-border rounded px-2 py-1 text-text-primary"
              value={blockData.name}
              onChange={(e) => handleBlockNameChange(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Canvas */}
        <div
          className="flex-1 bg-bg-canvas relative overflow-auto"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="relative p-8" style={{ minHeight: '100%' }}>
            {/* Block background */}
            <div
              className="absolute rounded-2xl border-2 border-dashed border-accent/30 bg-accent/5"
              style={{
                left: 20,
                top: 40,
                width: Math.max(200, blockData.layers.length * (NODE_SIZE + NODE_GAP) + 80),
                height: NODE_SIZE + 80,
              }}
            />

            {/* Layers */}
            {blockData.layers.map((layer, index) => (
              <BlockLayerNodeComponent
                key={layer.id}
                layer={layer}
                index={index}
                isDragging={draggingId === layer.id}
                onMouseDown={handleMouseDown}
                onUpdate={(data) => updateBlockLayer(editingBlockId!, layer.id, data)}
                onRemove={() => removeBlockLayer(editingBlockId!, layer.id)}
              />
            ))}

            {/* Add Button */}
            <button
              className="absolute w-10 h-10 rounded-full bg-accent text-white text-xl flex items-center justify-center hover:scale-110 transition-transform"
              style={{
                left: START_X + blockData.layers.length * (NODE_SIZE + NODE_GAP),
                top: START_Y + NODE_SIZE / 2 - 20,
              }}
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="h-12 border-t border-layer-border flex items-center justify-between px-6 shrink-0">
          <span className="text-xs text-text-tertiary">
            {blockData.layers.length} 层 | 拖拽调整顺序 | 点击编辑参数
          </span>
          <Button onClick={onClose} size="sm">完成</Button>
        </div>
      </div>

      <AddLayerDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSelect={(type, params) => {
          addBlockLayer(editingBlockId!, type, params)
          setIsAddDialogOpen(false)
        }}
      />
    </div>
  )
}

function BlockLayerNodeComponent({
  layer,
  index,
  isDragging,
  onMouseDown,
  onUpdate,
  onRemove,
}: {
  layer: BlockLayerNode
  index: number
  isDragging: boolean
  onMouseDown: (e: React.MouseEvent, id: string) => void
  onUpdate: (data: any) => void
  onRemove: () => void
}) {
  const NODE_SIZE = 80
  const NODE_GAP = 48
  const START_X = 40
  const START_Y = 80

  const getParamDisplay = () => {
    const params = layer.params || {}
    switch (layer.type) {
      case 'linear': return `${params.in_features || '?'}→${params.out_features || '?'}`
      case 'conv2d': return `${params.in_channels || '?'}→${params.out_channels || '?'}`
      case 'input': return `[${(params.shape || []).join(', ')}]`
      case 'dropout': return `p=${params.p || '?'}`
      default: return ''
    }
  }

  return (
    <div
      className={`absolute cursor-grab select-none transition-all duration-150 ${
        isDragging ? 'z-50 scale-110' : 'hover:scale-105'
      }`}
      style={{
        left: START_X + index * (NODE_SIZE + NODE_GAP),
        top: START_Y,
        width: NODE_SIZE,
        height: NODE_SIZE,
      }}
      onMouseDown={(e) => onMouseDown(e, layer.id)}
    >
      <div className="w-full h-full relative">
        {/* Diamond shape */}
        <div
          className="w-full h-full shadow-md"
          style={{
            background: 'linear-gradient(135deg, #FFFCF6 0%, #EFE7D8 100%)',
            border: '1px solid #D8CDB8',
            borderRadius: '4px',
            transform: 'rotate(45deg)',
          }}
        />
        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] text-text-secondary font-semibold">{layer.type}</span>
          <span className="text-[9px] text-text-secondary">{getParamDisplay()}</span>
          <span className="text-[8px] text-text-tertiary">#{index + 1}</span>
        </div>
        {/* Remove button */}
        <button
          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
          onClick={(e) => { e.stopPropagation(); onRemove() }}
        >
          <Trash2 className="h-3 w-3" />
        </button>
        {/* Drag handle */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-text-tertiary opacity-50">
          <GripHorizontal className="h-3 w-3" />
        </div>
      </div>
    </div>
  )
}