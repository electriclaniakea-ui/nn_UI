import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'

interface AdvancedOptionsProps {
  earlyStopping: boolean
  onEarlyStoppingChange: (value: boolean) => void
  patience: number
  onPatienceChange: (value: number) => void
  checkpointRestore: boolean
  onCheckpointRestoreChange: (value: boolean) => void
  disabled?: boolean
}

export function AdvancedOptions({
  earlyStopping,
  onEarlyStoppingChange,
  patience,
  onPatienceChange,
  checkpointRestore,
  onCheckpointRestoreChange,
  disabled,
}: AdvancedOptionsProps) {
  return (
    <div className="space-y-4 p-4 bg-bg-canvas rounded-lg border border-layer-border">
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-primary">早停</span>
        <Switch
          checked={earlyStopping}
          onCheckedChange={onEarlyStoppingChange}
          disabled={disabled}
        />
      </div>

      {earlyStopping && (
        <div className="ml-4 space-y-2">
          <label className="text-xs text-text-secondary">Patience</label>
          <Input
            type="number"
            value={patience}
            onChange={(e) => onPatienceChange(parseInt(e.target.value) || 1)}
            disabled={disabled}
            min={1}
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm text-text-primary">断点恢复</span>
        <Switch
          checked={checkpointRestore}
          onCheckedChange={onCheckpointRestoreChange}
          disabled={disabled}
        />
      </div>
    </div>
  )
}