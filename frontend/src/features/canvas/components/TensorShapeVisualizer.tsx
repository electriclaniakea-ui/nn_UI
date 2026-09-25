import { useState, useRef, useEffect } from 'react'
import { useCanvasStore } from '../store/canvasStore'

interface TensorShapeVisualizerProps {
  nodeIndex: number
  position: { x: number; y: number }
}

/**
 * 张量形状可视化组件
 * 
 * 显示规则：
 * - 文字数据 (batch, length, vocab_size): 显示为侧置长方形，高=vocab，宽=length
 * - 图片数据 (batch, C, H, W): 显示为 C 张叠在一起的平面
 * - 其他数据: 忽略 batch 维度，剩余维度按上述方式显示
 */
export function TensorShapeVisualizer({ nodeIndex, position }: TensorShapeVisualizerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const dotRef = useRef<HTMLDivElement>(null)
  const { validationResult, isValidating } = useCanvasStore()

  // 获取当前节点的形状信息
  const shapeInfo = validationResult?.node_shapes?.find(
    s => s.node_index === nodeIndex
  )

  const hasShape = !!shapeInfo?.output_shape && shapeInfo.output_shape.length > 0
  const outputShape = shapeInfo?.output_shape || []

  // 判断数据类型并渲染对应的 3D 可视化
  const renderTensorVisualization = () => {
    if (!hasShape) {
      return (
        <div className="text-xs text-text-secondary text-center py-4">
          {isValidating ? '正在计算形状...' : '点击"验证"按钮计算形状'}
        </div>
      )
    }

    // 后端返回的形状已经去除了 batch 维度，直接使用
    const shape = outputShape

    if (shape.length === 0) {
      return <div className="text-xs text-text-secondary">标量</div>
    }

    // 判断是否为图片数据: (C, H, W) -> 3维，且通常 C 较小 (1-512)
    const isImage = shape.length === 3 && shape[0] <= 512
    // 判断是否为文字数据: (length, vocab_size) -> 2维，且 vocab 通常较大
    const isText = shape.length === 2 && shape[1] > 100

    if (isImage) {
      return <ImageTensor3D shape={shape} />
    } else if (isText) {
      return <TextTensor3D shape={shape} />
    } else if (shape.length >= 2) {
      // 通用多维张量：取最后两维作为平面，其他维度作为层数
      return <GenericTensor3D shape={shape} />
    } else {
      // 1D 向量
      return <Vector1D size={shape[0]} />
    }
  }

  const handleMouseEnter = () => {
    setIsVisible(true)
    if (dotRef.current) {
      const rect = dotRef.current.getBoundingClientRect()
      setTooltipPos({
        x: rect.left + rect.width / 2,
        y: rect.top
      })
    }
  }

  const handleMouseLeave = () => {
    setIsVisible(false)
  }

  return (
    <>
      {/* 小圆点触发器 - 始终渲染，有数据时显示紫色，无数据时显示灰色 */}
      <div
        ref={dotRef}
        className="absolute cursor-pointer group"
        style={{
          left: position.x - 10,
          top: position.y - 10,
          zIndex: 100,
          width: 20,
          height: 20,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* 脉冲动画外圈 - 仅在有形状数据时显示 */}
        {hasShape && (
          <div className="absolute inset-0 rounded-full bg-accent/30 animate-ping" style={{ animationDuration: '2s' }} />
        )}
        {/* 主圆点 */}
        <div
          className={`w-5 h-5 rounded-full border-2 shadow-lg transition-all duration-200 group-hover:scale-130 ${
            hasShape
              ? 'bg-accent border-white group-hover:bg-purple-500'
              : 'bg-gray-300 border-white group-hover:bg-gray-400'
          }`}
          style={{ position: 'absolute', top: 0, left: 0 }}
        />
        {/* 中心小白点增强可见性 */}
        <div
          className="absolute rounded-full bg-white/80"
          style={{
            width: 6,
            height: 6,
            top: 7,
            left: 7,
          }}
        />
      </div>

      {/* Tooltip 弹窗 */}
      {isVisible && (
        <TensorShapeTooltip
          position={tooltipPos}
          shape={outputShape}
          nodeType={shapeInfo?.node_type || 'unknown'}
        >
          {renderTensorVisualization()}
        </TensorShapeTooltip>
      )}
    </>
  )
}

// ============ 3D 可视化组件 ============

/**
 * 图片张量 3D 可视化
 * shape: [C, H, W] -> 显示 C 张叠在一起的平面
 */
function ImageTensor3D({ shape }: { shape: number[] }) {
  const [channels, height, width] = shape
  const maxDisplayChannels = Math.min(channels, 8)
  
  // 计算缩放比例，使可视化大小合适
  const maxSize = 120
  const scale = Math.min(maxSize / width, maxSize / height, 1)
  const displayWidth = Math.max(width * scale, 20)
  const displayHeight = Math.max(height * scale, 20)

  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        className="relative"
        style={{
          width: displayWidth + maxDisplayChannels * 3,
          height: displayHeight + maxDisplayChannels * 3,
        }}
      >
        {Array.from({ length: maxDisplayChannels }).map((_, i) => (
          <div
            key={i}
            className="absolute border border-accent/40 rounded-sm"
            style={{
              width: displayWidth,
              height: displayHeight,
              left: i * 3,
              top: (maxDisplayChannels - 1 - i) * 3,
              background: `linear-gradient(135deg, 
                rgba(124, 58, 237, ${0.15 + i * 0.08}) 0%, 
                rgba(139, 92, 246, ${0.1 + i * 0.05}) 100%)`,
              transform: `translateZ(${i * 2}px)`,
              zIndex: maxDisplayChannels - i,
            }}
          />
        ))}
      </div>
      <div className="text-[10px] text-text-secondary text-center">
        [{channels}, {height}, {width}]
        <br />
        {channels} 通道 × {height}×{width}
      </div>
    </div>
  )
}

