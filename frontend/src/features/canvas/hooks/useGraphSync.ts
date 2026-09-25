import { useEffect, useRef } from 'react'
import { useCanvasStore } from '../store/canvasStore'
import { api } from '@/lib/api'
import { DEBOUNCE_DELAY } from '@/lib/constants'

export function useGraphSync() {
  const nodes = useCanvasStore((state) => state.nodes)
  const errors = useCanvasStore((state) => state.errors)
  const addError = useCanvasStore((state) => state.addError)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        const result = await api.post('/api/graph', { nodes })
        
        if (result.ok && result.data) {
          const data = result.data as { errors?: Array<{ node_index: number; node_type: string; error: string }> }
          if (data.errors && data.errors.length > 0) {
            data.errors.forEach((err) => {
              addError(`节点 #${err.node_index} ${err.node_type}: ${err.error}`)
            })
          }
        }
      } catch (error) {
        console.error('Graph sync failed:', error)
      }
    }, DEBOUNCE_DELAY)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [nodes, errors, addError])
}