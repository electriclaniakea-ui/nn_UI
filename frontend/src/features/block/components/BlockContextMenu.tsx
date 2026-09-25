import { useState, useRef, useEffect } from 'react'
import { Package } from 'lucide-react'
import { useCanvasStore } from '@/features/canvas/store/canvasStore'

interface BlockContextMenuProps {
  nodeId: string
  position: { x: number; y: number }
  onClose: () => void
}

export function BlockContextMenu({ nodeId, position, onClose }: BlockContextMenuProps) {
  const [isOpen, setIsOpen] = useState(true)
  const menuRef = useRef<HTMLDivElement>(null)
  const { nodes, packNodesAsBlock } = useCanvasStore()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setTimeout(onClose, 150)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handlePackAsBlock = () => {
    const selectedNodes = nodes.filter(n => n.id === nodeId)
    if (selectedNodes.length > 0) {
      packNodesAsBlock(selectedNodes.map(n => n.id))
      setIsOpen(false)
      setTimeout(onClose, 150)
    }
  }

  if (!isOpen) return null

  return (
    <div
      ref={menuRef}
      className="fixed bg-bg-panel border border-layer-border rounded-lg shadow-lg py-2 min-w-[200px] z-50"
      style={{ left: position.x, top: position.y }}
    >
      <button
        onClick={handlePackAsBlock}
        className="w-full px-4 py-2 text-left text-sm hover:bg-layer-hover flex items-center gap-3"
      >
        <Package className="h-4 w-4" />
        打包为 Block
      </button>
      
      <div className="border-t border-layer-border my-1" />
      
      <button
        onClick={() => {
          setIsOpen(false)
          setTimeout(onClose, 150)
        }}
        className="w-full px-4 py-2 text-left text-sm hover:bg-layer-hover text-text-secondary"
      >
        取消
      </button>
    </div>
  )
}