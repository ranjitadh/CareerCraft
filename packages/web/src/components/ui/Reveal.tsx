'use client'

import { useReveal } from '@/lib/gsap'
import { cn } from '@/lib/utils'

interface RevealProps {
  children: React.ReactNode
  className?: string
  as?: 'div' | 'section' | 'p' | 'span'
  y?: number
  duration?: number
  delay?: number
  start?: string
}

/**
 * Scroll-triggered fade-up reveal wrapper.
 */
export function Reveal({
  children,
  className,
  as: Tag = 'div',
  y = 32,
  duration = 1,
  delay = 0,
  start = 'top 85%',
}: RevealProps) {
  const ref = useReveal<HTMLDivElement>({ y, duration, delay, start })

  return (
    <Tag ref={ref as never} className={cn(className)}>
      {children}
    </Tag>
  )
}
