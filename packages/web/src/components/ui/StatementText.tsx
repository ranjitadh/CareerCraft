'use client'

import { useWordReveal } from '@/lib/gsap'
import { cn } from '@/lib/utils'

interface StatementTextProps {
  text: string
  className?: string
  accentWords?: string[]
  duration?: number
  stagger?: number
  start?: string
}

/**
 * Large editorial statement with per-word mask reveal on scroll.
 * Pass `accentWords` to render matching words in the accent color.
 */
export function StatementText({
  text,
  className,
  accentWords = [],
  duration = 0.7,
  stagger = 0.04,
  start = 'top 85%',
}: StatementTextProps) {
  const ref = useWordReveal<HTMLHeadingElement>({ duration, stagger, start })

  const words = text.split(' ')

  return (
    <h2
      ref={ref}
      className={cn('font-display text-display-md font-semibold', className)}
    >
      {words.map((word, i) => {
        const isAccent = accentWords.some(
          (a) => a.toLowerCase() === word.replace(/[^a-zA-Z]/g, '').toLowerCase()
        )
        return (
          <span
            key={i}
            className="inline-block overflow-hidden align-bottom"
          >
            <span
              data-word
              className={cn(
                'inline-block will-change-transform',
                isAccent && 'text-accent'
              )}
            >
              {word}
            </span>
            {i < words.length - 1 ? '\u00A0' : ''}
          </span>
        )
      })}
    </h2>
  )
}
