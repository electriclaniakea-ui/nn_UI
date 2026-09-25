import { useEffect, useRef, useCallback, useState } from 'react'
import type { TrainStatus, TrainLog } from '@/types/training'

export function useTrainingWs() {
  const [status, setStatus] = useState<TrainStatus>({
    isTraining: false,
    currentEpoch: 0,
    totalEpochs: 0,
    currentStep: 0,
    totalSteps: 0,
    loss: 0,
    logs: [],
  })

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttempts = useRef(0)

  const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8765'
  const wsUrl = (import.meta as any).env?.VITE_WS_URL || 'ws://localhost:8765/ws'

  const connect = useCallback(() => {
    try {
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        console.log('WebSocket connected')
        reconnectAttempts.current = 0
      }

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data)
        
        switch (data.type) {
          case 'train_progress':
            setStatus((prev) => ({
              ...prev,
              isTraining: true,
              currentEpoch: data.epoch,
              totalEpochs: data.totalEpochs || prev.totalEpochs,
              currentStep: data.step,
              loss: data.loss,
              accuracy: data.acc,
            }))
            break

          case 'train_log':
            setStatus((prev) => ({
              ...prev,
              logs: [...prev.logs, {
                epoch: data.epoch,
                step: data.step,
                level: data.level,
                message: data.line,
                timestamp: Date.now(),
              }],
            }))
            break

          case 'train_finished':
            setStatus((prev) => ({ ...prev, isTraining: false }))
            break

          case 'train_error':
            console.error('Training error:', data.message)
            setStatus((prev) => ({
              ...prev,
              isTraining: false,
              logs: [...prev.logs, {
                epoch: prev.currentEpoch,
                step: prev.currentStep,
                level: 'error',
                message: data.message,
                timestamp: Date.now(),
              }],
            }))
            break
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected')
        if (reconnectAttempts.current < 5) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++
            connect()
          }, Math.pow(2, reconnectAttempts.current) * 1000)
        }
      }
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
    }
  }, [wsUrl])

  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  const startTraining = useCallback(async (config: any) => {
    try {
      const response = await fetch(`${apiBase}/api/training/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      
      if (response.ok) {
        connect()
        setStatus((prev) => ({
          ...prev,
          isTraining: true,
          totalEpochs: config.epochs,
          logs: [],
        }))
      }
    } catch (error) {
      console.error('Failed to start training:', error)
    }
  }, [connect, apiBase])

  const stopTraining = useCallback(async () => {
    try {
      await fetch(`${apiBase}/api/training/stop`, {
        method: 'POST',
      })
      setStatus((prev) => ({ ...prev, isTraining: false }))
    } catch (error) {
      console.error('Failed to stop training:', error)
    }
  }, [apiBase])

  return { status, startTraining, stopTraining, connect }
}