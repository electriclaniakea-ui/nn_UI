import { useState, ChangeEvent, KeyboardEvent } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface BlockNameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (name: string) => void
}

export function BlockNameDialog({ open, onOpenChange, onConfirm }: BlockNameDialogProps) {
  const [name, setName] = useState('')

  const handleConfirm = () => {
    if (name.trim()) {
      onConfirm(name.trim())
      setName('')
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>创建 Block</DialogTitle>
      </DialogHeader>

      <DialogContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-text-secondary">Block 名称</label>
          <Input
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            placeholder="例如：Residual Block"
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleConfirm()}
            autoFocus
          />
          <p className="text-xs text-text-secondary mt-1">
            名称将用于在层列表中识别此 Block
          </p>
        </div>

        <div className="p-3 bg-bg-canvas rounded-lg border border-layer-border">
          <p className="text-xs text-text-secondary">
            <strong>提示：</strong>Block 内最多包含 10 层，不支持嵌套 Block。
            打包后可在「已打包」分类中找到并复用。
          </p>
        </div>
      </DialogContent>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          取消
        </Button>
        <Button onClick={handleConfirm} disabled={!name.trim()}>
          创建
        </Button>
      </DialogFooter>
    </Dialog>
  )
}