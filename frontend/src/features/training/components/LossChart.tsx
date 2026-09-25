import { useEffect, useRef } from 'react'
import type { TrainLog } from '@/types/training'

interface LossChartProps {
  logs: TrainLog[]
  isTraining: boolean
}

export function LossChart({ logs, isTraining }: LossChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    ctx.clearRect(0, 0, width, height)

    ctx.strokeStyle = '#7C3AED'
    ctx.lineWidth = 2
    ctx.beginPath()

    const lossLogs = logs.filter(l => l.message.includes('loss'))
    
    if (lossLogs.length === 0) {
      ctx.fillStyle = '#8A8074'
      ctx.font = '12px Inter'
      ctx.textAlign = 'center'
      ctx.fillText('等待训练数据...', width / 2, height / 2)
      return
    }

    const maxLoss = Math.max(...lossLogs.map(l => parseFloat(l.message.split(':')[1]) || 0))
    
    lossLogs.forEach((log, index) => {
      const x = (index / (lossLogs.length - 1 || 1)) * width
      const loss = parseFloat(log.message.split(':')[1]) || 0
      const y = height - (loss / maxLoss) * height * 0.9 - 10

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()

    ctx.fillStyle = '#8A8074'
    ctx.font = '11px Inter'
    ctx.fillText('Loss', 10, 15)

  }, [logs, isTraining])

  return (
    <div className="w-full h-48 bg-bg-canvas rounded-lg border border-layer-border p-4">
      <canvas
        ref={canvasRef}
        width={400}
        height={180}
        className="w-full h-full"
      />
    </div>
  )
}