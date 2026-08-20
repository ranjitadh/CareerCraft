'use client'

import { motion } from 'framer-motion'
import { GraduationCap, Pencil, Trash2, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { EducationData } from '@/hooks/use-profile'

interface EducationCardProps {
  education: EducationData
  onEdit: (edu: EducationData) => void
  onDelete: (id: string) => void
}

export function EducationCard({
  education,
  onEdit,
  onDelete,
}: EducationCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="group relative rounded-lg border border-border bg-background/50 p-5 hover:border-border/80 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <GraduationCap className="w-4.5 h-4.5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {education.degree} in {education.fieldOfStudy}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {education.institution}
            </p>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {formatDate(education.startDate)} —{' '}
              {education.endDate ? formatDate(education.endDate) : 'Present'}
            </div>
            {education.description && (
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed line-clamp-2">
                {education.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onEdit(education)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label={`Edit ${education.degree}`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(education.id)}
            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            aria-label={`Delete ${education.degree}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
