import { useState, useEffect, useRef, useCallback } from 'react'
import { X, FolderOpen, Trash2, FileCode, Star, Copy, Edit3, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { listProjects, loadProject, deleteProject, renameProject, duplicateProject, type ProjectMeta } from '@/lib/api'
import { useCanvasStore } from '../store/canvasStore'

interface ProjectManagerProps {
  onClose: () => void
  onProjectLoaded?: (projectName: string) => void
}

export function ProjectManager({ onClose, onProjectLoaded }: ProjectManagerProps) {
  const [projects, setProjects] = useState<ProjectMeta[]>([])
  const [projectDir, setProjectDir] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [renamingProject, setRenamingProject] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; project: ProjectMeta } | null>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const { clearAll, addNode } = useCanvasStore()

  const fetchProjects = async () => {
    setLoading(true)
    const result = await listProjects()
    setProjects(result.projects)
    setProjectDir(result.project_dir)
    setLoading(false)
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (renamingProject && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renamingProject])

  // 点击外部关闭右键菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 键盘快捷键
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (renamingProject) {
      if (e.key === 'Enter') {
        handleRenameConfirm()
      } else if (e.key === 'Escape') {
        setRenamingProject(null)
      }
      return
    }

    if (!selectedProject) return

    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      const project = projects.find(p => p.name === selectedProject)
      if (project && !project.is_example) {
        handleDelete(project)
      }
    } else if (e.key === 'F2') {
      e.preventDefault()
      const project = projects.find(p => p.name === selectedProject)
      if (project && !project.is_example) {
        startRename(project)
      }
    } else if (e.ctrlKey && e.key === 'c') {
      e.preventDefault()
      const project = projects.find(p => p.name === selectedProject)
      if (project) {
        handleDuplicate(project)
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      handleLoadProject(selectedProject)
    }
  }, [selectedProject, renamingProject, projects, renameValue])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleLoadProject = async (projectName: string) => {
    const data = await loadProject(projectName)
    if (!data) {
      alert('加载项目失败')
      return
    }

    if (
      useCanvasStore.getState().layers.length > 0 &&
      !window.confirm(`加载 "${data.name}" 将替换当前画布内容，是否继续？`)
    ) {
      return
    }

    clearAll()

    setTimeout(() => {
      data.nodes.forEach((node: any) => {
        addNode(node.type, node.params)
      })
    }, 100)

    if (onProjectLoaded) {
      onProjectLoaded(data.name)
    }

    onClose()
  }

  const handleDelete = async (project: ProjectMeta) => {
    if (project.is_example) {
      alert('示例工程不能删除')
      return
    }
    if (!window.confirm(`确定要删除项目 "${project.name}" 吗？`)) {
      return
    }
    const success = await deleteProject(project.name)
    if (success) {
      fetchProjects()
      if (selectedProject === project.name) {
        setSelectedProject(null)
      }
    } else {
      alert('删除失败')
    }
  }

  const startRename = (project: ProjectMeta) => {
    if (project.is_example) {
      alert('示例工程不能重命名')
      return
    }
    setRenamingProject(project.name)
    setRenameValue(project.name)
  }

  const handleRenameConfirm = async () => {
    if (!renamingProject || !renameValue.trim() || renameValue === renamingProject) {
      setRenamingProject(null)
      return
    }
    const result = await renameProject(renamingProject, renameValue.trim())
    if (result && result.success) {
      fetchProjects()
      setSelectedProject(renameValue.trim())
    } else {
      alert('重命名失败')
    }
    setRenamingProject(null)
  }

  const handleDuplicate = async (project: ProjectMeta) => {
    const result = await duplicateProject(project.name)
    if (result && result.success) {
      fetchProjects()
      setSelectedProject(result.new_name || null)
    } else {
      alert('复制失败')
    }
  }

  const handleContextMenu = (e: React.MouseEvent, project: ProjectMeta) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedProject(project.name)
    setContextMenu({ x: e.clientX, y: e.clientY, project })
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
    >
      <div
        className="bg-bg-panel rounded-xl shadow-2xl flex flex-col animate-zoom-in"
        style={{ width: '90vw', maxWidth: '640px', height: '80vh', maxHeight: '560px' }}
      >
        {/* Header */}
        <div className="h-14 border-b border-layer-border flex items-center justify-between px-6 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">📁 项目管理</h2>
            <p className="text-[10px] text-text-tertiary truncate max-w-[400px]">{projectDir}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={fetchProjects} title="刷新">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full text-text-secondary">
              加载中...
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-text-secondary gap-3">
              <FolderOpen className="h-12 w-12 opacity-30" />
              <p>暂无项目</p>
              <p className="text-xs">项目将保存在设置中指定的目录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* 示例工程 */}
              {projects.some(p => p.is_example) && (
                <>
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">示例工程</h3>
                  {projects.filter(p => p.is_example).map(project => (
                    <ProjectCard
                      key={project.name}
                      project={project}
                      isSelected={selectedProject === project.name}
                      isRenaming={renamingProject === project.name}
                      renameValue={renameValue}
                      onSelect={() => setSelectedProject(project.name)}
                      onLoad={() => handleLoadProject(project.name)}
                      onContextMenu={(e) => handleContextMenu(e, project)}
                      onRenameChange={setRenameValue}
                      onRenameConfirm={handleRenameConfirm}
                      renameInputRef={renameInputRef}
                    />
                  ))}
                </>
              )}

              {/* 用户项目 */}
              {projects.some(p => !p.is_example) && (
                <>
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mt-6">我的项目</h3>
                  {projects.filter(p => !p.is_example).map(project => (
                    <ProjectCard
                      key={project.name}
                      project={project}
                      isSelected={selectedProject === project.name}
                      isRenaming={renamingProject === project.name}
                      renameValue={renameValue}
                      onSelect={() => setSelectedProject(project.name)}
                      onLoad={() => handleLoadProject(project.name)}
                      onContextMenu={(e) => handleContextMenu(e, project)}
                      onRenameChange={setRenameValue}
                      onRenameConfirm={handleRenameConfirm}
                      renameInputRef={renameInputRef}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-12 border-t border-layer-border flex items-center justify-between px-6 shrink-0">
          <span className="text-xs text-text-tertiary">
            快捷键: Enter打开 · F2重命名 · Ctrl+C复制 · Delete删除
          </span>
          <div className="flex items-center gap-2">
            {selectedProject && (
              <button
                onClick={() => handleLoadProject(selectedProject)}
                className="px-4 py-1.5 bg-accent hover:bg-accent-hover text-white rounded-md text-sm font-medium transition-all"
              >
                打开选中项目
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-bg-panel border border-layer-border rounded-lg shadow-xl p-1 min-w-[160px] z-[1100]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <ContextMenuItem icon={<FolderOpen className="h-4 w-4" />} label="打开" onClick={() => { handleLoadProject(contextMenu.project.name); setContextMenu(null) }} />
          {!contextMenu.project.is_example && (
            <>
              <ContextMenuItem icon={<Edit3 className="h-4 w-4" />} label="重命名" onClick={() => { startRename(contextMenu.project); setContextMenu(null) }} />
              <ContextMenuItem icon={<Copy className="h-4 w-4" />} label="复制" onClick={() => { handleDuplicate(contextMenu.project); setContextMenu(null) }} />
              <div className="h-px bg-layer-border my-1" />
              <ContextMenuItem icon={<Trash2 className="h-4 w-4" />} label="删除" onClick={() => { handleDelete(contextMenu.project); setContextMenu(null) }} isDanger />
            </>
          )}
          {contextMenu.project.is_example && (
            <ContextMenuItem icon={<Copy className="h-4 w-4" />} label="复制副本" onClick={() => { handleDuplicate(contextMenu.project); setContextMenu(null) }} />
          )}
        </div>
      )}
    </div>
  )
}

function ProjectCard({
  project,
  isSelected,
  isRenaming,
  renameValue,
  onSelect,
  onLoad,
  onContextMenu,
  onRenameChange,
  onRenameConfirm,
  renameInputRef,
}: {
  project: ProjectMeta
  isSelected: boolean
  isRenaming: boolean
  renameValue: string
  onSelect: () => void
  onLoad: () => void
  onContextMenu: (e: React.MouseEvent) => void
  onRenameChange: (value: string) => void
  onRenameConfirm: () => void
  renameInputRef: React.RefObject<HTMLInputElement | null>
}) {
  return (
    <div
      onClick={onSelect}
      onDoubleClick={onLoad}
      onContextMenu={onContextMenu}
      className={`flex items-center gap-3 p-3 border rounded-lg transition-colors cursor-pointer select-none ${
        isSelected
          ? 'border-accent bg-accent/5'
          : 'border-layer-border bg-bg-canvas hover:border-accent/50'
      }`}
    >
      <div className="shrink-0">
        {project.is_example ? (
          <Star className="h-5 w-5 text-amber-500" />
        ) : (
          <FileCode className="h-5 w-5 text-accent" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        {isRenaming ? (
          <input
            ref={renameInputRef}
            type="text"
            value={renameValue}
            onChange={(e) => onRenameChange(e.target.value)}
            onBlur={onRenameConfirm}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onRenameConfirm()
              if (e.key === 'Escape') {
                onRenameChange(project.name)
                onRenameConfirm()
              }
            }}
            className="w-full px-2 py-1 text-sm border border-accent rounded bg-bg-panel text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <>
            <div className="text-sm font-medium text-text-primary truncate">{project.name}</div>
            <div className="text-[10px] text-text-tertiary">
              {project.node_count} 个节点 · {project.updated_at ? new Date(project.updated_at).toLocaleString() : '未知时间'}
            </div>
          </>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onLoad() }}
          className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white rounded-md text-xs font-medium transition-all"
        >
          打开
        </button>
      </div>
    </div>
  )
}

function ContextMenuItem({ icon, label, onClick, isDanger = false }: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  isDanger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
        isDanger
          ? 'text-red-600 hover:bg-red-50'
          : 'text-text-primary hover:bg-bg-canvas'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}