/**
 * 文字张量 3D 可视化
 * shape: [length, vocab_size] -> 侧置长方形，高=vocab，宽=length
 */
function TextTensor3D({ shape }: { shape: number[] }) {
  const [length, vocabSize] = shape
  
  // 计算缩放比例
  const maxWidth = 140
  const maxHeight = 100
  const scale = Math.min(maxWidth / length, maxHeight / vocabSize, 1)
  const displayWidth = Math.max(length * scale, 30)
  const displayHeight = Math.max(vocabSize * scale, 20)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ perspective: '200px' }}>
        <div
          className="border border-accent/40 rounded-sm relative"
          style={{
            width: displayWidth,
            height: displayHeight,
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)',
            transform: 'rotateX(60deg) rotateZ(-10deg)',
            transformStyle: 'preserve-3d',
            boxShadow: '2px 2px 8px rgba(124, 58, 237, 0.2)',
          }}
        >
          {/* 网格线 */}
          <div className="absolute inset-0 opacity-20">
            {Array.from({ length: Math.min(10, length) }).map((_, i) => (
              <div
                key={`v-${i}`}
                className="absolute bg-accent/30"
                style={{
                  left: `${(i + 1) * (100 / Math.min(10, length + 1))}%`,
                  top: 0,
                  width: '1px',
                  height: '100%',
                }}
              />
            ))}
            {Array.from({ length: Math.min(8, vocabSize) }).map((_, i) => (
              <div
                key={`h-${i}`}
                className="absolute bg-accent/30"
                style={{
                  top: `${(i + 1) * (100 / Math.min(8, vocabSize + 1))}%`,
                  left: 0,
                  height: '1px',
                  width: '100%',
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="text-[10px] text-text-secondary text-center">
        [{length}, {vocabSize}]
        <br />
        序列长度 × 词表大小
      </div>
    </div>
  )
}

/**
 * 通用多维张量 3D 可视化
 * 取最后两维作为平面，其他维度作为层数
 */
function GenericTensor3D({ shape }: { shape: number[] }) {
  if (shape.length < 2) return <Vector1D size={shape[0]} />

  const depth = shape.length > 2 ? shape.slice(0, -2).reduce((a, b) => a * b, 1) : 1
  const height = shape[shape.length - 2]
  const width = shape[shape.length - 1]

  const maxDisplayDepth = Math.min(depth, 6)
  
  const maxSize = 120
  const scale = Math.min(maxSize / width, maxSize / height, 1)
  const displayWidth = Math.max(width * scale, 20)
  const displayHeight = Math.max(height * scale, 20)

  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        className="relative"
        style={{
          width: displayWidth + maxDisplayDepth * 3,
          height: displayHeight + maxDisplayDepth * 3,
        }}
      >
        {Array.from({ length: maxDisplayDepth }).map((_, i) => (
          <div
            key={i}
            className="absolute border border-accent/40 rounded-sm"
            style={{
              width: displayWidth,
              height: displayHeight,
              left: i * 3,
              top: (maxDisplayDepth - 1 - i) * 3,
              background: `linear-gradient(135deg, 
                rgba(124, 58, 237, ${0.12 + i * 0.06}) 0%, 
                rgba(139, 92, 246, ${0.08 + i * 0.04}) 100%)`,
              zIndex: maxDisplayDepth - i,
            }}
          />
        ))}
      </div>
      <div className="text-[10px] text-text-secondary text-center">
        [{shape.join(', ')}]
        <br />
        {depth > 1 ? `${depth} 层 × ` : ''}{height}×{width}
      </div>
    </div>
  )
}

/**
 * 1D 向量可视化
 */
function Vector1D({ size }: { size: number }) {
  const displayLength = Math.min(size * 2, 140)
  const displayHeight = 24

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="border border-accent/40 rounded-sm relative overflow-hidden"
        style={{
          width: displayLength,
          height: displayHeight,
          background: 'linear-gradient(90deg, rgba(124, 58, 237, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
        }}
      >
        {/* 分段指示 */}
        {Array.from({ length: Math.min(10, size) }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 bg-accent/10"
            style={{
              left: `${(i / Math.min(10, size)) * 100}%`,
              width: `${100 / Math.min(10, size)}%`,
              borderRight: i < Math.min(10, size) - 1 ? '1px solid rgba(124, 58, 237, 0.2)' : 'none',
            }}
          />
        ))}
      </div>
      <div className="text-[10px] text-text-secondary text-center">
        [{size}]
        <br />
        向量维度: {size}
      </div>
    </div>
  )
}

