'use client'

import { motion } from 'framer-motion'
import { FolderOpen, ExternalLink, Pencil, Trash2, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { ProjectData } from '@/hooks/use-profile'

interface ProjectCardProps {
  project: ProjectData
  onEdit: (proj: ProjectData) => void
  onDelete: (id: string) => void
}

export function ProjectCard({
  project,
  onEdit,
  onDelete,
}: ProjectCardProps) {
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
            <FolderOpen className="w-4.5 h-4.5 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {project.name}
              </h3>
              {project.url && (
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                  aria-label={`Open ${project.name}`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
            <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {formatDate(project.startDate)} —{' '}
              {project.endDate ? formatDate(project.endDate) : 'Present'}
            </div>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed line-clamp-2">
              {project.description}
            </p>
            {project.technologies.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {project.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onEdit(project)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label={`Edit ${project.name}`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(project.id)}
            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            aria-label={`Delete ${project.name}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
