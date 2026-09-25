import { useState } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { OPTIMIZER_OPTIONS, LR_SCHEDULER_OPTIONS, DATASET_OPTIONS } from '@/lib/constants'
import type { TrainConfig } from '@/types/training'

interface TrainingPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onStartTraining: (config: TrainConfig) => void
  isTraining: boolean
}

export function TrainingPanel({ open, onOpenChange, onStartTraining, isTraining }: TrainingPanelProps) {
  const [config, setConfig] = useState<TrainConfig>({
    dataset: 'MNIST',
    optimizer: 'Adam',
    learningRate: 0.001,
    batchSize: 32,
    epochs: 10,
    lrScheduler: 'CosineAnnealing',
    earlyStopping: false,
    patience: 5,
    checkpointRestore: false,
  })

  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleStart = () => {
    onStartTraining(config)
  }

  return (
    <Dialog open={open} onOpenChange={isTraining ? () => {} : onOpenChange}>
      <DialogHeader>
        <DialogTitle>训练</DialogTitle>
        {isTraining && <p className="text-sm text-text-secondary">训练中，请先停止</p>}
      </DialogHeader>

      <DialogContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-text-secondary">数据集</label>
            <Select
              options={DATASET_OPTIONS.map(d => ({ value: d, label: d }))}
              value={config.dataset}
              onChange={(e) => setConfig({ ...config, dataset: e.target.value })}
              disabled={isTraining}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-text-secondary">优化器</label>
            <Select
              options={OPTIMIZER_OPTIONS.map(o => ({ value: o, label: o }))}
              value={config.optimizer}
              onChange={(e) => setConfig({ ...config, optimizer: e.target.value })}
              disabled={isTraining}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-text-secondary">学习率</label>
            <Input
              type="number"
              value={config.learningRate}
              onChange={(e) => setConfig({ ...config, learningRate: parseFloat(e.target.value) || 0 })}
              disabled={isTraining}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-text-secondary">Batch Size</label>
            <Input
              type="number"
              value={config.batchSize}
              onChange={(e) => setConfig({ ...config, batchSize: parseInt(e.target.value) || 1 })}
              disabled={isTraining}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-text-secondary">Epoch</label>
            <Input
              type="number"
              value={config.epochs}
              onChange={(e) => setConfig({ ...config, epochs: parseInt(e.target.value) || 1 })}
              disabled={isTraining}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-text-secondary">LR 调度</label>
            <Select
              options={LR_SCHEDULER_OPTIONS.map(s => ({ value: s, label: s }))}
              value={config.lrScheduler}
              onChange={(e) => setConfig({ ...config, lrScheduler: e.target.value })}
              disabled={isTraining}
            />
          </div>
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-accent hover:text-purple-700"
        >
          {showAdvanced ? '▲' : '▼'} 高级选项
        </button>

        {showAdvanced && (
          <div className="space-y-3 p-4 bg-bg-canvas rounded-lg border border-layer-border">
            <div className="flex items-center justify-between">
              <span className="text-sm">早停</span>
              <Switch
                checked={config.earlyStopping}
                onCheckedChange={(checked) => setConfig({ ...config, earlyStopping: checked })}
                disabled={isTraining}
              />
            </div>
            
            {config.earlyStopping && (
              <div>
                <label className="text-sm text-text-secondary">Patience</label>
                <Input
                  type="number"
                  value={config.patience}
                  onChange={(e) => setConfig({ ...config, patience: parseInt(e.target.value) || 1 })}
                  disabled={isTraining}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm">断点恢复</span>
              <Switch
                checked={config.checkpointRestore}
                onCheckedChange={(checked) => setConfig({ ...config, checkpointRestore: checked })}
                disabled={isTraining}
              />
            </div>
          </div>
        )}
      </DialogContent>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isTraining}>
          取消
        </Button>
        <Button onClick={handleStart} disabled={isTraining}>
          {isTraining ? '训练中...' : '开始训练'}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}