import { Select } from '@/components/ui/select'
import { DATASET_OPTIONS } from '@/lib/constants'

interface DatasetPickerProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function DatasetPicker({ value, onChange, disabled }: DatasetPickerProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-text-secondary">数据集</label>
      <Select
        options={DATASET_OPTIONS.map(d => ({ value: d, label: d }))}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      <p className="text-xs text-text-secondary">
        根据输入层形状自动推荐可用数据集
      </p>
    </div>
  )
}