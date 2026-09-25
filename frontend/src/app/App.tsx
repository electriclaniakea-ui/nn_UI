import { useState, useRef, useEffect, useCallback } from 'react'
import { useCanvasStore, getMidpointBetweenNodes } from '@/features/canvas/store/canvasStore'
import { AddLayerDialog } from '@/features/canvas/components/AddLayerDialog'
import { PropertyPanel } from '@/features/canvas/components/PropertyPanel'
import { CodePreviewPanel } from '@/features/canvas/components/CodePreviewPanel'
import { TrainingCharts } from '@/features/canvas/components/TrainingCharts'
import { BlockEditor } from '@/features/canvas/components/BlockEditor'
import { SettingsPanel } from '@/features/canvas/components/SettingsPanel'
import { ProjectManager } from '@/features/canvas/components/ProjectManager'
import { TensorShapeVisualizer } from '@/features/canvas/components/TensorShapeVisualizer'
import {
  startTraining, stopTraining, getTrainingStatus, shutdownBackend,
  getLRSchedulePreview, exportModel, getAppData, saveAppData, deleteAppData,
  saveProject
} from '@/lib/api'

const CANVAS_DATA_KEY = 'canvas'
const NODE_SIZE = 80
const NODE_GAP = 48
const START_X = 80
const START_Y = 150

