import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
}

export function Slider({ 
  value, 
  onChange, 
  min = 0, 
  max = 100, 
  step = 1,
  className,
  ...props 
}: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className={cn('relative w-full', className)}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-layer-border rounded-lg appearance-none cursor-pointer accent-accent"
        {...props}
      />
      <div 
        className="absolute top-1/2 left-0 h-2 bg-accent rounded-lg pointer-events-none"
        style={{ width: `${percentage}%`, transform: 'translateY(-50%)' }}
      />
    </div>
  )
}