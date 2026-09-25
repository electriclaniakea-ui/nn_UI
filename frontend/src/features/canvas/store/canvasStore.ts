import { create } from 'zustand'
import { validateGraph, generateCode } from '@/lib/api'
import type { GraphValidationResult, CodeGenResult } from '@/lib/api'
import { DEFAULT_PARAMS } from '@/lib/constants'

// ============ Block 内部链表节点 ============
export interface BlockLayerNode {
  id: string
  type: string
  params: Record<string, any>
  label: string
  next: string | null
}

// ============ Block 定义 ============
export interface BlockDefinition {
  id: string
  name: string
  layers: BlockLayerNode[] // Block 内部的单向链表
  inputShape?: number[]
  outputShape?: number[]
}

// ============ 单向链表节点定义 ============
export interface LayerNode {
  id: string
  type: string
  params: Record<string, any>
  label: string
  next: string | null // 下一个节点的id
  blockData?: BlockDefinition // 当 type === 'block' 时存储内部结构
}

// ============ 渲染用的CanvasNode（从链表生成）============
export interface NodeData {
  label: string
  type: string
  params: Record<string, any>
  index?: number
  validationError?: string | null
}

export interface CanvasNode {
  id: string
  type: string
  data: NodeData
  position: { x: number; y: number }
}

interface HistoryState {
  layers: LayerNode[]
  timestamp: number
}

interface CanvasState {
  // 单向链表：所有层数据的真实来源
  layers: LayerNode[]
  // 渲染用的节点（从layers实时生成，不持久化）
  nodes: CanvasNode[]
  // 操作锁：防止并发修改
  isLocked: boolean

  selectedNodeId: string | null
  selectedNodeIds: string[] // Ctrl 多选
  isPropertyPanelOpen: boolean
  errors: string[]
  statusMessage: string
  hoveredNodeId: string | null
  history: HistoryState[]
  historyIndex: number
  validationResult: GraphValidationResult | null
  generatedCode: CodeGenResult | null
  isValidating: boolean
  
  // Block 编辑状态
  editingBlockId: string | null // 当前正在编辑的 Block ID
  isBlockEditorOpen: boolean

  // 核心操作
  addNode: (type: string, params: Record<string, any>) => void
  removeNode: (id: string) => void
  duplicateNode: (id: string) => void
  selectNode: (id: string | null) => void
  toggleNodeSelection: (id: string) => void // Ctrl 多选
  clearSelection: () => void
  updateNodeData: (id: string, data: Partial<NodeData>) => void
  togglePropertyPanel: (open?: boolean) => void
  setStatusMessage: (message: string) => void
  clearErrors: () => void
  setHoveredNodeId: (id: string | null) => void
  setNodes: (nodes: CanvasNode[], skipHistory?: boolean) => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  validateGraph: () => Promise<void>
  generateCode: () => Promise<void>
  resetNodeParams: (id: string, defaultParams: Record<string, any>) => void
  clearValidationErrors: () => void
  clearAll: () => void
  moveNodeUp: (id: string) => void
  moveNodeDown: (id: string) => void
  addError: (error: string) => void
  packNodesAsBlock: (nodeIds: string[]) => void
  unpackBlock: (blockId: string) => void

  // Block 编辑
  openBlockEditor: (blockId: string) => void
  closeBlockEditor: () => void
  updateBlockLayer: (blockId: string, layerId: string, data: Partial<NodeData>) => void
  addBlockLayer: (blockId: string, type: string, params: Record<string, any>) => void
  removeBlockLayer: (blockId: string, layerId: string) => void
  moveBlockLayer: (blockId: string, sourceId: string, targetIndex: number) => boolean

  // 链表核心操作
  moveNodeToIndex: (sourceId: string, targetIndex: number) => boolean
  getLayerIndex: (id: string) => number
  rebuildNodes: () => void
}

let nodeIdCounter = 0

// 节点尺寸必须与 App.tsx 中 NodeComponent 的实际渲染尺寸保持一致
// 普通节点: 80x80 (菱形), Block: 200x120, Input/Output: 64x64 (三角形)
const NODE_SIZE = 80
const BLOCK_WIDTH = 200
const BLOCK_HEIGHT = 120
const TRIANGLE_SIZE = 64
const NODE_GAP = 48
const START_X = 80
const START_Y = 150

