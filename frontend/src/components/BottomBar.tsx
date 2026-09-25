import { useCanvasStore } from '@/features/canvas/store/canvasStore'

interface BottomBarProps {
  errorCount: number
}

export function BottomBar({ errorCount }: BottomBarProps) {
  const { statusMessage } = useCanvasStore()

  return (
    <footer className="h-35 bg-bg-panel border-t border-layer-border flex items-center justify-between px-6 py-2">
      <div className="flex items-center gap-4">
        <span className="text-sm text-text-secondary">
          状态: {statusMessage || '就绪'}
        </span>
        
        {errorCount > 0 && (
          <span className="text-sm text-error font-medium">
            ⚠ {errorCount} 个错误
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="w-32 h-20 bg-bg-canvas rounded border border-layer-border flex items-center justify-center text-xs text-text-secondary">
          缩略图
        </div>
      </div>
    </footer>
  )
}