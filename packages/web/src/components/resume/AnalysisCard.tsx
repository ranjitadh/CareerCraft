'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Target,
  Users,
  ListChecks,
  Sparkles,
  TrendingUp,
} from 'lucide-react'

interface AnalysisCardProps {
  title: string
  type?: 'score' | 'list' | 'chips' | 'info'
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
  delay?: number
}

export default function AnalysisCard({
  title,
  type,
  icon,
  children,
  className,
  delay = 0,
}: AnalysisCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        'rounded-xl border border-border bg-card p-5 space-y-3',
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            {icon}
          </div>
        )}
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div>{children}</div>
    </motion.div>
  )
}
