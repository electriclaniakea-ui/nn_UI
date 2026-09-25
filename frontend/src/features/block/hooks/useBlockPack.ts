import { useState, useCallback } from 'react'
import { useCanvasStore } from '@/features/canvas/store/canvasStore'
import type { BlockSchema, BlockInfo } from '@/types/block'

export function useBlockPack() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([])
  const [blocks, setBlocks] = useState<BlockInfo[]>([])
  
  const { nodes, removeNode, addNode } = useCanvasStore()
  const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8765'

  const initiatePack = useCallback((nodeIds: string[]) => {
    setSelectedNodeIds(nodeIds)
    setIsDialogOpen(true)
  }, [])

  const confirmPack = useCallback(async (name: string) => {
    try {
      const blockNodes = nodes.filter(n => selectedNodeIds.includes(n.id))
      
      const blockData: BlockSchema = {
        id: `block-${Date.now()}`,
        name,
        nodes: selectedNodeIds,
        inputPorts: 1,
        outputPorts: 1,
        isCollapsed: true,
      }

      const response = await fetch(`${apiBase}/api/blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blockData),
      })

      if (response.ok) {
        for (const nodeId of selectedNodeIds) {
          removeNode(nodeId)
        }

        addNode('block', { name, layerCount: blockNodes.length })

        setBlocks(prev => [...prev, {
          name,
          layerCount: blockNodes.length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }])
      }
    } catch (error) {
      console.error('Failed to pack block:', error)
    } finally {
      setIsDialogOpen(false)
      setSelectedNodeIds([])
    }
  }, [nodes, selectedNodeIds, removeNode, addNode, apiBase])

  const loadBlocks = useCallback(async () => {
    try {
      const response = await fetch(`${apiBase}/api/blocks`)
      if (response.ok) {
        const data = await response.json()
        setBlocks(data.blocks || [])
      }
    } catch (error) {
      console.error('Failed to load blocks:', error)
    }
  }, [apiBase])

  return {
    isDialogOpen,
    setIsDialogOpen,
    initiatePack,
    confirmPack,
    blocks,
    loadBlocks,
  }
}