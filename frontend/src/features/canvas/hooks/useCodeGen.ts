import { useCallback } from 'react'
import { useCanvasStore } from '../store/canvasStore'
import { api } from '@/lib/api'

export function useCodeGen() {
  const nodes = useCanvasStore((state) => state.nodes)

  const generateCode = useCallback(async () => {
    try {
      const result = await api.post('/api/codegen', { nodes })
      
      if (result.ok && result.data) {
        return result.data
      }
      
      return null
    } catch (error) {
      console.error('Code generation failed:', error)
      return null
    }
  }, [nodes])

  return { generateCode }
}