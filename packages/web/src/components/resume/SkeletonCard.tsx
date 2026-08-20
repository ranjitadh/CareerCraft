'use client'

import { cn } from '@/lib/utils'

interface SkeletonCardProps {
  className?: string
  lines?: number
}

export function SkeletonCard({ className, lines = 3 }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-5 animate-pulse',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-muted flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="h-3 bg-muted rounded w-1/3" />
          {Array.from({ length: lines }).map((_, i) => (
            <div key={i} className="h-3 bg-muted rounded w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-5 animate-pulse',
        className
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-muted flex-shrink-0" />
        <div className="h-3 bg-muted rounded w-20" />
      </div>
      <div className="h-7 bg-muted rounded w-16 mb-2" />
      <div className="h-3 bg-muted rounded w-24" />
    </div>
  )
}
