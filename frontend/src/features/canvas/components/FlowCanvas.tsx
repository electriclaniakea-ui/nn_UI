import { useCallback } from 'react'
import { useCanvasStore, getMidpointBetweenNodes } from '../store/canvasStore'
import { BaseNode } from '../nodes/BaseNode'
import { TensorShapeVisualizer } from './TensorShapeVisualizer'

export function FlowCanvas() {
  const { nodes, layers, selectNode, addNode } = useCanvasStore()

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      selectNode(null)
    }
  }, [selectNode])

  const handleAddNode = useCallback(() => {
    addNode('linear', {})
  }, [addNode])

  return (
    <div 
      className="flex-1 bg-bg-canvas relative overflow-auto"
      onClick={handleCanvasClick}
    >
      <div className="min-w-full min-h-full p-8 relative">
        {/* 渲染节点 */}
        {nodes.map((node, index) => (
          <BaseNode 
            key={node.id} 
            node={{ ...node, data: { ...node.data, index } }} 
          />
        ))}

        {/* 渲染节点间的张量形状可视化点 */}
        {layers.map((_, index) => {
          const midpoint = getMidpointBetweenNodes(layers, index)
          if (!midpoint) return null

          return (
            <TensorShapeVisualizer
              key={`shape-${index}`}
              nodeIndex={index}
              position={midpoint}
            />
          )
        })}
        
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-text-secondary text-lg mb-4">
                画布为空
              </p>
              <button
                onClick={handleAddNode}
                className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                添加第一个层
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}