import { cn } from '@/lib/utils'

interface SectionLabelProps {
  index?: string
  title: string
  className?: string
}

/**
 * Editorial section marker: `01 — About` style.
 */
export function SectionLabel({ index, title, className }: SectionLabelProps) {
  return (
    <div
      className={cn(
        'font-mono-label flex items-center gap-4 text-muted-foreground',
        className
      )}
    >
      {index && <span>{index}</span>}
      <span aria-hidden="true" className="h-px w-10 bg-border" />
      <span>{title}</span>
    </div>
  )
}
