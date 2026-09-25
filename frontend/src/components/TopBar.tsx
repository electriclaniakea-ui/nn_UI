import { Settings, Save, Image, CheckCircle } from 'lucide-react'
import { Button } from './ui/button'

interface TopBarProps {
  onAddLayer: () => void
}

export function TopBar({ onAddLayer }: TopBarProps) {
  return (
    <header className="h-14 bg-bg-panel border-b border-layer-border flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-accent" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          nn_UI
        </h1>
        <span className="text-sm text-text-secondary">
          Visual Neural Network Builder
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" title="设置">
          <Settings className="h-4 w-4" />
        </Button>
        
        <Button variant="ghost" size="icon" title="保存">
          <Save className="h-4 w-4" />
        </Button>
        
        <Button variant="ghost" size="icon" title="导出 PNG">
          <Image className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="default" 
          size="sm" 
          onClick={onAddLayer}
          className="gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          保存并训练
        </Button>
      </div>
    </header>
  )
}