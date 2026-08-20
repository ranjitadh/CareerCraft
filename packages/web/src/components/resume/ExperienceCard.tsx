'use client'

import { motion } from 'framer-motion'
import { Briefcase, Pencil, Trash2, MapPin, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { ExperienceData } from '@/hooks/use-profile'

interface ExperienceCardProps {
  experience: ExperienceData
  onEdit: (exp: ExperienceData) => void
  onDelete: (id: string) => void
}

export function ExperienceCard({
  experience,
  onEdit,
  onDelete,
}: ExperienceCardProps) {
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
            <Briefcase className="w-4.5 h-4.5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {experience.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">{experience.company}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(experience.startDate)} —{' '}
                {experience.isCurrent ? 'Present' : experience.endDate ? formatDate(experience.endDate) : 'Present'}
              </span>
              {experience.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {experience.location}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed line-clamp-3">
              {experience.originalDescription}
            </p>
            {experience.achievements.length > 0 && (
              <ul className="mt-3 space-y-1">
                {experience.achievements.slice(0, 3).map((a, i) => (
                  <li
                    key={i}
                    className="text-xs text-muted-foreground flex items-start gap-2"
                  >
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                    <span className="line-clamp-1">{a}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onEdit(experience)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label={`Edit ${experience.title} at ${experience.company}`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(experience.id)}
            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            aria-label={`Delete ${experience.title} at ${experience.company}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