function computePosition(layers: LayerNode[], index: number) {
  let x = START_X
  for (let i = 0; i < index; i++) {
    const layer = layers[i]
    const isBlock = layer.type === 'block'
    const isTriangle = layer.type === 'input' || layer.type === 'output'
    const width = isBlock ? BLOCK_WIDTH : isTriangle ? TRIANGLE_SIZE : NODE_SIZE
    x += width + NODE_GAP
  }
  return {
    x,
    y: START_Y
  }
}

/** 获取节点的右边界 X 坐标（用于计算节点间中点） */
export function getNodeRightEdge(layers: LayerNode[], index: number): number {
  const pos = computePosition(layers, index)
  const layer = layers[index]
  const isBlock = layer?.type === 'block'
  const isTriangle = layer?.type === 'input' || layer?.type === 'output'
  const width = isBlock ? BLOCK_WIDTH : isTriangle ? TRIANGLE_SIZE : NODE_SIZE
  return pos.x + width
}

/** 计算两个节点之间的中点位置 */
export function getMidpointBetweenNodes(layers: LayerNode[], index: number): { x: number; y: number } | null {
  if (index < 0 || index >= layers.length - 1) return null
  const rightEdge = getNodeRightEdge(layers, index)
  const nextPos = computePosition(layers, index + 1)
  const midX = (rightEdge + nextPos.x) / 2
  const midY = START_Y + NODE_SIZE / 2
  return { x: midX, y: midY }
}

const MAX_HISTORY = 50

let autoValidateTimer: ReturnType<typeof setTimeout> | null = null

function scheduleAutoValidate() {
  if (autoValidateTimer) clearTimeout(autoValidateTimer)
  autoValidateTimer = setTimeout(() => {
    useCanvasStore.getState().validateGraph()
  }, 300)
}

function pushHistory(state: CanvasState): CanvasState {
  const newHistory = state.history.slice(0, state.historyIndex + 1)
  newHistory.push({
    layers: JSON.parse(JSON.stringify(state.layers)),
    timestamp: Date.now()
  })
  if (newHistory.length > MAX_HISTORY) {
    newHistory.shift()
  }
  return {
    ...state,
    history: newHistory,
    historyIndex: newHistory.length - 1
  }
}

function inferParamsFromPrev(type: string, prevNode: LayerNode | undefined): Record<string, any> {
  if (!prevNode) {
    const defaults = DEFAULT_PARAMS[type] || {}
    switch (type) {
      case 'linear': return { in_features: 784, out_features: 128, activation: 'relu', ...defaults }
      case 'conv2d': return { in_channels: 3, out_channels: 64, kernel_size: 3, stride: 1, padding: 1, ...defaults }
      case 'batch_norm': return { num_features: 64, ...defaults }
      case 'layer_norm': return { normalized_shape: [128], ...defaults }
      case 'dropout': return { p: 0.5, ...defaults }
      case 'input': return { shape: [784], ...defaults }
      case 'output': return { num_classes: 10, ...defaults }
      default: return { ...defaults }
    }
  }

  const prevParams = prevNode.params || {}
  const prevType = prevNode.type

  switch (type) {
    case 'linear': {
      let inFeatures = 128
      if (prevType === 'linear' && prevParams.out_features) {
        inFeatures = prevParams.out_features
      } else if (prevType === 'flatten') {
        // flatten 层没有 shape 参数，无法直接推断
        // 使用一个合理的默认值，用户需要根据实际网络结构调整
        inFeatures = 2048
      } else if (['conv2d', 'batch_norm', 'max_pool2d', 'avg_pool2d', 'relu'].includes(prevType)) {
        // 在卷积层后添加 Linear，通常需要 flatten，这里给一个大一点的默认值
        inFeatures = 2048
      }
      return { in_features: inFeatures, out_features: Math.max(10, Math.floor(inFeatures / 2)), activation: 'relu' }
    }
    case 'conv2d': {
      const inChannels = prevParams.out_channels || prevParams.in_channels || 3
      return { in_channels: inChannels, out_channels: inChannels * 2, kernel_size: 3, stride: 1, padding: 1 }
    }
    case 'batch_norm': {
      const numFeatures = prevParams.out_channels || prevParams.out_features || prevParams.num_features || 64
      return { num_features: numFeatures }
    }
    case 'layer_norm': {
      const normShape = prevParams.out_features || prevParams.embed_dim || prevParams.d_model || 128
      return { normalized_shape: [normShape] }
    }
    case 'dropout':
      return { p: 0.5 }
    case 'max_pool2d':
    case 'avg_pool2d':
      return { kernel_size: 2, stride: 2 }
    case 'flatten':
      return {}
    case 'output': {
      let outShape = [10]
      if (prevType === 'linear' && prevParams.out_features) {
        outShape = [prevParams.out_features]
      }
      return { shape: outShape }
    }
    default:
      return {}
  }
}