export default function App() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isTrainingDialogOpen, setIsTrainingDialogOpen] = useState(false)
  const [isTrainingLocked, setIsTrainingLocked] = useState(false)
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null)
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null)
  const [hasDragged, setHasDragged] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [currentProjectName, setCurrentProjectName] = useState<string>('')
  const canvasRef = useRef<HTMLDivElement>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const addButtonRef = useRef<HTMLButtonElement>(null)

  const {
    isPropertyPanelOpen,
    togglePropertyPanel,
    errors,
    removeNode,
    duplicateNode,
    selectedNodeId,
    selectNode,
    nodes,
    moveNodeUp,
    moveNodeDown,
    setHoveredNodeId,
    statusMessage,
    undo,
    redo,
    canUndo,
    canRedo,
    hoveredNodeId,
    validateGraph: validateGraphBackend,
    generateCode: generateCodeBackend,
    isValidating,
    validationResult,
    generatedCode,
    moveNodeToIndex,
    clearAll,
    layers,
    isBlockEditorOpen
  } = useCanvasStore()

  // 自动保存到后端文件（保存画布数据 layers）
  useEffect(() => {
    const saveToFile = async () => {
      try {
        await saveAppData(CANVAS_DATA_KEY, { layers })
      } catch (e) {
        console.error('自动保存失败:', e)
      }
    }

    if (layers.length > 0) {
      const timeoutId = setTimeout(saveToFile, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [layers])

  // 从后端文件加载（加载画布数据 layers）
  useEffect(() => {
    const loadFromFile = async () => {
      try {
        const data = await getAppData<{ layers: any[] }>(CANVAS_DATA_KEY)
        if (data && data.layers && Array.isArray(data.layers) && data.layers.length > 0) {
          const store = useCanvasStore.getState()
          store.clearAll()
          data.layers.forEach((layer: any) => {
            store.addNode(layer.type, layer.params || {})
          })
        }
      } catch (e) {
        console.error('加载失败:', e)
      }
    }
    loadFromFile()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = useCallback(async (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
      return
    }

    // 训练锁定状态下，禁止大部分编辑操作（但允许保存和查看）
    const isEditKey = ['Delete', 'Backspace', 'd', 'z', 'y', 'a'].includes(e.key) && !e.ctrlKey && e.key !== 's'
    const isCtrlEditKey = e.ctrlKey && ['d', 'z', 'y', 'a'].includes(e.key)
    if (isTrainingLocked && (isEditKey || isCtrlEditKey)) {
      e.preventDefault()
      alert('训练进行中，无法修改模型')
      return
    }

    // Ctrl+A 全选
    if (e.ctrlKey && e.key === 'a') {
      e.preventDefault()
      const allIds = nodes.filter(n => n.type !== 'input' && n.type !== 'output').map(n => n.id)
      useCanvasStore.setState({ selectedNodeIds: allIds, statusMessage: `已全选 ${allIds.length} 个节点` })
      return
    }

    // 多选删除
    const { selectedNodeIds } = useCanvasStore.getState()
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeIds.length > 0) {
      e.preventDefault()
      if (selectedNodeIds.length === 1) {
        removeNode(selectedNodeIds[0])
      } else {
        // 批量删除
        const store = useCanvasStore.getState()
        if (store.isLocked) return
        const newLayers = store.layers.filter(l => !selectedNodeIds.includes(l.id))
        // 更新链表指针
        for (let i = 0; i < newLayers.length - 1; i++) {
          newLayers[i] = { ...newLayers[i], next: newLayers[i + 1].id }
        }
        if (newLayers.length > 0) {
          newLayers[newLayers.length - 1] = { ...newLayers[newLayers.length - 1], next: null }
        }
        const newNodes = newLayers.map((layer, index) => ({
          id: layer.id,
          type: layer.type,
          data: {
            label: layer.label,
            type: layer.type,
            params: layer.params,
            index,
            validationError: null
          },
          position: { x: START_X + index * (NODE_SIZE + NODE_GAP), y: START_Y }
        }))
        useCanvasStore.setState({
          layers: newLayers,
          nodes: newNodes,
          selectedNodeIds: [],
          selectedNodeId: null,
          statusMessage: `已删除 ${selectedNodeIds.length} 个节点`
        })
      }
      return
    }

    if (selectedNodeId) {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        removeNode(selectedNodeId)
      } else if (e.ctrlKey && e.key === 'd') {
        e.preventDefault()
        duplicateNode(selectedNodeId)
      } else if (e.key === 'Escape') {
        selectNode(null)
        useCanvasStore.setState({ selectedNodeIds: [] })
      }
    }

    if (e.ctrlKey && e.key === 's') {
      e.preventDefault()
      const store = useCanvasStore.getState()
      if (store.layers.length === 0) {
        alert('画布为空，无需保存')
        return
      }
      const name = currentProjectName || window.prompt('请输入项目名称:', '未命名项目')
      if (!name) return
      try {
        const result = await saveProject(
          name,
          store.layers.map(l => ({ id: l.id, type: l.type, params: l.params })),
          ''
        )
        if (result && result.path) {
          setCurrentProjectName(name)
          alert('✅ 已保存到项目文件！')
        } else {
          alert('❌ 保存失败')
        }
      } catch (e) {
        alert('❌ 保存失败')
      }
    }

    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault()
      if (canUndo()) undo()
    }

    if (e.ctrlKey && e.key === 'y') {
      e.preventDefault()
      if (canRedo()) redo()
    }
  }, [selectedNodeId, removeNode, duplicateNode, selectNode, nodes, undo, redo, canUndo, canRedo, isTrainingLocked, currentProjectName])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // 清理双击定时器
  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current)
      }
    }
  }, [])

  // ========== 拖拽逻辑（基于单向链表）==========
  // 拖拽状态使用 ref 避免闭包问题
  const dragStateRef = useRef<{
    nodeId: string | null
    startX: number
    nodeStartX: number
    hasDragged: boolean
    currentVisualX: number
  }>({
    nodeId: null,
    startX: 0,
    nodeStartX: 0,
    hasDragged: false,
    currentVisualX: 0
  })

  // 双击检测
  const clickTimerRef = useRef<number | null>(null)
  const clickCountRef = useRef(0)

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (e.button !== 0) return

    const store = useCanvasStore.getState()
    const node = store.nodes.find(n => n.id === nodeId)
    if (!node) return

    // 如果系统被锁定，拒绝操作
    if (store.isLocked) {
      console.warn('[handleMouseDown] 系统锁定中，拒绝拖拽')
      return
    }

    // 初始化拖拽状态到 ref
    dragStateRef.current = {
      nodeId,
      startX: e.clientX,
      nodeStartX: node.position.x,
      hasDragged: false,
      currentVisualX: node.position.x
    }

    // 同步到 React state（用于UI反馈）
    setDraggingNodeId(nodeId)
    setHasDragged(false)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const dragState = dragStateRef.current
    if (!dragState.nodeId) return

    const deltaX = e.clientX - dragState.startX

    // 如果移动超过 3px，认为是拖拽
    if (Math.abs(deltaX) > 3 && !dragState.hasDragged) {
      dragState.hasDragged = true
      setHasDragged(true)
    }

    if (!dragState.hasDragged) return

    // 计算新的视觉位置（不修改链表，只用于视觉反馈）
    const newVisualX = dragState.nodeStartX + deltaX
    dragState.currentVisualX = newVisualX

    // 使用视觉位置更新（通过临时修改nodes实现拖拽视觉效果）
    // 注意：这里不修改链表 layers，只修改渲染用的 nodes 的位置
    const store = useCanvasStore.getState()
    const currentNodes = store.nodes
    const nodeIndex = currentNodes.findIndex(n => n.id === dragState.nodeId)
    if (nodeIndex === -1) return

    // 创建新的 nodes 数组，只修改被拖拽节点的位置
    const newNodes = currentNodes.map((n, idx) =>
      idx === nodeIndex
        ? { ...n, position: { ...n.position, x: newVisualX } }
        : n
    )

    // 直接设置 nodes（不经过历史记录，因为这是临时视觉状态）
    store.setNodes(newNodes, true)
  }

  const handleMouseUp = () => {
    const dragState = dragStateRef.current
    const currentDraggingId = dragState.nodeId

    // 立即清空拖拽状态（防止重复触发）
    dragStateRef.current = {
      nodeId: null,
      startX: 0,
      nodeStartX: 0,
      hasDragged: false,
      currentVisualX: 0
    }
    setDraggingNodeId(null)

    if (!currentDraggingId) return

    if (dragState.hasDragged) {
      // 拖拽结束，计算目标索引并调用链表移动
      const store = useCanvasStore.getState()
      const node = store.nodes.find(n => n.id === currentDraggingId)
      if (!node) {
        setHasDragged(false)
        return
      }

      const isBlockNode = node.type === 'block'
      const currentIndex = store.getLayerIndex(currentDraggingId)

      // 计算拖拽后的目标索引（基于视觉X坐标）
      const centerOffset = isBlockNode ? (NODE_SIZE * 2.5) / 2 : NODE_SIZE / 2
      const targetIndex = Math.round(
        (dragState.currentVisualX + centerOffset - START_X - NODE_SIZE / 2) / (NODE_SIZE + NODE_GAP)
      )
      const clampedTarget = Math.max(0, Math.min(targetIndex, store.layers.length - 1))

      console.log(`[handleMouseUp] 拖拽节点 ${currentDraggingId} 从索引 ${currentIndex} 到目标索引 ${clampedTarget}`)

      if (clampedTarget !== currentIndex) {
        // 调用链表移动操作
        const success = store.moveNodeToIndex(currentDraggingId, clampedTarget)
        if (!success) {
          console.warn('[handleMouseUp] 链表移动失败，回退到原位置')
          store.rebuildNodes()
        }
      } else {
        // 位置没变，重新渲染回原位（从链表重新生成）
        store.rebuildNodes()
      }
    } else {
      // 没有拖拽，检测单击或双击
      clickCountRef.current += 1

      if (clickCountRef.current === 1) {
        // 第一次点击，启动定时器
        clickTimerRef.current = window.setTimeout(() => {
          // 定时器到期，确认是单击
          if (clickCountRef.current === 1) {
            selectNode(currentDraggingId)
          }
          clickCountRef.current = 0
          clickTimerRef.current = null
        }, 250) // 250ms 内再次点击视为双击
      } else if (clickCountRef.current === 2) {
        // 第二次点击，确认是双击
        if (clickTimerRef.current) {
          clearTimeout(clickTimerRef.current)
          clickTimerRef.current = null
        }
        clickCountRef.current = 0
        // 双击打开 Block 编辑器
        const store = useCanvasStore.getState()
        const node = store.nodes.find(n => n.id === currentDraggingId)
        if (node && node.type === 'block') {
          store.openBlockEditor(currentDraggingId)
        }
      }
    }

    setHasDragged(false)
  }

  const handleClearStorage = async () => {
    if (window.confirm('确定要清除所有数据吗？此操作不可恢复！')) {
      await deleteAppData(CANVAS_DATA_KEY)
      // 使用 clearAll 完全重置所有状态
      clearAll()
      alert('已清除所有数据')
    }
  }

  const handleExit = async () => {
    if (!window.confirm('确定要退出程序吗？所有未保存的更改将丢失。')) {
      return
    }

    // 立即设置退出状态，显示退出画面
    setIsExiting(true)
    document.title = 'nn_UI - 已退出'

    // 1. 停止训练（如果正在训练）
    try {
      await stopTraining()
    } catch {
      // 忽略停止训练的错误
    }

    // 2. 清除所有后端文件数据
    await deleteAppData(CANVAS_DATA_KEY)
    await deleteAppData('settings')

    // 3. 重置应用状态
    clearAll()

    // 4. 调用后端关机接口关闭 Python 进程
    try {
      await shutdownBackend()
    } catch {
      // 后端可能已经关闭，忽略错误
    }

    // 5. 尝试关闭窗口（可能被浏览器阻止）
    setTimeout(() => {
      window.open('', '_self')?.close()
      window.close()
    }, 800)
  }

  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    if ((e.target as HTMLElement).closest('.node-card')) return
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId: '' })
  }

  // 退出画面
  if (isExiting) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-bg-canvas">
        <div className="text-5xl mb-4">👋</div>
        <h1 className="text-2xl font-semibold text-text-primary mb-2">nn_UI 已退出</h1>
        <p className="text-text-secondary mb-6">后端服务已停止，您可以手动关闭 CMD 窗口</p>
        <button
          onClick={() => window.close()}
          className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-md text-sm font-medium transition-all duration-200"
        >
          关闭页面
        </button>
      </div>
    )
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-bg-canvas font-sans overflow-hidden">
      {/* Header */}
      <header className="h-14 bg-bg-panel border-b border-layer-border flex items-center px-6 shadow-sm z-10">
        <div className="flex items-center gap-3 shrink-0">
          <h1 className="text-2xl font-semibold text-text-primary font-orbitron">
            nn<span className="text-accent">_UI</span>
          </h1>
          <span className="text-[10px] text-text-secondary mt-2 hidden sm:inline">
            Visual Neural Network Builder
          </span>
          <span className="text-[11px] text-green-600 bg-green-100 px-2 py-0.5 rounded font-medium">
            💾 自动保存已启用
          </span>
        </div>

        <div className="flex items-center gap-1 ml-auto">
          {/* 文件菜单组 */}
          <MenuGroup label="文件">
            <MenuButton
              onClick={async () => {
                const store = useCanvasStore.getState()
                if (store.layers.length === 0) {
                  alert('画布为空，无需保存')
                  return
                }
                const name = currentProjectName || window.prompt('请输入项目名称:', '未命名项目')
                if (!name) return
                try {
                  const result = await saveProject(
                    name,
                    store.layers.map(l => ({ id: l.id, type: l.type, params: l.params })),
                    ''
                  )
                  if (result && result.path) {
                    setCurrentProjectName(name)
                    alert('✅ 保存成功！')
                  } else {
                    alert('❌ 保存失败')
                  }
                } catch (e) {
                  alert('❌ 保存失败')
                }
              }}
              icon="💾"
              label="保存"
              title="保存项目 (Ctrl+S)"
            />
            <MenuButton
              onClick={() => {
                if (layers.length > 0 && !window.confirm('新建项目将清空当前画布，是否继续？')) {
                  return
                }
                clearAll()
                setCurrentProjectName('')
                useCanvasStore.setState({ statusMessage: '已新建项目' })
              }}
              icon="📄"
              label="新建"
              title="新建项目"
            />
            <MenuButton
              onClick={async () => {
                const store = useCanvasStore.getState()
                if (store.layers.length === 0) {
                  alert('画布为空，无需另存')
                  return
                }
                const name = window.prompt('请输入新项目名称:', currentProjectName ? `${currentProjectName}_副本` : '未命名项目')
                if (!name) return
                try {
                  const result = await saveProject(
                    name,
                    store.layers.map(l => ({ id: l.id, type: l.type, params: l.params })),
                    ''
                  )
                  if (result && result.path) {
                    setCurrentProjectName(name)
                    alert('✅ 另存为成功！')
                  } else {
                    alert('❌ 另存为失败')
                  }
                } catch (e) {
                  alert('❌ 另存为失败')
                }
              }}
              icon="📋"
              label="另存为"
              title="另存为"
            />
          </MenuGroup>

          {/* 项目菜单组 */}
          <MenuGroup label="项目">
            <MenuButton
              onClick={() => setIsProjectManagerOpen(true)}
              icon="📁"
              label="项目管理"
              title="打开项目管理器"
            />
          </MenuGroup>

          {/* 操作菜单组 */}
          <MenuGroup label="操作">
            <MenuButton
              onClick={() => { if (canUndo()) undo() }}
              disabled={!canUndo()}
              icon="↩️"
              label="撤销"
              title="撤销 (Ctrl+Z)"
            />
            <MenuButton
              onClick={() => { if (canRedo()) redo() }}
              disabled={!canRedo()}
              icon="↪️"
              label="重做"
              title="重做 (Ctrl+Y)"
            />
            <MenuButton
              onClick={() => generateCodeBackend()}
              disabled={nodes.length === 0}
              icon="📄"
              label="生成代码"
              title="生成 PyTorch 代码"
            />
            <MenuButton
              onClick={() => {
                const canvas = canvasRef.current
                if (!canvas) return
                import('html-to-image').then(({ toPng }) => {
                  toPng(canvas, { backgroundColor: '#F8F6F0' }).then(dataUrl => {
                    const link = document.createElement('a')
                    link.download = `nn-ui-${Date.now()}.png`
                    link.href = dataUrl
                    link.click()
                  })
                }).catch(() => alert('导出失败，请安装 html-to-image'))
              }}
              icon="🖼️"
              label="导出PNG"
              title="导出画布为PNG"
            />
            <MenuButton
              onClick={() => {
                if (isTrainingLocked) {
                  alert('训练进行中，无法修改模型')
                  return
                }
                setIsAddDialogOpen(true)
              }}
              disabled={isTrainingLocked}
              icon="➕"
              label="新建层"
              title="添加新层"
            />
          </MenuGroup>

          {/* 设置菜单组 */}
          <MenuGroup label="设置">
            <MenuButton
              onClick={() => setIsSettingsOpen(true)}
              icon="⚙️"
              label="设置"
              title="打开设置面板"
            />
          </MenuGroup>

          {/* 分隔线 */}
          <div className="w-px h-8 bg-layer-border mx-2" />

          {/* 常用按钮组 - 框起来 */}
          <div className="flex items-center gap-1 px-2 py-1 border border-accent/30 bg-accent/5 rounded-lg shrink-0">
            <MenuButton
              onClick={() => validateGraphBackend()}
              disabled={isValidating || nodes.length === 0}
              icon={isValidating ? '⏳' : validationResult && validationResult.errors.length === 0 ? '✅' : '🔍'}
              label={isValidating ? '验证中...' : '验证'}
              title="验证网络结构"
              highlight
              inToolbar
            />
            <MenuButton
              onClick={() => {
                if (isTrainingLocked) {
                  alert('训练进行中，请等待训练完成后再操作')
                  return
                }
                setIsTrainingDialogOpen(true)
              }}
              disabled={isTrainingLocked}
              icon={isTrainingLocked ? '🔒' : '✓'}
              label={isTrainingLocked ? '训练中...' : '保存并训练'}
              title="保存并训练"
              highlight
              inToolbar
            />
          </div>

          {/* 分隔线 */}
          <div className="w-px h-8 bg-layer-border mx-2 shrink-0" />

          {/* 退出 */}
          <MenuButton
            onClick={handleExit}
            icon="🚪"
            label="退出"
            title="注销所有进程并退出程序"
            danger
            inToolbar
          />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex relative overflow-hidden">
        <div
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onContextMenu={handleCanvasContextMenu}
          className={`flex-1 bg-bg-canvas relative overflow-auto ${isTrainingLocked ? 'pointer-events-none' : ''}`}
          style={{ cursor: draggingNodeId ? 'grabbing' : 'default' }}
        >
          <CanvasArea
            onAddLayer={() => {
              if (isTrainingLocked) {
                alert('训练进行中，无法修改模型')
                return
              }
              setIsAddDialogOpen(true)
            }}
            onContextMenu={setContextMenu}
            onNodeMouseDown={handleMouseDown}
            addButtonRef={addButtonRef}
          />
          {isTrainingLocked && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-50 pointer-events-auto">
              <div className="bg-bg-panel border border-layer-border rounded-xl shadow-2xl px-8 py-6 text-center animate-zoom-in">
                <div className="text-4xl mb-3">🔒</div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">训练进行中</h3>
                <p className="text-sm text-text-secondary mb-4">模型已被锁定，训练完成后可继续编辑</p>
                <button
                  onClick={() => setIsTrainingDialogOpen(true)}
                  className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-md text-sm font-medium transition-colors"
                >
                  查看训练进度
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Property Panel */}
        {isPropertyPanelOpen && (
          <aside className="w-80 bg-bg-panel border-l border-layer-border shadow-lg animate-slide-in-right flex flex-col z-20">
            <PropertyPanel onClose={() => togglePropertyPanel(false)} />
          </aside>
        )}

        {/* Hover Tooltip */}
        {hoveredNodeId && <HoverTooltip nodeId={hoveredNodeId} />}

        {/* Context Menu */}
        {contextMenu && (
          <div
            ref={contextMenuRef}
            className="fixed bg-bg-panel border border-layer-border rounded-lg shadow-xl p-1 min-w-[160px] animate-pop-in"
            style={{ left: contextMenu.x, top: contextMenu.y, zIndex: 200 }}
            onContextMenu={(e) => e.preventDefault()}
          >
            {contextMenu.nodeId ? (
              <>
                <ContextMenuItem icon="📋" label="复制节点" onClick={() => { duplicateNode(contextMenu.nodeId); setContextMenu(null) }} disabled={isTrainingLocked} />
                <ContextMenuItem icon="🗑️" label="删除节点" onClick={() => { removeNode(contextMenu.nodeId); setContextMenu(null) }} isDanger disabled={isTrainingLocked} />
                <div className="h-px bg-layer-border my-1" />
                <ContextMenuItem icon="⬆️" label="上移一层" onClick={() => { moveNodeUp(contextMenu.nodeId); setContextMenu(null) }} disabled={isTrainingLocked} />
                <ContextMenuItem icon="⬇️" label="下移一层" onClick={() => { moveNodeDown(contextMenu.nodeId); setContextMenu(null) }} disabled={isTrainingLocked} />
                <div className="h-px bg-layer-border my-1" />
                <ContextMenuItem icon="📦" label="打包为Block" onClick={() => {
                  if (isTrainingLocked) {
                    alert('训练进行中，无法修改模型')
                    setContextMenu(null)
                    return
                  }
                  const { selectedNodeIds, packNodesAsBlock } = useCanvasStore.getState()
                  if (selectedNodeIds.length >= 2) {
                    packNodesAsBlock(selectedNodeIds)
                  } else {
                    alert('请按住 Ctrl 选择至少 2 个节点后再打包')
                  }
                  setContextMenu(null)
                }} disabled={isTrainingLocked} />
                <ContextMenuItem icon="🔀" label="添加分支" onClick={() => { alert('添加分支功能开发中...'); setContextMenu(null) }} disabled={isTrainingLocked} />
                <ContextMenuItem icon="📄" label="查看代码片段" onClick={() => { generateCodeBackend(); setContextMenu(null) }} />
                <ContextMenuItem icon="📊" label="查看输入输出形状" onClick={() => { validateGraphBackend(); setContextMenu(null) }} />
              </>
            ) : (
              <>
                <ContextMenuItem icon="➕" label="添加层" onClick={() => { setIsAddDialogOpen(true); setContextMenu(null) }} disabled={isTrainingLocked} />
                <ContextMenuItem icon="📋" label="粘贴" onClick={() => { alert('粘贴功能开发中...'); setContextMenu(null) }} disabled={isTrainingLocked} />
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="h-[140px] bg-bg-panel border-t border-layer-border flex items-center justify-between px-6">
        <div className="flex flex-col gap-2 flex-1">
          <span className="text-sm text-text-secondary">{statusMessage}</span>
          <span className="text-xs text-text-secondary">
            节点数: {nodes.length} | 快捷键: Delete删除 Ctrl+D复制 Ctrl+S保存 Ctrl+Z撤销 Ctrl+Y重做 Esc取消
          </span>
          {errors.length > 0 && (
            <span className="text-sm text-red-600 font-medium">⚠ {errors.length} 个错误</span>
          )}
        </div>
        <ThumbnailPreview nodes={nodes} />
      </footer>

      {/* Dialogs */}
      <AddLayerDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />

      {isTrainingDialogOpen && (
        <TrainingDialog
          open={isTrainingDialogOpen}
          onOpenChange={(open) => {
            setIsTrainingDialogOpen(open)
          }}
          onTrainingChange={setIsTrainingLocked}
        />
      )}

      {/* Code Preview Dialog */}
      {generatedCode && (
        <CodePreviewPanel
          code={generatedCode}
          onClose={() => useCanvasStore.setState({ generatedCode: null })}
        />
      )}

      {/* Project Manager Dialog */}
      {isProjectManagerOpen && (
        <ProjectManager
          onClose={() => setIsProjectManagerOpen(false)}
          onProjectLoaded={(name) => setCurrentProjectName(name)}
        />
      )}

      {/* Block Editor Dialog */}
      {isBlockEditorOpen && (
        <BlockEditor
          onClose={() => useCanvasStore.getState().closeBlockEditor()}
        />
      )}

      {/* Settings Dialog */}
      {isSettingsOpen && (
        <SettingsPanel
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  )
}

// Menu Group Component
function MenuGroup({ label, children }: { label: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 rounded-md text-sm font-medium text-text-primary hover:bg-bg-canvas transition-all duration-150 border border-transparent hover:border-layer-border"
      >
        {label}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-bg-panel border border-layer-border rounded-lg shadow-xl p-1 min-w-[160px] z-[100] animate-pop-in">
          {children}
        </div>
      )}
    </div>
  )
}

// Menu Button Component
function MenuButton({ onClick, icon, label, disabled = false, title, danger = false, highlight = false, inToolbar = false }: {
  onClick: () => void
  icon: string
  label: string
  disabled?: boolean
  title?: string
  danger?: boolean
  highlight?: boolean
  inToolbar?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all duration-150 whitespace-nowrap ${
        inToolbar
          ? disabled
            ? 'text-text-tertiary cursor-not-allowed opacity-50'
            : danger
              ? 'text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200'
              : highlight
                ? 'text-accent font-medium hover:bg-accent/10'
                : 'text-text-primary hover:bg-bg-canvas border border-transparent hover:border-layer-border'
          : disabled
            ? 'w-full text-text-tertiary cursor-not-allowed opacity-50 text-left'
            : danger
              ? 'w-full text-red-600 hover:bg-red-50 text-left'
              : highlight
                ? 'w-full text-accent font-medium hover:bg-accent/10 text-left'
                : 'w-full text-text-primary hover:bg-bg-canvas text-left'
      }`}
      title={title || label}
    >
      <span className="text-base">{icon}</span>
      <span>{label}</span>
    </button>
  )
}

// Thumbnail Preview
function ThumbnailPreview({ nodes }: { nodes: any[] }) {
  const scale = 0.12
  const offsetX = 10
  const offsetY = 10

  const sortedNodes = [...nodes].sort((a, b) => a.position.x - b.position.x)

  return (
    <div className="w-[200px] h-[120px] bg-bg-canvas border border-layer-border rounded-md relative overflow-hidden shrink-0">
      <svg width="200" height="120" className="absolute top-0 left-0">
        {sortedNodes.map((node) => {
          const x = offsetX + node.position.x * scale
          const y = offsetY + node.position.y * scale
          const size = NODE_SIZE * scale

          if (node.type === 'input' || node.type === 'output') {
            const points = node.type === 'input'
              ? `${x + size},${y} ${x},${y + size / 2} ${x + size},${y + size}`
              : `${x},${y} ${x + size},${y + size / 2} ${x},${y + size}`
            return (
              <g key={node.id}>
                <polygon points={points} fill="#FFFCF6" stroke="#D8CDB8" strokeWidth="0.5" />
              </g>
            )
          }

          const cx = x + size / 2
          const cy = y + size / 2
          const half = size / 2
          return (
            <g key={node.id}>
              <rect
                x={cx - half * 0.7}
                y={cy - half * 0.7}
                width={size * 0.7}
                height={size * 0.7}
                fill="#FFFCF6"
                stroke="#D8CDB8"
                strokeWidth="0.5"
                transform={`rotate(45, ${cx}, ${cy})`}
              />
            </g>
          )
        })}
      </svg>

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-text-tertiary text-[9px] text-center p-1">
          缩略图
        </div>
      )}
    </div>
  )
}

// Context Menu Item
function ContextMenuItem({ icon, label, onClick, isDanger = false, disabled = false }: {
  icon: string
  label: string
  onClick: () => void
  isDanger?: boolean
  disabled?: boolean
}) {
  return (
    <button
      onClick={() => {
        if (!disabled) onClick()
      }}
      disabled={disabled}
      className={`w-full px-3 py-2 rounded text-[13px] text-left flex items-center gap-2 transition-colors duration-100
        ${disabled
          ? 'text-text-tertiary cursor-not-allowed opacity-50'
          : isDanger
            ? 'text-red-600 hover:bg-red-50'
            : 'text-text-primary hover:bg-bg-canvas'
        }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  )
}

// Canvas Area
function CanvasArea({
  onAddLayer,
  onContextMenu,
  onNodeMouseDown,
  addButtonRef
}: {
  onAddLayer: () => void
  onContextMenu: (menu: { x: number; y: number; nodeId: string } | null) => void
  onNodeMouseDown: (e: React.MouseEvent, nodeId: string) => void
  addButtonRef: React.RefObject<HTMLButtonElement | null>
}) {
  const { nodes, layers, addNode, selectNode } = useCanvasStore()

  const handleCanvasClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.node-card') || (e.target as HTMLElement).closest('.add-button')) {
      return
    }
    selectNode(null)
  }

  const lastNode = nodes[nodes.length - 1]
  const addButtonX = lastNode
    ? lastNode.position.x + (lastNode.type === 'block' ? NODE_SIZE * 2.5 : NODE_SIZE) + NODE_GAP
    : START_X

  // 计算容器需要的最小宽度，确保所有节点和圆点都能显示
  const containerWidth = nodes.length > 0 ? addButtonX + 60 : 400

  return (
    <div
      onClick={handleCanvasClick}
      className="min-w-full min-h-full p-8 relative flex items-center"
    >
      <div className="relative" style={{ height: NODE_SIZE + 100, width: Math.max(containerWidth, 400) }}>
        {nodes.map((node, index) => (
          <NodeComponent
            key={node.id}
            node={node}
            index={index}
            onContextMenu={onContextMenu}
            onMouseDown={onNodeMouseDown}
          />
        ))}

        {/* 渲染节点间的张量形状可视化点 */}
        {layers.map((_, index) => {
          const midpoint = getMidpointBetweenNodes(layers, index)
          if (!midpoint) return null
          return (
            <TensorShapeVisualizer
              key={`shape-${index}`}
              nodeIndex={index}
              position={midpoint}
            />
          )
        })}

        {/* Add Button */}
        <button
          ref={addButtonRef}
          className="add-button absolute w-12 h-12 rounded-full bg-accent text-white border-none text-2xl font-light flex items-center justify-center shadow-lg transition-all duration-150 hover:scale-110 hover:shadow-xl active:scale-95 z-50"
          style={{
            left: addButtonX,
            top: NODE_SIZE / 2 + 50 - 24,
          }}
          onClick={(e) => {
            e.stopPropagation()
            onAddLayer()
          }}
        >
          +
        </button>
      </div>

      {/* Empty State */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-text-secondary mb-4">🎨 画布为空</p>
            <p className="text-sm text-text-secondary mb-6">
              点击下方按钮添加你的第一个神经网络层<br />
              数据将按从左到右的单向流水线流动
            </p>
            <button
              onClick={() => addNode('input', {})}
              className="px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-lg text-[15px] font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
            >
              ➕ 添加第一个层
            </button>

            <div className="mt-6 text-left max-w-[400px] mx-auto">
              <h4 className="text-text-primary mb-2 text-sm">💡 提示：</h4>
              <ul className="text-text-secondary text-[13px] leading-relaxed pl-5 list-disc">
                <li>所有更改会自动保存到浏览器</li>
                <li>使用 Ctrl+S 手动保存</li>
                <li>刷新页面后自动加载上次的数据</li>
                <li>支持拖拽移动节点位置</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Node Component
function NodeComponent({
  node,
  index,
  onContextMenu,
  onMouseDown
}: {
  node: any
  index: number
  onContextMenu: (menu: { x: number; y: number; nodeId: string } | null) => void
  onMouseDown: (e: React.MouseEvent, nodeId: string) => void
}) {
  const { selectedNodeId, selectedNodeIds, setHoveredNodeId, toggleNodeSelection, selectNode, openBlockEditor } = useCanvasStore()
  const isSelected = selectedNodeId === node.id || selectedNodeIds.includes(node.id)
  const hasError = !!node.data.validationError

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onContextMenu({ x: e.clientX, y: e.clientY, nodeId: node.id })
  }

  const handleMouseDownWrapper = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      toggleNodeSelection(node.id)
      return
    }
    onMouseDown(e, node.id)
  }

  const handleDoubleClick = () => {
    if (node.type === 'block') {
      openBlockEditor(node.id)
    }
  }

  const isTriangle = node.type === 'input' || node.type === 'output'
  const isBlock = node.type === 'block'

  const getParamDisplay = () => {
    const params = node.data.params || {}
    switch (node.type) {
      case 'linear': return `${params.in_features || '?'}→${params.out_features || '?'}`
      case 'conv2d': return `${params.in_channels || '?'}→${params.out_channels || '?'}`
      case 'input': return `[${(params.shape || []).join(', ')}]`
      case 'output': return `${params.num_classes || '?'}类`
      case 'max_pool2d':
      case 'avg_pool2d': return `k=${params.kernel_size || '?'}`
      case 'dropout': return `p=${params.p || '?'}`
      case 'multihead_attention': return `h=${params.num_heads || '?'} d=${params.embed_dim || '?'}`
      case 'concat': return `dim=${params.dim || '?'}`
      case 'add': return '+'
      case 'block': return `${params.name || 'Block'} (${params.layerCount || 0})`
      default: return ''
    }
  }

  const borderColor = hasError ? '#DC2626' : isSelected ? '#7C3AED' : '#D8CDB8'
  const borderWidth = hasError ? 2 : isSelected ? 2 : 1

  if (isTriangle) {
    return (
      <div
        className={`node-card absolute w-16 h-16 cursor-grab select-none transition-all duration-150
          ${isSelected ? 'scale-110 z-50' : 'hover:scale-105 z-40'}`}
        style={{
          left: node.position.x,
          top: node.position.y,
          zIndex: index + 1,
        }}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setHoveredNodeId(node.id)}
        onMouseLeave={() => setHoveredNodeId(null)}
        onMouseDown={handleMouseDownWrapper}
      >
        <svg width="64" height="64" viewBox="0 0 64 64">
          {node.type === 'input' ? (
            <polygon
              points="56,4 8,32 56,60"
              fill="url(#triangleGrad)"
              stroke={borderColor}
              strokeWidth={borderWidth}
            />
          ) : (
            <polygon
              points="8,4 56,32 8,60"
              fill="url(#triangleGrad)"
              stroke={borderColor}
              strokeWidth={borderWidth}
            />
          )}
          <defs>
            <linearGradient id="triangleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFCF6" />
              <stop offset="100%" stopColor="#EFE7D8" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] text-text-primary font-semibold">
            {node.type === 'input' ? 'Input' : 'Output'}
          </span>
          <span className="text-[8px] text-text-secondary">{getParamDisplay()}</span>
        </div>
        {/* Error indicator */}
        {hasError && (
          <div className="absolute -top-1 -right-1 text-red-600 text-xs font-bold pointer-events-none z-50">⚠</div>
        )}
      </div>
    )
  }

  if (isBlock) {
    // Block 比普通节点宽，需要更高的 z-index 避免被后面的节点盖住
    // 但不应超过弹窗的 z-index (弹窗通常 50-100)
    const blockZIndex = isSelected ? 40 : 30
    return (
      <div
        className={`node-card absolute cursor-grab select-none transition-all duration-150
          ${isSelected ? 'scale-[1.02]' : 'hover:scale-[1.01]'}`}
        style={{
          left: node.position.x,
          top: node.position.y - 20, // 稍微上移，视觉上居中
          width: NODE_SIZE * 2.5,
          height: NODE_SIZE * 1.5,
          zIndex: blockZIndex,
        }}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setHoveredNodeId(node.id)}
        onMouseLeave={() => setHoveredNodeId(null)}
        onMouseDown={handleMouseDownWrapper}
        onDoubleClick={handleDoubleClick}
      >
        <div className="w-full h-full relative">
          {/* Block background */}
          <div
            className="w-full h-full rounded-2xl border-2 border-dashed transition-colors duration-150"
            style={{
              background: isSelected ? 'rgba(167, 139, 250, 0.12)' : 'rgba(167, 139, 250, 0.06)',
              borderColor: hasError ? '#DC2626' : isSelected ? '#7C3AED' : '#A78BFA',
              borderWidth: hasError ? 3 : 2,
            }}
          />
          {/* Block label - 可编辑 */}
          <input
            className="absolute top-2 left-3 text-xs font-semibold text-accent bg-transparent border-none outline-none w-32"
            value={node.data.params?.name || 'Block'}
            onChange={(e) => {
              const store = useCanvasStore.getState()
              store.updateNodeData(node.id, {
                params: { ...node.data.params, name: e.target.value }
              })
            }}
            onClick={(e) => e.stopPropagation()}
          />
          {/* Layer count - 可编辑 */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-sm text-text-secondary">
              {node.data.params?.layerCount || 0} 层
            </span>
          </div>
          {/* Left port */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-accent-soft border-2 border-accent" />
          {/* Right port */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 rounded-full bg-accent-soft border-2 border-accent" />
          {/* Error indicator */}
          {hasError && (
            <div className="absolute -top-1 -right-1 text-red-600 text-xs font-bold pointer-events-none" style={{zIndex: 9999}}>⚠</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`node-card absolute cursor-grab select-none transition-all duration-150
        ${isSelected ? 'scale-110 z-50' : 'hover:scale-105 z-40'}
        ${hasError ? 'animate-flash-red' : ''}`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: NODE_SIZE,
        height: NODE_SIZE,
        zIndex: index + 1,
      }}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setHoveredNodeId(node.id)}
      onMouseLeave={() => setHoveredNodeId(null)}
      onMouseDown={handleMouseDownWrapper}
    >
      <div className="w-full h-full relative">
        {/* Diamond shape */}
        <div
          className={`w-full h-full transition-all duration-150
            ${isSelected ? 'shadow-[0_8px_20px_rgba(124,58,237,0.25)]' : 'shadow-[0_4px_12px_rgba(90,70,40,0.10)] hover:shadow-[0_6px_16px_rgba(90,70,40,0.15)]'}`}
          style={{
            background: 'linear-gradient(135deg, #FFFCF6 0%, #EFE7D8 100%)',
            border: `${borderWidth}px solid ${borderColor}`,
            borderRadius: '4px',
            transform: 'rotate(45deg)',
          }}
        />

        {/* Content (not rotated) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-[11px] text-text-secondary font-semibold mb-0.5">{node.data.type}</div>
          <div className="text-[10px] text-text-secondary text-center overflow-hidden text-ellipsis whitespace-nowrap max-w-[60px]">
            {getParamDisplay()}
          </div>
          <div className="text-[9px] text-text-tertiary mt-0.5">
            #{node.data.index !== undefined ? node.data.index + 1 : index + 1}
          </div>
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full border-2 border-white pointer-events-none" />
        )}

        {/* Error indicator */}
        {hasError && (
          <div className="absolute -top-1 -right-1 text-red-600 text-xs font-bold pointer-events-none z-50" title={node.data.validationError}>⚠</div>
        )}
      </div>
    </div>
  )
}

// Hover Tooltip
function HoverTooltip({ nodeId }: { nodeId: string }) {
  const { nodes } = useCanvasStore()
  const node = nodes.find(n => n.id === nodeId)
  if (!node) return null

  const params = node.data.params || {}
  const paramEntries = Object.entries(params).slice(0, 3)
  const hasError = !!node.data.validationError

  return (
    <div className={`fixed bottom-[160px] left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-[13px] z-[3000] pointer-events-none shadow-lg max-w-[300px] ${hasError ? 'bg-red-700' : 'bg-text-primary'} text-white`}>
      <div className="font-semibold mb-1">{node.data.label} ({node.type})</div>
      {paramEntries.map(([key, value]) => (
        <div key={key} className="text-xs opacity-90">{key}: {String(value)}</div>
      ))}
      {hasError && (
        <div className="text-xs text-red-200 mt-1 font-medium">⚠ {node.data.validationError}</div>
      )}
    </div>
  )
}

// Training Dialog
function TrainingDialog({ open, onOpenChange, onTrainingChange }: { open: boolean; onOpenChange: (open: boolean) => void; onTrainingChange?: (isTraining: boolean) => void }) {
  const { nodes, setStatusMessage } = useCanvasStore()
  const [isTraining, setIsTraining] = useState(false)
  const [trainStatus, setTrainStatus] = useState<any>(null)
  const [hasTrained, setHasTrained] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [lrPreviewData, setLrPreviewData] = useState<{ step: number; lr: number }[]>([])
  const [config, setConfig] = useState({
    learningRate: 0.001,
    batchSize: 32,
    epochs: 10,
    weightDecay: 0.0001,
    optimizer: 'adam',
    lossFunction: 'cross_entropy',
    lrScheduler: 'none',
    amp: false,
    gradClip: true,
    earlyStopping: true,
    saveBest: true,
    datasetType: 'builtin' as 'builtin' | 'imagefolder' | 'csv' | 'numpy' | 'huggingface',
    dataset: 'MNIST',
    datasetConfig: {
      trainDir: '',
      valDir: '',
      csvPath: '',
      imageColumn: 'image_path',
      labelColumn: 'label',
      npyPath: '',
      xTrainKey: 'x_train',
      yTrainKey: 'y_train',
      xValKey: 'x_val',
      yValKey: 'y_val',
      hfDatasetName: 'mnist',
      hfConfigName: '',
      hfSplit: 'train',
      hfImageColumn: 'image',
      hfLabelColumn: 'label',
    },
  })

  // Poll training status
  useEffect(() => {
    if (!isTraining) return
    const interval = setInterval(async () => {
      const status = await getTrainingStatus()
      if (status) {
        setTrainStatus(status)
        if (!status.isTraining) {
          setIsTraining(false)
          setHasTrained(true)
          setStatusMessage('训练完成')
          onTrainingChange?.(false)
        }
      }
    }, 500)
    return () => clearInterval(interval)
  }, [isTraining])

  // Fetch LR schedule preview when scheduler changes
  useEffect(() => {
    if (config.lrScheduler === 'none') {
      setLrPreviewData([])
      return
    }
    const fetchPreview = async () => {
      // 将前端显示的调度器名称映射为后端 API 参数
      const schedulerMap: Record<string, string> = {
        'StepLR': 'step_lr',
        'CosineAnnealing': 'cosine',
        'ReduceLROnPlateau': 'plateau',
        'OneCycle': 'one_cycle',
      }
      const schedulerParam = schedulerMap[config.lrScheduler] || config.lrScheduler
      const data = await getLRSchedulePreview(
        schedulerParam,
        config.epochs,
        100,
        config.learningRate
      )
      if (data) {
        setLrPreviewData(data)
      }
    }
    fetchPreview()
  }, [config.lrScheduler, config.epochs, config.learningRate])

  if (!open) return null

  const handleStartTraining = async () => {
    if (nodes.length === 0) {
      alert('请先添加网络层')
      return
    }
    // 验证自定义数据集配置
    if (config.datasetType === 'imagefolder') {
      if (!config.datasetConfig.trainDir) {
        alert('请选择训练集文件夹')
        return
      }
    } else if (config.datasetType === 'csv') {
      if (!config.datasetConfig.csvPath) {
        alert('请选择 CSV 文件')
        return
      }
    } else if (config.datasetType === 'numpy') {
      if (!config.datasetConfig.npyPath) {
        alert('请选择 NumPy 文件')
        return
      }
    } else if (config.datasetType === 'huggingface') {
      if (!config.datasetConfig.hfDatasetName) {
        alert('请输入 Hugging Face 数据集名称')
        return
      }
    }

    // 构建 graph_nodes 从画布节点
    const graphNodes = nodes.map(n => ({
      id: n.id,
      data: {
        type: n.data?.type || 'linear',
        params: n.data?.params || {},
      }
    }))

    setIsTraining(true)
    onTrainingChange?.(true)

    // 将前端显示的调度器名称映射为后端 API 参数
    const schedulerMap: Record<string, string> = {
      'StepLR': 'step_lr',
      'CosineAnnealing': 'cosine',
      'ReduceLROnPlateau': 'plateau',
      'OneCycle': 'one_cycle',
    }
    const lrSchedulerParam = config.lrScheduler === 'none' ? undefined : (schedulerMap[config.lrScheduler] || config.lrScheduler)

    const result = await startTraining({
      dataset: config.dataset,
      dataset_type: config.datasetType,
      dataset_config: config.datasetConfig,
      optimizer: config.optimizer,
      learning_rate: config.learningRate,
      batch_size: config.batchSize,
      epochs: config.epochs,
      lr_scheduler: lrSchedulerParam,
      early_stopping: config.earlyStopping,
      patience: 5,
      loss_function: config.lossFunction,
      weight_decay: config.weightDecay,
      graph_nodes: graphNodes,
    })
    if (result && result.train_id) {
      setStatusMessage(`训练已启动: ${result.train_id}`)
    } else {
      setIsTraining(false)
      onTrainingChange?.(false)
      const errorMsg = result?.error || '未知错误'
      setStatusMessage('训练启动失败: ' + errorMsg)
      alert('❌ 训练启动失败:\n\n' + errorMsg)
    }
  }

  const handleStopTraining = async () => {
    await stopTraining()
    setIsTraining(false)
    onTrainingChange?.(false)
    setHasTrained(true)
    setStatusMessage('训练已停止')
  }

  const handleExport = async (format: 'onnx' | 'torchscript') => {
    setExporting(true)
    try {
      const result = await exportModel(format)
      if (result && 'path' in result) {
        setStatusMessage(`模型已导出: ${result.path}`)
        alert(`导出成功！\n格式: ${result.format}\n路径: ${result.path}\n输入形状: [${result.input_shape.join(', ')}]`)
      } else if (result && 'error' in result) {
        alert('导出失败: ' + result.error)
      } else {
        alert('导出失败，请检查后端日志')
      }
    } catch (e) {
      alert('导出出错: ' + (e as Error).message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isTraining) {
          onOpenChange(false)
        }
      }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
    >
      <div
        className="bg-bg-panel rounded-xl shadow-2xl flex flex-col animate-zoom-in"
        style={{ width: '90vw', maxWidth: '800px', height: '85vh', maxHeight: '700px' }}
      >
        {/* Header */}
        <div className="h-14 border-b border-layer-border flex items-center justify-between px-6 shrink-0">
          <h2 className="text-lg font-semibold text-text-primary">
            {isTraining ? '🔥 训练中...' : '🎯 训练配置'}
          </h2>
          <button
            onClick={() => {
              if (!isTraining) {
                onOpenChange(false)
              }
            }}
            disabled={isTraining}
            className={`p-1.5 rounded-md text-lg transition-colors ${
              isTraining
                ? 'text-text-tertiary cursor-not-allowed opacity-50'
                : 'hover:bg-bg-canvas text-text-secondary'
            }`}
            title={isTraining ? '训练进行中，无法关闭' : '关闭'}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {(isTraining || hasTrained) && trainStatus ? (
            <TrainingMonitor status={trainStatus} isTraining={isTraining} />
          ) : (
            <>
              {/* 数据集选择 */}
              <div className="border border-layer-border rounded-lg p-4 bg-bg-canvas space-y-4">
                <h3 className="text-sm font-semibold text-text-primary">📁 数据集配置</h3>

                {/* 数据集类型 */}
                <div>
                  <label className="block text-[13px] font-medium text-text-primary mb-1.5">数据集来源</label>
                  <select value={config.datasetType}
                    onChange={e => setConfig({ ...config, datasetType: e.target.value as any, dataset: e.target.value === 'builtin' ? 'MNIST' : e.target.value === 'huggingface' ? 'mnist' : '' })}
                    className="w-full px-3 py-2.5 border border-layer-border rounded-md text-sm outline-none bg-bg-panel">
                    <option value="builtin">内置数据集</option>
                    <option value="imagefolder">文件夹分类格式 (ImageFolder)</option>
                    <option value="csv">CSV + 图片路径</option>
                    <option value="numpy">NumPy 数组 (.npy/.npz)</option>
                    <option value="huggingface">Hugging Face Datasets</option>
                  </select>
                </div>

                {/* 内置数据集选择 */}
                {config.datasetType === 'builtin' && (
                  <div>
                    <label className="block text-[13px] font-medium text-text-primary mb-1.5">选择数据集</label>
                    <select value={config.dataset}
                      onChange={e => setConfig({ ...config, dataset: e.target.value })}
                      className="w-full px-3 py-2.5 border border-layer-border rounded-md text-sm outline-none bg-bg-panel">
                      <option value="MNIST">MNIST - 手写数字 (28x28, 10类)</option>
                      <option value="FashionMNIST">Fashion-MNIST - 时尚物品 (28x28, 10类)</option>
                      <option value="CIFAR10">CIFAR-10 - 彩色图像 (32x32, 10类)</option>
                      <option value="CIFAR100">CIFAR-100 - 彩色图像 (32x32, 100类)</option>
                    </select>
                  </div>
                )}

                {/* ImageFolder 配置 */}
                {config.datasetType === 'imagefolder' && (
                  <div className="space-y-3">
                    <PathInputField
                      label="训练集文件夹"
                      value={config.datasetConfig.trainDir}
                      onChange={v => setConfig({ ...config, datasetConfig: { ...config.datasetConfig, trainDir: v } })}
                      placeholder="如: ./dataset/train"
                    />
                    <PathInputField
                      label="验证集文件夹 (可选)"
                      value={config.datasetConfig.valDir}
                      onChange={v => setConfig({ ...config, datasetConfig: { ...config.datasetConfig, valDir: v } })}
                      placeholder="如: ./dataset/val"
                    />
                    <p className="text-xs text-text-secondary">
                      文件夹结构: train/class_a/img1.jpg, train/class_b/img2.jpg
                    </p>
                  </div>
                )}

                {/* CSV 配置 */}
                {config.datasetType === 'csv' && (
                  <div className="space-y-3">
                    <PathInputField
                      label="CSV 文件路径"
                      value={config.datasetConfig.csvPath}
                      onChange={v => setConfig({ ...config, datasetConfig: { ...config.datasetConfig, csvPath: v } })}
                      placeholder="如: ./dataset/labels.csv"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="图片路径列名" value={config.datasetConfig.imageColumn}
                        onChange={v => setConfig({ ...config, datasetConfig: { ...config.datasetConfig, imageColumn: v } })} />
                      <FormField label="标签列名" value={config.datasetConfig.labelColumn}
                        onChange={v => setConfig({ ...config, datasetConfig: { ...config.datasetConfig, labelColumn: v } })} />
                    </div>
                    <p className="text-xs text-text-secondary">
                      CSV 格式: image_path,label (图片路径可以是相对路径或绝对路径)
                    </p>
                  </div>
                )}

                {/* NumPy 配置 */}
                {config.datasetType === 'numpy' && (
                  <div className="space-y-3">
                    <PathInputField
                      label="NumPy 文件路径"
                      value={config.datasetConfig.npyPath}
                      onChange={v => setConfig({ ...config, datasetConfig: { ...config.datasetConfig, npyPath: v } })}
                      placeholder="如: ./dataset/data.npz"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="X 训练集键名" value={config.datasetConfig.xTrainKey}
                        onChange={v => setConfig({ ...config, datasetConfig: { ...config.datasetConfig, xTrainKey: v } })} />
                      <FormField label="Y 训练集键名" value={config.datasetConfig.yTrainKey}
                        onChange={v => setConfig({ ...config, datasetConfig: { ...config.datasetConfig, yTrainKey: v } })} />
                      <FormField label="X 验证集键名" value={config.datasetConfig.xValKey}
                        onChange={v => setConfig({ ...config, datasetConfig: { ...config.datasetConfig, xValKey: v } })} />
                      <FormField label="Y 验证集键名" value={config.datasetConfig.yValKey}
                        onChange={v => setConfig({ ...config, datasetConfig: { ...config.datasetConfig, yValKey: v } })} />
                    </div>
                    <p className="text-xs text-text-secondary">
                      .npz 文件包含: x_train(N,C,H,W), y_train(N,), x_val, y_val
                    </p>
                  </div>
                )}

                {/* Hugging Face 配置 */}
                {config.datasetType === 'huggingface' && (
                  <div className="space-y-3">
                    <FormField
                      label="数据集名称"
                      value={config.datasetConfig.hfDatasetName}
                      onChange={v => setConfig({ ...config, dataset: v, datasetConfig: { ...config.datasetConfig, hfDatasetName: v } })}
                      placeholder="如: mnist, cifar10, beans"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="配置名称 (可选)" value={config.datasetConfig.hfConfigName}
                        onChange={v => setConfig({ ...config, datasetConfig: { ...config.datasetConfig, hfConfigName: v } })}
                        placeholder="如: default" />
                      <FormField label="数据划分" value={config.datasetConfig.hfSplit}
                        onChange={v => setConfig({ ...config, datasetConfig: { ...config.datasetConfig, hfSplit: v } })}
                        placeholder="如: train" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="图像列名" value={config.datasetConfig.hfImageColumn}
                        onChange={v => setConfig({ ...config, datasetConfig: { ...config.datasetConfig, hfImageColumn: v } })} />
                      <FormField label="标签列名" value={config.datasetConfig.hfLabelColumn}
                        onChange={v => setConfig({ ...config, datasetConfig: { ...config.datasetConfig, hfLabelColumn: v } })} />
                    </div>
                    <p className="text-xs text-text-secondary">
                      常用数据集: mnist, fashion_mnist, cifar10, beans, food101
                      <br />
                      首次加载会自动下载到本地缓存
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="学习率" type="number" value={config.learningRate} step="0.0001" min="0"
                  onChange={v => setConfig({ ...config, learningRate: parseFloat(v) || 0 })} />
                <FormField label="批次大小" type="number" value={config.batchSize} min="1"
                  onChange={v => setConfig({ ...config, batchSize: parseInt(v) || 1 })} />
                <FormField label="训练轮数" type="number" value={config.epochs} min="1"
                  onChange={v => setConfig({ ...config, epochs: parseInt(v) || 1 })} />
                <FormField label="权重衰减" type="number" value={config.weightDecay} step="0.0001" min="0"
                  onChange={v => setConfig({ ...config, weightDecay: parseFloat(v) || 0 })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-text-primary mb-1.5">优化器</label>
                  <select value={config.optimizer}
                    onChange={e => setConfig({ ...config, optimizer: e.target.value })}
                    className="w-full px-3 py-2.5 border border-layer-border rounded-md text-sm outline-none bg-bg-canvas">
                    <option value="adam">Adam</option>
                    <option value="sgd">SGD</option>
                    <option value="rmsprop">RMSprop</option>
                    <option value="adamw">AdamW</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-text-primary mb-1.5">损失函数</label>
                  <select value={config.lossFunction}
                    onChange={e => setConfig({ ...config, lossFunction: e.target.value })}
                    className="w-full px-3 py-2.5 border border-layer-border rounded-md text-sm outline-none bg-bg-canvas">
                    <option value="cross_entropy">Cross Entropy</option>
                    <option value="mse">MSE Loss</option>
                    <option value="mae">MAE Loss</option>
                    <option value="smooth_l1">Smooth L1 Loss</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-text-primary mb-1.5">学习率调度器</label>
                <select value={config.lrScheduler}
                  onChange={e => setConfig({ ...config, lrScheduler: e.target.value })}
                  className="w-full px-3 py-2.5 border border-layer-border rounded-md text-sm outline-none bg-bg-canvas">
                  <option value="none">无</option>
                  <option value="step_lr">StepLR</option>
                  <option value="cosine">CosineAnnealing</option>
                  <option value="plateau">ReduceLROnPlateau</option>
                  <option value="one_cycle">OneCycleLR</option>
                </select>
                {/* LR Schedule Preview */}
                {config.lrScheduler !== 'none' && lrPreviewData.length > 0 && (
                  <LRSchedulePreview data={lrPreviewData} />
                )}
              </div>

              <div className="border border-layer-border rounded-lg p-4 bg-bg-canvas">
                <h3 className="text-sm font-semibold text-text-primary mb-3">高级选项</h3>
                <div className="grid grid-cols-2 gap-4">
                  <CheckboxField label="启用混合精度 (AMP)" checked={config.amp}
                    onChange={v => setConfig({ ...config, amp: v })} />
                  <CheckboxField label="启用梯度裁剪" checked={config.gradClip}
                    onChange={v => setConfig({ ...config, gradClip: v })} />
                  <CheckboxField label="早停 (Early Stopping)" checked={config.earlyStopping}
                    onChange={v => setConfig({ ...config, earlyStopping: v })} />
                  <CheckboxField label="保存最佳模型" checked={config.saveBest}
                    onChange={v => setConfig({ ...config, saveBest: v })} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="h-[72px] border-t border-layer-border flex items-center justify-end gap-3 px-6 shrink-0">
          <button
            onClick={() => {
              if (!isTraining) {
                onOpenChange(false)
              }
            }}
            disabled={isTraining}
            className={`px-5 py-2.5 border rounded-md text-sm transition-colors ${
              isTraining
                ? 'border-layer-border/50 text-text-tertiary cursor-not-allowed'
                : 'border-layer-border text-text-primary hover:bg-bg-canvas'
            }`}
          >
            {isTraining ? '训练中...' : '取消'}
          </button>
          {hasTrained && !isTraining && (
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('onnx')}
                disabled={exporting}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {exporting ? '导出中...' : '📦 ONNX'}
              </button>
              <button
                onClick={() => handleExport('torchscript')}
                disabled={exporting}
                className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-sm font-medium transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {exporting ? '导出中...' : '🔥 TorchScript'}
              </button>
            </div>
          )}
          {isTraining ? (
            <button
              onClick={handleStopTraining}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-all hover:scale-105 active:scale-95"
            >
              ⏹ 停止训练
            </button>
          ) : (
            <button
              onClick={handleStartTraining}
              className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-md text-sm font-medium transition-all hover:scale-105 active:scale-95"
            >
              ▶ 开始训练
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Training Monitor
function TrainingMonitor({ status, isTraining }: { status: any; isTraining: boolean }) {
  const progress = status.totalEpochs > 0 ? (status.currentEpoch / status.totalEpochs) * 100 : 0

  // 构建训练日志数据
  const trainingLogs = (status.logs || []).map((log: any) => ({
    epoch: log.epoch || 0,
    step: log.step || 0,
    loss: log.loss || 0,
    accuracy: log.accuracy || 0,
    learningRate: log.learningRate || 0,
  }))

  return (
    <div className="space-y-4">
      {/* 状态标题 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">
          {isTraining ? '🔥 训练进行中...' : '✅ 训练完成'}
        </h3>
        {!isTraining && (
          <span className="text-xs text-green-600 font-medium">训练已完成</span>
        )}
      </div>

      {/* 进度条 */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary">Epoch {status.currentEpoch} / {status.totalEpochs}</span>
        <span className="text-sm font-medium text-accent">{progress.toFixed(1)}%</span>
      </div>
      <div className="w-full h-2 bg-bg-canvas rounded-full overflow-hidden">
        <div className="h-full bg-accent rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* 指标卡片 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-layer-border rounded-lg p-3 bg-bg-canvas">
          <div className="text-xs text-text-secondary mb-1">Loss</div>
          <div className="text-lg font-semibold text-text-primary">{status.loss?.toFixed(4) || '0.0000'}</div>
        </div>
        <div className="border border-layer-border rounded-lg p-3 bg-bg-canvas">
          <div className="text-xs text-text-secondary mb-1">Accuracy</div>
          <div className="text-lg font-semibold text-text-primary">{((status.accuracy || 0) * 100).toFixed(2)}%</div>
        </div>
      </div>

      {/* Recharts 训练曲线 */}
      <TrainingCharts logs={trainingLogs} />

      {/* 训练日志 */}
      <div className="border border-layer-border rounded-lg p-3 bg-bg-canvas h-48 overflow-y-auto">
        <div className="text-xs text-text-secondary mb-2">训练日志</div>
        {(status.logs || []).slice(-20).map((log: any, i: number) => (
          <div key={i} className={`text-xs ${log.level === 'error' ? 'text-red-600' : 'text-text-secondary'}`}>
            [Epoch {log.epoch}] {log.message}
          </div>
        ))}
      </div>
    </div>
  )
}

// Form Field Helper
function FormField({ label, type, value, defaultValue, step, min, onChange }: {
  label: string
  type: string
  value?: string | number
  defaultValue?: string
  step?: string
  min?: string
  onChange?: (value: string) => void
}) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-text-primary mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        defaultValue={defaultValue}
        step={step}
        min={min}
        onChange={e => onChange?.(e.target.value)}
        className="w-full px-3 py-2.5 border border-layer-border rounded-md text-sm outline-none focus:ring-2 focus:ring-accent bg-bg-canvas"
      />
    </div>
  )
}

// Checkbox Field Helper
function CheckboxField({ label, checked, onChange }: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-text-secondary">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 accent-accent"
      />
    </div>
  )
}

// Path Input Field Helper (with file/folder selection)
function PathInputField({ label, value, onChange, placeholder }: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  const handleSelectPath = async () => {
    // 尝试使用现代文件选择 API
    try {
      // @ts-ignore
      const handle = await window.showDirectoryPicker?.()
      if (handle) {
        onChange(handle.name)
        return
      }
    } catch {
      // 用户取消或 API 不支持
    }

    // 回退到 prompt 输入
    const path = window.prompt(`请输入${label}的完整路径:`, value)
    if (path !== null) {
      onChange(path)
    }
  }

  return (
    <div>
      <label className="block text-[13px] font-medium text-text-primary mb-1.5">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2.5 border border-layer-border rounded-md text-sm outline-none focus:ring-2 focus:ring-accent bg-bg-canvas"
        />
        <button
          onClick={handleSelectPath}
          className="px-3 py-2.5 bg-bg-panel border border-layer-border rounded-md text-sm text-text-secondary hover:text-text-primary hover:border-accent transition-colors shrink-0"
          title="选择路径"
        >
          📂
        </button>
      </div>
    </div>
  )
}

// LR Schedule Preview Component
function LRSchedulePreview({ data }: { data: { step: number; lr: number }[] }) {
  const maxLR = Math.max(...data.map(d => d.lr))
  const minLR = Math.min(...data.map(d => d.lr))

  return (
    <div className="mt-3 border border-layer-border rounded-lg p-3 bg-bg-canvas">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-text-secondary">学习率变化预览</span>
        <span className="text-xs text-text-tertiary">
          max: {maxLR.toExponential(2)} / min: {minLR.toExponential(2)}
        </span>
      </div>
      <div className="h-24 flex items-end gap-px">
        {data.map((point, i) => {
          const height = maxLR > 0 ? (point.lr / maxLR) * 100 : 0
          return (
            <div
              key={i}
              className="flex-1 bg-accent/60 hover:bg-accent rounded-t-sm transition-colors"
              style={{ height: `${Math.max(height, 1)}%` }}
              title={`Step ${point.step}: LR=${point.lr.toExponential(3)}`}
            />
          )
        })}
      </div>
    </div>
  )
}