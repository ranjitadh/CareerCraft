'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Check, X, AlertTriangle } from 'lucide-react'

interface KeywordChipProps {
  keyword: string
  status: 'supported' | 'unsupported' | 'neutral'
  className?: string
}

export default function KeywordChip({
  keyword,
  status,
  className,
}: KeywordChipProps) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
        status === 'supported' &&
          'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        status === 'unsupported' &&
          'bg-amber-500/10 border-amber-500/20 text-amber-400',
        status === 'neutral' &&
          'bg-muted border-border text-muted-foreground',
        className
      )}
    >
      {status === 'supported' && <Check className="w-3 h-3" />}
      {status === 'unsupported' && <AlertTriangle className="w-3 h-3" />}
      {keyword}
    </motion.span>
  )
}
