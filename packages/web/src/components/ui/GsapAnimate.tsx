'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export function GsapReveal({
  children,
  className = '',
  delay = 0,
  stagger = 0.08,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  stagger?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const childrenEls = el.children
    if (childrenEls.length === 0) return

    const ctx = gsap.context(() => {
      gsap.from(childrenEls, {
        y: 35,
        opacity: 0,
        scale: 0.96,
        duration: 0.7,
        delay,
        stagger,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
        },
      })
    })

    return () => ctx.revert()
  }, [delay, stagger])

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}

export function GsapTiltCard({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2

      gsap.to(card, {
        rotationY: (x / rect.width) * 12,
        rotationX: (-y / rect.height) * 12,
        transformPerspective: 1000,
        ease: 'power1.out',
        duration: 0.3,
      })
    }

    const handleMouseLeave = () => {
      gsap.to(card, {
        rotationY: 0,
        rotationX: 0,
        duration: 0.5,
        ease: 'power2.out',
      })
    }

    card.addEventListener('mousemove', handleMouseMove)
    card.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      card.removeEventListener('mousemove', handleMouseMove)
      card.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <div ref={cardRef} className={className}>
      {children}
    </div>
  )
}
