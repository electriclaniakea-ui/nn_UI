import { useEffect } from 'react'
import { useCanvasStore } from '../store/canvasStore'

export function useNodeValidation() {
  const nodes = useCanvasStore((state) => state.nodes)
  const errors = useCanvasStore((state) => state.errors)
  const addError = useCanvasStore((state) => state.addError)

  useEffect(() => {
    const newErrors: string[] = []

    nodes.forEach((node, index) => {
      const { type, params } = node.data
      
      if (type === 'linear') {
        if (params.in_features <= 0) {
          newErrors.push(`节点 #${index + 1} Linear: in_features 必须为正整数`)
        }
        if (params.out_features <= 0) {
          newErrors.push(`节点 #${index + 1} Linear: out_features 必须为正整数`)
        }
      }

      if (type === 'conv2d') {
        if (params.in_channels <= 0 || params.out_channels <= 0) {
          newErrors.push(`节点 #${index + 1} Conv2d: 通道数必须为正整数`)
        }
        if (params.kernel_size <= 0) {
          newErrors.push(`节点 #${index + 1} Conv2d: kernel_size 必须为正整数`)
        }
      }

      if (type === 'dropout') {
        if (params.p < 0 || params.p > 1) {
          newErrors.push(`节点 #${index + 1} Dropout: p 必须在 0 到 1 之间`)
        }
      }
    })

    newErrors.forEach((error) => {
      if (!errors.includes(error)) {
        addError(error)
      }
    })
  }, [nodes, errors, addError])
}