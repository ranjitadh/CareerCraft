'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { cn } from '@/lib/utils'

interface MarqueeProps {
  children: React.ReactNode
  speed?: number
  className?: string
  ariaLabel?: string
}

/**
 * Infinite horizontal marquee using GSAP.
 * Duplicates content once and loops a seamless translate.
 */
export function Marquee({
  children,
  speed = 60,
  className,
  ariaLabel = 'marquee',
}: MarqueeProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    const duration = track.scrollWidth / speed

    const ctx = gsap.context(() => {
      gsap.to(track, {
        xPercent: -50,
        repeat: -1,
        duration,
        ease: 'none',
      })
    }, track)

    return () => ctx.revert()
  }, [speed])

  return (
    <div className={cn('overflow-hidden', className)} aria-label={ariaLabel}>
      <div ref={trackRef} className="flex w-max whitespace-nowrap will-change-transform">
        <div className="flex items-center shrink-0">{children}</div>
        <div className="flex items-center shrink-0" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  )
}
