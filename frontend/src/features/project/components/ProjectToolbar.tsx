import { Save, FolderOpen, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCanvasStore } from '@/features/canvas/store/canvasStore'

export function ProjectToolbar() {
  const { nodes, setStatusMessage } = useCanvasStore()

  const handleSave = async () => {
    try {
      const store = useCanvasStore.getState()
      const projectData = {
        version: '1.1',
        layers: store.layers,
        savedAt: new Date().toISOString(),
      }

      const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `project-${Date.now()}.nnproj`
      a.click()
      URL.revokeObjectURL(url)

      setStatusMessage('已保存到项目文件')
      setTimeout(() => setStatusMessage('就绪'), 2000)
    } catch (error) {
      console.error('Save failed:', error)
      setStatusMessage('保存失败')
    }
  }

  const handleLoad = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.nnproj'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target?.result as string)
            if (data.layers || data.nodes) {
              const store = useCanvasStore.getState()
              // 清空当前状态
              store.clearAll()
              // 加载数据（兼容新旧格式）
              const layersToLoad = data.layers || data.nodes
              layersToLoad.forEach((layer: any) => {
                store.addNode(layer.type, layer.params || layer.data?.params || {})
              })
              setStatusMessage(`已加载 ${layersToLoad.length} 个节点`)
              setTimeout(() => setStatusMessage('就绪'), 2000)
            }
          } catch (error) {
            console.error('Load failed:', error)
            setStatusMessage('加载失败：无效的项目文件')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const handleExportPNG = () => {
    setStatusMessage('导出 PNG 功能开发中')
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={handleSave} title="保存">
        <Save className="h-4 w-4" />
      </Button>
      
      <Button variant="ghost" size="icon" onClick={handleLoad} title="加载">
        <FolderOpen className="h-4 w-4" />
      </Button>
      
      <Button variant="ghost" size="icon" onClick={handleExportPNG} title="导出 PNG">
        <Download className="h-4 w-4" />
      </Button>
    </div>
  )
}