import { useEffect } from 'react'
import { useCanvasStore } from '../store/canvasStore'

export function useShortcuts() {
  const {
    addNode,
    removeNode,
    selectedNodeId,
    togglePropertyPanel,
    isPropertyPanelOpen,
    setStatusMessage,
    undo,
    redo,
    canUndo,
    canRedo
  } = useCanvasStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (canUndo()) {
          undo()
          setStatusMessage('已撤销')
        }
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        if (canRedo()) {
          redo()
          setStatusMessage('已重做')
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        setStatusMessage('已保存')
        setTimeout(() => setStatusMessage('就绪'), 2000)
      }

      if (e.key === 'Delete' && selectedNodeId) {
        e.preventDefault()
        removeNode(selectedNodeId)
      }

      if (e.key === 'Escape') {
        if (isPropertyPanelOpen) {
          togglePropertyPanel(false)
        }
      }

      if (e.key === 'Tab') {
        e.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [addNode, removeNode, selectedNodeId, togglePropertyPanel, isPropertyPanelOpen, setStatusMessage, undo, redo, canUndo, canRedo])
}