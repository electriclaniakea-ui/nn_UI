import { useRef } from 'react'
import { useCanvasStore } from '../store/canvasStore'

interface BaseNodeProps {
  node: {
    id: string
    type: string
    data: {
      label: string
      type: string
      params?: Record<string, any>
      index?: number
    }
    position: {
      x: number
      y: number
    }
  }
}

export function BaseNode({ node }: BaseNodeProps) {
  const nodeRef = useRef<HTMLDivElement>(null)
  const { selectNode, selectedNodeId } = useCanvasStore()
  
  const isSelected = selectedNodeId === node.id
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    selectNode(node.id)
  }

  return (
    <div
      ref={nodeRef}
      className="absolute cursor-pointer transition-all duration-200"
      style={{
        left: node.position.x,
        top: node.position.y,
        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
        zIndex: isSelected ? 10 : 1,
      }}
      onClick={handleClick}
    >
      <div 
        className="relative w-40 h-24 flex items-center justify-center"
        style={{ perspective: '1000px' }}
      >
        <div 
          className={`w-full h-full flex items-center justify-center border-2 rounded-lg shadow-md transition-all duration-200 ${
            isSelected 
              ? 'border-accent shadow-lg' 
              : 'border-layer-border hover:border-accent-soft hover:shadow-lg'
          }`}
          style={{
            background: `linear-gradient(135deg, var(--layer-top) 0%, var(--layer-bottom) 100%)`,
          }}
        >
          <div className="text-center">
            <div className="text-xs font-medium text-text-secondary mb-1">
              {node.data.type}
            </div>
            <div className="text-sm font-bold text-text-primary truncate px-2">
              {node.data.label}
            </div>
            
            {node.data.params && Object.keys(node.data.params).length > 0 && (
              <div className="text-[10px] text-text-secondary mt-1 truncate px-2">
                {Object.entries(node.data.params).slice(0, 2).map(([key, value]) => (
                  <span key={key} className="mr-2">{key}: {value}</span>
                ))}
                {Object.keys(node.data.params).length > 2 && '...'}
              </div>
            )}
          </div>
          
          {isSelected && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full border-2 border-white" />
          )}
        </div>
        
        <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-bg-panel border border-layer-border rounded-full" />
        <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-bg-panel border border-layer-border rounded-full" />
      </div>
    </div>
  )
}