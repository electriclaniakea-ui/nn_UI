import { useState, useEffect } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Project {
  name: string
  path: string
  updatedAt: string
  nodeCount: number
}

interface ProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (project: Project) => void
}

export function ProjectDialog({ open, onOpenChange, onSelect }: ProjectDialogProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (open) {
      loadProjects()
    }
  }, [open])

  const loadProjects = async () => {
    try {
      const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8765'
      const response = await fetch(`${apiBase}/api/projects`)
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
    }
  }

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>打开项目</DialogTitle>
      </DialogHeader>

      <DialogContent className="space-y-4">
        <Input
          placeholder="搜索项目..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filteredProjects.length === 0 ? (
            <p className="text-center text-text-secondary py-8">未找到项目</p>
          ) : (
            filteredProjects.map((project) => (
              <button
                key={project.path}
                onClick={() => {
                  onSelect(project)
                  onOpenChange(false)
                }}
                className="w-full text-left p-3 rounded-lg hover:bg-layer-hover border border-transparent hover:border-layer-border transition-all"
              >
                <div className="font-medium text-text-primary">{project.name}</div>
                <div className="text-xs text-text-secondary mt-1">
                  {project.nodeCount} 个节点 · {new Date(project.updatedAt).toLocaleString()}
                </div>
              </button>
            ))
          )}
        </div>
      </DialogContent>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          取消
        </Button>
      </DialogFooter>
    </Dialog>
  )
}