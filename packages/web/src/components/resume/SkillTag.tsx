'use client'

import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const categoryColors: Record<string, string> = {
  frontend:
    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  backend:
    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'machine learning':
    'bg-purple-500/10 text-purple-400 border-purple-500/20',
  devops:
    'bg-amber-500/10 text-amber-400 border-amber-500/20',
  design:
    'bg-pink-500/10 text-pink-400 border-pink-500/20',
  database:
    'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  language:
    'bg-orange-500/10 text-orange-400 border-orange-500/20',
  tools:
    'bg-slate-500/10 text-slate-400 border-slate-500/20',
  default:
    'bg-primary/10 text-primary border-primary/20',
}

function getCategoryColor(category: string): string {
  const key = category.toLowerCase()
  return categoryColors[key] || categoryColors.default
}

interface SkillTagProps {
  name: string
  category: string
  level?: string | null
  onDelete?: () => void
  interactive?: boolean
}

export function SkillTag({
  name,
  category,
  level,
  onDelete,
  interactive = true,
}: SkillTagProps) {
  return (
    <motion.span
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
        getCategoryColor(category)
      )}
    >
      <span>{name}</span>
      {level && level !== 'intermediate' && (
        <span className="opacity-60 text-[10px] capitalize">· {level}</span>
      )}
      {onDelete && interactive && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="ml-0.5 -mr-1 p-0.5 rounded hover:bg-white/10 transition-colors"
          aria-label={`Remove ${name}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </motion.span>
  )
}
