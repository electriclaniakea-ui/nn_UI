import { useState, useEffect } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useCanvasStore } from '@/features/canvas/store/canvasStore'

interface LayerSummary {
  name: string
  type: string
  inputShape: string[]
  outputShape: string[]
  params: number
}

interface ModelSummaryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ModelSummaryDialog({ open, onOpenChange }: ModelSummaryDialogProps) {
  const [summary, setSummary] = useState<LayerSummary[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadSummary()
    }
  }, [open])

  const loadSummary = async () => {
    setLoading(true)
    try {
      const nodes = useCanvasStore.getState().nodes
      const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8765'
      const response = await fetch(`${apiBase}/api/model/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setSummary(data.layers || [])
      }
    } catch (error) {
      console.error('Failed to load model summary:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalParams = summary.reduce((sum, layer) => sum + layer.params, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>模型摘要</DialogTitle>
      </DialogHeader>

      <DialogContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <span className="text-text-secondary">正在生成模型摘要...</span>
          </div>
        ) : (
          <>
            <div className="mb-4 p-3 bg-bg-canvas rounded-lg border border-layer-border">
              <div className="text-sm">
                <span className="font-medium">总参数量：</span>
                <span className="text-accent font-mono">{totalParams.toLocaleString()}</span>
              </div>
            </div>

            <ScrollArea className="h-64">
              <table className="w-full text-sm">
                <thead className="bg-bg-panel sticky top-0">
                  <tr>
                    <th className="text-left p-2 text-text-secondary font-medium">层</th>
                    <th className="text-left p-2 text-text-secondary font-medium">类型</th>
                    <th className="text-left p-2 text-text-secondary font-medium">输出形状</th>
                    <th className="text-right p-2 text-text-secondary font-medium">参数</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((layer, index) => (
                    <tr key={index} className="border-t border-layer-border">
                      <td className="p-2 text-text-primary">{layer.name}</td>
                      <td className="p-2 text-text-secondary">{layer.type}</td>
                      <td className="p-2 font-mono text-xs">{layer.outputShape.join('×')}</td>
                      <td className="p-2 text-right font-mono">{layer.params.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </>
        )}
      </DialogContent>

      <DialogFooter>
        <Button onClick={() => onOpenChange(false)}>关闭</Button>
      </DialogFooter>
    </Dialog>
  )
}