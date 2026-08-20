'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle2, RotateCcw, Pencil, ShieldCheck } from 'lucide-react'

interface CodeEditorProps {
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  className?: string
  errors?: string[]
}

export default function CodeEditor({
  value,
  onChange,
  readOnly = true,
  className,
  errors = [],
}: CodeEditorProps) {
  const [isEditing, setIsEditing] = useState(!readOnly)
  const [localValue, setLocalValue] = useState(value)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const lines = useMemo(() => localValue.split('\n'), [localValue])
  const lineCount = lines.length

  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }, [])

  const handleToggleEdit = useCallback(() => {
    if (isEditing && onChange) {
      onChange(localValue)
    }
    setIsEditing(!isEditing)
  }, [isEditing, localValue, onChange])

  const handleReset = useCallback(() => {
    setLocalValue(value)
  }, [value])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setLocalValue(e.target.value)
    },
    []
  )

  const errorLines = useMemo(() => {
    const set = new Set<number>()
    errors.forEach((err) => {
      const match = err.match(/line\s+(\d+)/i)
      if (match) set.add(parseInt(match[1], 10))
    })
    return set
  }, [errors])

  return (
    <div className={cn('flex flex-col rounded-xl border border-border bg-card overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium text-muted-foreground">LaTeX Source</span>
          {errors.length === 0 && value.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
              <CheckCircle2 className="w-3 h-3" /> Valid
            </span>
          )}
          {errors.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-destructive font-medium">
              <AlertCircle className="w-3 h-3" /> {errors.length} error{errors.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {!readOnly && (
            <button
              onClick={handleToggleEdit}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                isEditing
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {isEditing ? <ShieldCheck className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
              {isEditing ? 'Lock' : 'Edit'}
            </button>
          )}
          {isEditing && localValue !== value && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Editor body */}
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 400, maxHeight: 700 }}>
        {/* Line numbers */}
        <div
          ref={lineNumbersRef}
          className="flex-shrink-0 overflow-hidden select-none border-r border-border bg-card/30 py-3"
          style={{ width: 56 }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div
              key={i}
              className={cn(
                'text-right pr-3 text-[11px] font-mono leading-5 h-5',
                errorLines.has(i + 1) ? 'text-destructive font-bold' : 'text-muted-foreground/50'
              )}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code textarea */}
        <textarea
          ref={textareaRef}
          value={localValue}
          onChange={handleChange}
          onScroll={handleScroll}
          readOnly={!isEditing}
          spellCheck={false}
          className={cn(
            'flex-1 bg-transparent text-sm font-mono text-foreground p-3 resize-none focus:outline-none leading-5',
            !isEditing && 'cursor-default',
            isEditing && 'caret-primary'
          )}
          style={{ tabSize: 2 }}
        />
      </div>

      {/* Error list */}
      {errors.length > 0 && (
        <div className="border-t border-border bg-destructive/5 px-4 py-3 space-y-1.5 max-h-32 overflow-y-auto">
          {errors.map((err, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <AlertCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0 mt-0.5" />
              <span className="text-foreground/80">{err}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
