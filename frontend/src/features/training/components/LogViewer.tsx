import { useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { TrainLog } from '@/types/training'

interface LogViewerProps {
  logs: TrainLog[]
  totalEpochs?: number
}

export function LogViewer({ logs, totalEpochs }: LogViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-error'
      case 'warning': return 'text-warning'
      default: return 'text-text-primary'
    }
  }

  return (
    <ScrollArea className="h-48 w-full bg-bg-canvas rounded-lg border border-layer-border">
      <div ref={scrollRef} className="p-3 space-y-1 font-mono text-xs">
        {logs.length === 0 ? (
          <p className="text-text-secondary">等待训练日志...</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} className={getLevelColor(log.level)}>
              <span className="text-text-secondary">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
              <span>Epoch {log.epoch}/{totalEpochs || '?'}</span>
              {' - '}
              <span>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  )
}