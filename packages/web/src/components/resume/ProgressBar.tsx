'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  showValue?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  color?: 'primary' | 'success' | 'warning' | 'destructive'
}

const colorMap = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
}

const sizeMap = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-3',
}

function getValueColor(value: number): string {
  if (value >= 80) return colorMap.success
  if (value >= 50) return colorMap.primary
  if (value >= 30) return colorMap.warning
  return colorMap.destructive
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = true,
  size = 'md',
  className,
  color,
}: ProgressBarProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100)
  const barColor = color || getValueColor(percentage)

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
          )}
          {showValue && (
            <span className="text-xs font-semibold text-foreground">{percentage}%</span>
          )}
        </div>
      )}
      <div className={cn('w-full rounded-full bg-muted overflow-hidden', sizeMap[size])}>
        <motion.div
          className={cn('h-full rounded-full', barColor)}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </div>
    </div>
  )
}

interface ProgressRingProps {
  value: number
  size?: number
  strokeWidth?: number
  className?: string
  showLabel?: boolean
}

export function ProgressRing({
  value,
  size = 64,
  strokeWidth = 5,
  className,
  showLabel = true,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (Math.min(value, 100) / 100) * circumference
  const percentage = Math.min(Math.round(value), 100)

  function getStrokeColor(v: number): string {
    if (v >= 80) return 'hsl(var(--success))'
    if (v >= 50) return 'hsl(var(--primary))'
    if (v >= 30) return 'hsl(var(--warning))'
    return 'hsl(var(--destructive))'
  }

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getStrokeColor(percentage)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </svg>
      {showLabel && (
        <span className="absolute text-xs font-bold text-foreground">{percentage}%</span>
      )}
    </div>
  )
}