// ============ Tooltip 容器 ============

interface TensorShapeTooltipProps {
  position: { x: number; y: number }
  shape: number[]
  nodeType: string
  children: React.ReactNode
}

function TensorShapeTooltip({ position, shape, nodeType, children }: TensorShapeTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [adjustedPos, setAdjustedPos] = useState(position)

  useEffect(() => {
    if (tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let x = position.x - rect.width / 2
      let y = position.y - rect.height - 12

      // 边界检查
      if (x < 10) x = 10
      if (x + rect.width > viewportWidth - 10) x = viewportWidth - rect.width - 10
      if (y < 10) y = position.y + 20 // 如果上方空间不足，显示在下方

      setAdjustedPos({ x, y })
    }
  }, [position])

  return (
    <div
      ref={tooltipRef}
      className="fixed z-50 bg-bg-panel border border-layer-border rounded-xl shadow-2xl p-4 animate-zoom-in"
      style={{
        left: adjustedPos.x,
        top: adjustedPos.y,
        minWidth: '160px',
        maxWidth: '220px',
      }}
    >
      {/* 标题 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-text-primary">张量形状</span>
        <span className="text-[10px] px-2 py-0.5 bg-accent/10 text-accent rounded-full">
          {nodeType}
        </span>
      </div>

      {/* 形状文本 */}
      <div className="text-xs text-text-secondary mb-3 font-mono bg-bg-canvas rounded px-2 py-1">
        [{shape.join(', ')}]
      </div>

      {/* 3D 可视化 */}
      <div className="flex justify-center py-2">
        {children}
      </div>

      {/* 底部小三角 */}
      <div 
        className="absolute left-1/2 transform -translate-x-1/2 w-3 h-3 bg-bg-panel border-r border-b border-layer-border rotate-45"
        style={{ bottom: '-7px' }}
      />
    </div>
  )
}