// 从单向链表生成渲染用的nodes数组
function layersToCanvasNodes(layers: LayerNode[]): CanvasNode[] {
  return layers.map((layer, index) => ({
    id: layer.id,
    type: layer.type,
    data: {
      label: layer.label,
      type: layer.type,
      params: layer.params,
      index,
      validationError: null
    },
    position: computePosition(layers, index)
  }))
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  layers: [],
  nodes: [],
  isLocked: false,
  selectedNodeId: null,
  selectedNodeIds: [],
  isPropertyPanelOpen: false,
  errors: [],
  statusMessage: '就绪',
  hoveredNodeId: null,
  history: [],
  historyIndex: -1,
  validationResult: null,
  generatedCode: null,
  isValidating: false,
  editingBlockId: null,
  isBlockEditorOpen: false,

  // ========== 链表核心：获取节点索引 ==========
  getLayerIndex: (id: string) => {
    return get().layers.findIndex(l => l.id === id)
  },

  // ========== 链表核心：移动节点到指定索引 ==========
  moveNodeToIndex: (sourceId: string, targetIndex: number) => {
    const state = get()
    if (state.isLocked) {
      console.warn('[moveNodeToIndex] 操作被锁定，请稍后再试')
      return false
    }

    // 加锁
    set({ isLocked: true })

    try {
      const currentIndex = state.layers.findIndex(l => l.id === sourceId)
      if (currentIndex === -1) {
        console.warn('[moveNodeToIndex] 找不到源节点:', sourceId)
        set({ isLocked: false })
        return false
      }

      const clampedTarget = Math.max(0, Math.min(targetIndex, state.layers.length - 1))
      if (clampedTarget === currentIndex) {
        // 位置没变，直接解锁
        set({ isLocked: false })
        return true // 视为成功（无需移动）
      }

      // 创建新链表并移动节点
      const newLayers = [...state.layers]
      const [movedLayer] = newLayers.splice(currentIndex, 1)
      newLayers.splice(clampedTarget, 0, movedLayer)

      // 验证链表完整性
      if (newLayers.length !== state.layers.length) {
        console.error('[moveNodeToIndex] 链表长度异常!')
        set({ isLocked: false })
        return false
      }

      // 验证所有id唯一
      const ids = newLayers.map(l => l.id)
      const uniqueIds = new Set(ids)
      if (uniqueIds.size !== ids.length) {
        console.error('[moveNodeToIndex] 检测到重复ID!')
        set({ isLocked: false })
        return false
      }

      // 验证通过，更新状态并重新渲染
      const newNodes = layersToCanvasNodes(newLayers)
      set({
        ...pushHistory({ ...state, layers: newLayers, nodes: newNodes }),
        layers: newLayers,
        nodes: newNodes,
        statusMessage: `已移动 ${movedLayer.label} 到位置 ${clampedTarget + 1}`,
        isLocked: false
      })
      scheduleAutoValidate()

      return true
    } catch (e) {
      console.error('[moveNodeToIndex] 异常:', e)
      set({ isLocked: false })
      return false
    }
  },

  // ========== 重新从链表生成渲染节点 ==========
  rebuildNodes: () => {
    const state = get()
    const newNodes = layersToCanvasNodes(state.layers)
    set({ nodes: newNodes })
  },

  // ========== 上移节点 ==========
  moveNodeUp: (id) => {
    const state = get()
    const index = state.getLayerIndex(id)
    if (index <= 0) return
    state.moveNodeToIndex(id, index - 1)
  },

  // ========== 下移节点 ==========
  moveNodeDown: (id) => {
    const state = get()
    const index = state.getLayerIndex(id)
    if (index < 0 || index >= state.layers.length - 1) return
    state.moveNodeToIndex(id, index + 1)
  },

  // ========== 添加节点 ==========
  addNode: (type, params) => {
    const state = get()
    if (state.isLocked) {
      console.warn('[addNode] 操作被锁定')
      return
    }

    const id = `node-${++nodeIdCounter}`
    const nodeIndex = state.layers.length
    const prevNode = nodeIndex > 0 ? state.layers[nodeIndex - 1] : undefined

    const inferredParams = inferParamsFromPrev(type, prevNode)
    const mergedParams: Record<string, any> = { ...inferredParams }
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== '') {
          mergedParams[key] = val
        }
      })
    }

    const newLayer: LayerNode = {
      id,
      type,
      params: mergedParams,
      label: `${type}_${nodeIndex + 1}`,
      next: null
    }

    // 更新前驱节点的next指针
    const newLayers = [...state.layers]
    if (newLayers.length > 0) {
      newLayers[newLayers.length - 1] = {
        ...newLayers[newLayers.length - 1],
        next: id
      }
    }
    newLayers.push(newLayer)

    const newNodes = layersToCanvasNodes(newLayers)

    set({
      ...pushHistory({ ...state, layers: newLayers, nodes: newNodes }),
      layers: newLayers,
      nodes: newNodes,
      statusMessage: `已添加层: ${newLayer.label}`
    })
    scheduleAutoValidate()
  },

  // ========== 删除节点 ==========
  removeNode: (id) => {
    const state = get()
    if (state.isLocked) return

    const index = state.layers.findIndex(l => l.id === id)
    if (index === -1) return

    const newLayers = [...state.layers]
    newLayers.splice(index, 1)

    // 更新链表指针
    if (index > 0 && index < newLayers.length) {
      newLayers[index - 1] = {
        ...newLayers[index - 1],
        next: newLayers[index].id
      }
    } else if (index > 0 && newLayers.length > 0) {
      newLayers[index - 1] = {
        ...newLayers[index - 1],
        next: null
      }
    }

    const newNodes = layersToCanvasNodes(newLayers)

    set({
      ...pushHistory({ ...state, layers: newLayers, nodes: newNodes }),
      layers: newLayers,
      nodes: newNodes,
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
      statusMessage: '已删除层'
    })
    scheduleAutoValidate()
  },

  // ========== 复制节点 ==========
  duplicateNode: (id) => {
    const state = get()
    if (state.isLocked) return

    const index = state.layers.findIndex(l => l.id === id)
    if (index === -1) return

    const layer = state.layers[index]
    const newId = `node-${++nodeIdCounter}`
    const insertIndex = index + 1

    const newLayer: LayerNode = {
      ...layer,
      id: newId,
      label: `${layer.label}_copy`,
      next: layer.next
    }

    const newLayers = [...state.layers]
    newLayers[index] = { ...layer, next: newId }
    newLayers.splice(insertIndex, 0, newLayer)

    const newNodes = layersToCanvasNodes(newLayers)

    set({
      ...pushHistory({ ...state, layers: newLayers, nodes: newNodes }),
      layers: newLayers,
      nodes: newNodes,
      statusMessage: `已复制节点: ${newLayer.label}`
    })
    scheduleAutoValidate()
  },

  // ========== 选择节点 ==========
  selectNode: (id) => {
    set({
      selectedNodeId: id,
      selectedNodeIds: id ? [id] : [], // 单选时清空多选
      isPropertyPanelOpen: !!id,
      statusMessage: id ? `已选择节点` : '取消选择'
    })
  },

  // ========== Ctrl 多选节点 ==========
  toggleNodeSelection: (id) => {
    const state = get()
    const newSelection = state.selectedNodeIds.includes(id)
      ? state.selectedNodeIds.filter(sid => sid !== id)
      : [...state.selectedNodeIds, id]
    set({
      selectedNodeIds: newSelection,
      selectedNodeId: newSelection.length === 1 ? newSelection[0] : null,
      statusMessage: `已选择 ${newSelection.length} 个节点`
    })
  },

  clearSelection: () => {
    set({
      selectedNodeIds: [],
      selectedNodeId: null,
      statusMessage: '已清空选择'
    })
  },

  // ========== 更新节点数据（参数等）==========
  updateNodeData: (id, data) => {
    const state = get()
    const layerIndex = state.layers.findIndex(l => l.id === id)
    if (layerIndex === -1) return

    const newLayers = [...state.layers]
    const layer = newLayers[layerIndex]

    newLayers[layerIndex] = {
      ...layer,
      params: data.params !== undefined ? { ...data.params } : layer.params,
      label: data.label !== undefined ? data.label : layer.label
    }

    const newNodes = layersToCanvasNodes(newLayers)

    set({
      ...pushHistory({ ...state, layers: newLayers, nodes: newNodes }),
      layers: newLayers,
      nodes: newNodes,
      statusMessage: '已更新节点参数'
    })
    scheduleAutoValidate()
  },

  // ========== 恢复默认参数 ==========
  resetNodeParams: (id, defaultParams) => {
    const state = get()
    const layerIndex = state.layers.findIndex(l => l.id === id)
    if (layerIndex === -1) return

    const newLayers = [...state.layers]
    newLayers[layerIndex] = {
      ...newLayers[layerIndex],
      params: { ...defaultParams }
    }

    const newNodes = layersToCanvasNodes(newLayers)

    set({
      ...pushHistory({ ...state, layers: newLayers, nodes: newNodes }),
      layers: newLayers,
      nodes: newNodes,
      statusMessage: '已恢复默认参数'
    })
    scheduleAutoValidate()
  },

  togglePropertyPanel: (open) => {
    set(state => ({
      isPropertyPanelOpen: open ?? !state.isPropertyPanelOpen
    }))
  },

  setStatusMessage: (message) => {
    set({ statusMessage: message })
  },

  clearErrors: () => {
    set({ errors: [] })
  },

  clearValidationErrors: () => {
    set(state => ({
      nodes: state.nodes.map(node => ({
        ...node,
        data: { ...node.data, validationError: null }
      })),
      errors: []
    }))
  },

  addError: (error: string) => {
    set(state => ({
      errors: [...state.errors, error]
    }))
  },

  packNodesAsBlock: (nodeIds: string[]) => {
    const state = get()
    if (state.isLocked || nodeIds.length === 0) return

    // 按当前顺序排序节点（保持链表顺序）
    const nodesToPack = state.layers.filter(l => nodeIds.includes(l.id))
    if (nodesToPack.length === 0) return

    // 创建 Block 内部链表结构
    const blockLayers: BlockLayerNode[] = nodesToPack.map((layer, idx) => ({
      id: layer.id,
      type: layer.type,
      params: { ...layer.params },
      label: layer.label,
      next: idx < nodesToPack.length - 1 ? nodesToPack[idx + 1].id : null
    }))

    // 创建 block 定义
    const blockId = `node-${++nodeIdCounter}`
    const blockName = `Block_${nodeIdCounter}`
    const blockDef: BlockDefinition = {
      id: blockId,
      name: blockName,
      layers: blockLayers
    }

    // 创建 block 节点
    const blockLayer: LayerNode = {
      id: blockId,
      type: 'block',
      params: {
        name: blockName,
        layerCount: nodesToPack.length,
        packedNodeIds: nodeIds
      },
      label: blockName,
      next: null,
      blockData: blockDef
    }

    // 找到第一个被打包节点的位置
    const firstIndex = state.layers.findIndex(l => l.id === nodesToPack[0].id)
    if (firstIndex === -1) return

    // 从链表中移除被打包的节点，插入 block
    const newLayers = [...state.layers]
    // 移除所有被打包的节点（从后往前移除避免索引变化）
    const indicesToRemove = nodeIds
      .map(id => newLayers.findIndex(l => l.id === id))
      .filter(idx => idx !== -1)
      .sort((a, b) => b - a)

    indicesToRemove.forEach(idx => {
      newLayers.splice(idx, 1)
    })

    // 在第一个被打包节点的位置插入 block
    const insertIndex = Math.min(firstIndex, newLayers.length)
    newLayers.splice(insertIndex, 0, blockLayer)

    // 更新链表指针
    for (let i = 0; i < newLayers.length - 1; i++) {
      newLayers[i] = { ...newLayers[i], next: newLayers[i + 1].id }
    }
    if (newLayers.length > 0) {
      newLayers[newLayers.length - 1] = {
        ...newLayers[newLayers.length - 1],
        next: null
      }
    }

    const newNodes = layersToCanvasNodes(newLayers)

    set({
      ...pushHistory({ ...state, layers: newLayers, nodes: newNodes }),
      layers: newLayers,
      nodes: newNodes,
      selectedNodeIds: [],
      selectedNodeId: null,
      statusMessage: `已打包 ${nodesToPack.length} 个节点为 Block`
    })
    scheduleAutoValidate()
  },

  unpackBlock: (blockId: string) => {
    const state = get()
    const blockIndex = state.layers.findIndex(l => l.id === blockId)
    if (blockIndex === -1) return

    const blockLayer = state.layers[blockIndex]
    if (!blockLayer.blockData) return

    // 恢复 Block 内部的层到主链表
    const unpackedLayers: LayerNode[] = blockLayer.blockData.layers.map(bl => ({
      id: bl.id,
      type: bl.type,
      params: { ...bl.params },
      label: bl.label,
      next: bl.next
    }))

    const newLayers = [...state.layers]
    newLayers.splice(blockIndex, 1, ...unpackedLayers)

    // 更新链表指针
    for (let i = 0; i < newLayers.length - 1; i++) {
      newLayers[i] = { ...newLayers[i], next: newLayers[i + 1].id }
    }
    if (newLayers.length > 0) {
      newLayers[newLayers.length - 1] = {
        ...newLayers[newLayers.length - 1],
        next: null
      }
    }

    const newNodes = layersToCanvasNodes(newLayers)

    set({
      ...pushHistory({ ...state, layers: newLayers, nodes: newNodes }),
      layers: newLayers,
      nodes: newNodes,
      statusMessage: `已解包 Block: ${blockLayer.blockData.name}`
    })
    scheduleAutoValidate()
  },

  // ========== Block 编辑器 ==========
  openBlockEditor: (blockId: string) => {
    set({
      editingBlockId: blockId,
      isBlockEditorOpen: true,
      statusMessage: '正在编辑 Block'
    })
  },

  closeBlockEditor: () => {
    set({
      editingBlockId: null,
      isBlockEditorOpen: false,
      statusMessage: '已关闭 Block 编辑器'
    })
  },

  updateBlockLayer: (blockId: string, layerId: string, data: Partial<NodeData>) => {
    const state = get()
    const blockIndex = state.layers.findIndex(l => l.id === blockId)
    if (blockIndex === -1) return

    const blockLayer = state.layers[blockIndex]
    if (!blockLayer.blockData) return

    const newBlockData = { ...blockLayer.blockData }
    const layerIndex = newBlockData.layers.findIndex(l => l.id === layerId)
    if (layerIndex === -1) return

    newBlockData.layers[layerIndex] = {
      ...newBlockData.layers[layerIndex],
      params: data.params !== undefined ? { ...data.params } : newBlockData.layers[layerIndex].params,
      label: data.label !== undefined ? data.label : newBlockData.layers[layerIndex].label
    }

    const newLayers = [...state.layers]
    newLayers[blockIndex] = {
      ...blockLayer,
      blockData: newBlockData,
      params: {
        ...blockLayer.params,
        name: newBlockData.name
      }
    }

    set({
      layers: newLayers,
      statusMessage: '已更新 Block 内部层'
    })
  },

  addBlockLayer: (blockId: string, type: string, params: Record<string, any>) => {
    const state = get()
    const blockIndex = state.layers.findIndex(l => l.id === blockId)
    if (blockIndex === -1) return

    const blockLayer = state.layers[blockIndex]
    if (!blockLayer.blockData) return

    const newId = `node-${++nodeIdCounter}`
    const newBlockLayer: BlockLayerNode = {
      id: newId,
      type,
      params: { ...params },
      label: `${type}_${blockLayer.blockData.layers.length + 1}`,
      next: null
    }

    const newBlockData = { ...blockLayer.blockData }
    const lastLayer = newBlockData.layers[newBlockData.layers.length - 1]
    if (lastLayer) {
      lastLayer.next = newId
    }
    newBlockData.layers.push(newBlockLayer)

    const newLayers = [...state.layers]
    newLayers[blockIndex] = {
      ...blockLayer,
      blockData: newBlockData,
      params: {
        ...blockLayer.params,
        layerCount: newBlockData.layers.length
      }
    }

    set({
      layers: newLayers,
      statusMessage: `已在 Block 中添加层: ${newBlockLayer.label}`
    })
  },

  removeBlockLayer: (blockId: string, layerId: string) => {
    const state = get()
    const blockIndex = state.layers.findIndex(l => l.id === blockId)
    if (blockIndex === -1) return

    const blockLayer = state.layers[blockIndex]
    if (!blockLayer.blockData) return

    const newBlockData = { ...blockLayer.blockData }
    const layerIndex = newBlockData.layers.findIndex(l => l.id === layerId)
    if (layerIndex === -1) return

    newBlockData.layers.splice(layerIndex, 1)

    // 更新内部链表指针
    for (let i = 0; i < newBlockData.layers.length - 1; i++) {
      newBlockData.layers[i] = { ...newBlockData.layers[i], next: newBlockData.layers[i + 1].id }
    }
    if (newBlockData.layers.length > 0) {
      newBlockData.layers[newBlockData.layers.length - 1] = {
        ...newBlockData.layers[newBlockData.layers.length - 1],
        next: null
      }
    }

    const newLayers = [...state.layers]
    newLayers[blockIndex] = {
      ...blockLayer,
      blockData: newBlockData,
      params: {
        ...blockLayer.params,
        layerCount: newBlockData.layers.length
      }
    }

    set({
      layers: newLayers,
      statusMessage: '已从 Block 中删除层'
    })
  },

  moveBlockLayer: (blockId: string, sourceId: string, targetIndex: number) => {
    const state = get()
    const blockIndex = state.layers.findIndex(l => l.id === blockId)
    if (blockIndex === -1) return false

    const blockLayer = state.layers[blockIndex]
    if (!blockLayer.blockData) return false

    const currentIndex = blockLayer.blockData.layers.findIndex(l => l.id === sourceId)
    if (currentIndex === -1) return false

    const clampedTarget = Math.max(0, Math.min(targetIndex, blockLayer.blockData.layers.length - 1))
    if (clampedTarget === currentIndex) return true

    const newBlockData = { ...blockLayer.blockData }
    const newLayers = [...newBlockData.layers]
    const [movedLayer] = newLayers.splice(currentIndex, 1)
    newLayers.splice(clampedTarget, 0, movedLayer)

    // 更新内部链表指针
    for (let i = 0; i < newLayers.length - 1; i++) {
      newLayers[i] = { ...newLayers[i], next: newLayers[i + 1].id }
    }
    if (newLayers.length > 0) {
      newLayers[newLayers.length - 1] = {
        ...newLayers[newLayers.length - 1],
        next: null
      }
    }

    newBlockData.layers = newLayers

    const newMainLayers = [...state.layers]
    newMainLayers[blockIndex] = {
      ...blockLayer,
      blockData: newBlockData
    }

    set({
      layers: newMainLayers,
      statusMessage: `已移动 Block 内层到位置 ${clampedTarget + 1}`
    })

    return true
  },

  setHoveredNodeId: (id) => {
    set({ hoveredNodeId: id })
  },

  setNodes: (nodes, skipHistory = false) => {
    // 这个函数用于设置渲染用的nodes
    // skipHistory=true 时不记录历史（用于拖拽过程中的视觉更新）
    if (skipHistory) {
      set({ nodes })
    } else {
      set(state => ({
        ...pushHistory(state),
        nodes
      }))
    }
  },

  // ========== 撤销/重做 ==========
  undo: () => {
    set(state => {
      if (state.historyIndex < 0) return state
      const newIndex = state.historyIndex - 1
      if (newIndex < 0) {
        return {
          ...state,
          layers: [],
          nodes: [],
          historyIndex: -1,
          statusMessage: '已撤销到初始状态',
          selectedNodeId: null
        }
      }
      const historyState = state.history[newIndex]
      return {
        ...state,
        layers: JSON.parse(JSON.stringify(historyState.layers)),
        nodes: layersToCanvasNodes(JSON.parse(JSON.stringify(historyState.layers))),
        historyIndex: newIndex,
        statusMessage: '已撤销'
      }
    })
    scheduleAutoValidate()
  },

  redo: () => {
    set(state => {
      if (state.historyIndex >= state.history.length - 1) return state
      const newIndex = state.historyIndex + 1
      const historyState = state.history[newIndex]
      return {
        ...state,
        layers: JSON.parse(JSON.stringify(historyState.layers)),
        nodes: layersToCanvasNodes(JSON.parse(JSON.stringify(historyState.layers))),
        historyIndex: newIndex,
        statusMessage: '已重做'
      }
    })
    scheduleAutoValidate()
  },

  canUndo: () => {
    const state = get()
    return state.historyIndex >= 0 && state.history.length > 0
  },

  canRedo: () => {
    const state = get()
    return state.historyIndex < state.history.length - 1
  },

  // ========== 验证图结构 ==========
  validateGraph: async () => {
    const state = get()
    if (state.layers.length === 0) {
      set({ validationResult: null, errors: [] })
      return
    }
    set({ isValidating: true })
    try {
      // 从链表构建验证用的nodes
      // 对于 block 节点，需要将 blockData 合并到 params 中，以便后端展开验证
      const validationNodes = state.layers.map((layer, index) => {
        const params: Record<string, any> = { ...layer.params }
        // 如果是 block 节点，将 blockData 嵌入 params 中
        if (layer.type === 'block' && layer.blockData) {
          params.blockData = layer.blockData
        }
        return {
          id: layer.id,
          type: layer.type,
          data: {
            type: layer.type,
            params
          },
          position: computePosition(state.layers, index)
        }
      })

      const result = await validateGraph(validationNodes as CanvasNode[])

      if ('requestError' in result && result.requestError) {
        set({
          validationResult: null,
          nodes: state.nodes.map(node => ({
            ...node,
            data: { ...node.data, validationError: null }
          })),
          errors: [`验证请求失败: ${result.requestError}`],
          statusMessage: `验证请求失败: ${result.requestError}`
        })
        return
      }

      const errorMap = new Map<number, string>()
      result.errors.forEach(e => {
        errorMap.set(e.node_index, e.error)
      })

      const nodesWithErrors = state.nodes.map((node, idx) => ({
        ...node,
        data: {
          ...node.data,
          validationError: errorMap.get(idx) || null
        }
      }))

      const errorMessages = result.errors.map(e =>
        `节点 ${e.node_index + 1} (${e.node_type}): ${e.error}`
      )

      set({
        validationResult: result,
        nodes: nodesWithErrors,
        errors: errorMessages,
        statusMessage: errorMessages.length > 0
          ? `验证失败: ${errorMessages.length} 个错误`
          : `验证通过 ✓ 输出形状: [${result.output_shape?.join(', ') || '?'}]`
      })
    } catch (e) {
      set({
        errors: ['验证请求失败: ' + (e as Error).message],
        statusMessage: '验证请求失败'
      })
    } finally {
      set({ isValidating: false })
    }
  },

  // ========== 生成代码 ==========
  generateCode: async () => {
    const state = get()
    if (state.layers.length === 0) {
      set({ generatedCode: null, statusMessage: '无节点可生成代码' })
      return
    }
    try {
      const codeNodes = state.layers.map((layer, index) => {
        const params: Record<string, any> = { ...layer.params }
        if (layer.type === 'block' && layer.blockData) {
          params.blockData = layer.blockData
        }
        return {
          id: layer.id,
          type: layer.type,
          data: {
            type: layer.type,
            params
          },
          position: computePosition(state.layers, index)
        }
      })

      const result = await generateCode(codeNodes as CanvasNode[])
      set({
        generatedCode: result,
        statusMessage: result.error ? `代码生成失败: ${result.error}` : '代码生成成功'
      })
    } catch (e) {
      set({
        generatedCode: null,
        statusMessage: '代码生成请求失败: ' + (e as Error).message
      })
    }
  },

  // ========== 清除所有数据 ==========
  clearAll: () => {
    nodeIdCounter = 0
    set({
      layers: [],
      nodes: [],
      selectedNodeId: null,
      isPropertyPanelOpen: false,
      errors: [],
      hoveredNodeId: null,
      statusMessage: '已清除所有数据',
      history: [],
      historyIndex: -1,
      validationResult: null,
      generatedCode: null,
      isLocked: false
    })
  }
}))

export const selectedNodeSelector = (state: CanvasState) =>
  state.nodes.find(n => n.id === state.selectedNodeId) || null