import { Select } from '@/components/ui/select'
import { LR_SCHEDULER_OPTIONS } from '@/lib/constants'

interface LRSchedulerPickerProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function LRSchedulerPicker({ value, onChange, disabled }: LRSchedulerPickerProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-text-secondary">LR 调度</label>
      <Select
        options={LR_SCHEDULER_OPTIONS.map(s => ({ value: s, label: s }))}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      
      <div className="w-full h-10 bg-bg-canvas rounded border border-layer-border flex items-center justify-center">
        <svg width="80" height="40" viewBox="0 0 80 40">
          <polyline
            points={getSchedulerPoints(value)}
            fill="none"
            stroke="#7C3AED"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    </div>
  )
}

function getSchedulerPoints(scheduler: string): string {
  switch (scheduler) {
    case 'StepLR':
      return '5,35 25,35 25,15 55,15 55,5'
    case 'CosineAnnealing':
      return '5,35 20,10 42,10 55,30'
    case 'ReduceLROnPlateau':
      return '5,35 25,20 35,18 45,12 55,8'
    case 'OneCycle':
      return '5,32 20,8 35,5 50,28 55,32'
    default:
      return '5,20 55,20'
  }
}