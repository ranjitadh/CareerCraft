'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Sparkles,
  Pencil,
  GripVertical,
  Trash2,
  RotateCcw,
  ChevronDown,
  Check,
  Target,
  Languages,
  Eraser,
  TrendingUp,
} from 'lucide-react'

interface BulletEditorProps {
  bullet: string
  index: number
  keywords?: string[]
  onUpdate: (index: number, value: string) => void
  onRemove: (index: number) => void
  onReorder?: (from: number, to: number) => void
  onAIRewrite?: (index: number, instruction: string) => void
  onRestore?: (index: number) => void
  original?: string
  className?: string
}

const rewriteOptions = [
  { id: 'concise', label: 'Make concise', icon: Target, instruction: 'Make this bullet point more concise while preserving meaning' },
  { id: 'achievement', label: 'Achievement-focused', icon: TrendingUp, instruction: 'Rewrite to focus on measurable achievements and impact' },
  { id: 'match-language', label: 'Match job language', icon: Languages, instruction: 'Rewrite using language and terminology from the job description' },
  { id: 'remove-unsupported', label: 'Remove unsupported', icon: Eraser, instruction: 'Remove any unsupported claims and soften unverifiable assertions' },
  { id: 'restore', label: 'Restore original', icon: RotateCcw, instruction: '__RESTORE__' },
]

export default function BulletEditor({
  bullet,
  index,
  keywords = [],
  onUpdate,
  onRemove,
  onReorder,
  onAIRewrite,
  onRestore,
  original,
  className,
}: BulletEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(bullet)
  const [showRewriteMenu, setShowRewriteMenu] = useState(false)
  const [isRewriting, setIsRewriting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleSave = useCallback(() => {
    onUpdate(index, editValue)
    setIsEditing(false)
  }, [editValue, index, onUpdate])

  const handleCancel = useCallback(() => {
    setEditValue(bullet)
    setIsEditing(false)
  }, [bullet])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        handleSave()
      }
      if (e.key === 'Escape') {
        handleCancel()
      }
    },
    [handleSave, handleCancel]
  )

  const handleRewrite = useCallback(
    async (option: typeof rewriteOptions[number]) => {
      if (option.id === 'restore') {
        if (original) {
          onUpdate(index, original)
        }
        setShowRewriteMenu(false)
        return
      }
      if (onAIRewrite) {
        setIsRewriting(true)
        setShowRewriteMenu(false)
        await onAIRewrite(index, option.instruction)
        setIsRewriting(false)
      }
    },
    [index, onAIRewrite, onUpdate, original]
  )

  return (
    <div
      className={cn(
        'group relative rounded-lg border bg-background transition-all',
        isEditing ? 'border-primary/40 ring-1 ring-primary/20' : 'border-border hover:border-border/80',
        isRewriting && 'opacity-60 pointer-events-none',
        className
      )}
    >
      {isRewriting && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs text-primary">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            AI rewriting...
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 p-3">
        <div className="flex items-center gap-1 pt-0.5 flex-shrink-0">
          <span className="w-5 h-5 rounded bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
            {index + 1}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              className="w-full bg-transparent text-sm text-foreground resize-none focus:outline-none leading-relaxed"
              autoFocus
            />
          ) : (
            <p className="text-sm text-foreground leading-relaxed">{bullet}</p>
          )}

          {keywords.length > 0 && !isEditing && (
            <div className="flex flex-wrap gap-1 mt-2">
              {keywords.map((kw) => (
                <span
                  key={kw}
                  className="px-1.5 py-0.5 rounded bg-primary/8 text-[10px] font-medium text-primary/70"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="p-1 rounded text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                title="Save (⌘+Enter)"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCancel}
                className="p-1 rounded text-muted-foreground hover:bg-muted transition-colors"
                title="Cancel (Esc)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Edit"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowRewriteMenu(!showRewriteMenu)}
                  className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  title="AI Rewrite"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
                <AnimatePresence>
                  {showRewriteMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-1 z-50 w-56 py-1 rounded-lg border border-border bg-popover shadow-xl"
                    >
                      {rewriteOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleRewrite(option)}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors',
                            option.id === 'restore'
                              ? 'text-muted-foreground hover:text-foreground hover:bg-muted border-t border-border mt-1 pt-3'
                              : 'text-foreground hover:bg-accent'
                          )}
                        >
                          <option.icon className="w-3.5 h-3.5 flex-shrink-0" />
                          {option.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button
                onClick={() => onRemove(index)}
                className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Remove"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
