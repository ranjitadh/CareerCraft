'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export { gsap, ScrollTrigger }

/**
 * Fade-up reveal driven by ScrollTrigger.
 * Animates the element itself from y offset + opacity into place.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options?: {
    y?: number
    duration?: number
    delay?: number
    start?: string
  }
) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(el, { clearProps: 'all' })
      return
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: options?.y ?? 32 },
        {
          opacity: 1,
          y: 0,
          duration: options?.duration ?? 1,
          delay: options?.delay ?? 0,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: options?.start ?? 'top 85%',
          },
        }
      )
    }, el)

    return () => ctx.revert()
  }, [options?.y, options?.duration, options?.delay, options?.start])

  return ref
}

/**
 * Stagger reveal for a group of children.
 * Targets `[data-reveal]` elements inside the container.
 */
export function useStaggerReveal<T extends HTMLElement = HTMLDivElement>(
  options?: {
    y?: number
    stagger?: number
    duration?: number
    start?: string
  }
) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(el.querySelectorAll('[data-reveal]'), { clearProps: 'all' })
      return
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll('[data-reveal]'),
        { opacity: 0, y: options?.y ?? 28 },
        {
          opacity: 1,
          y: 0,
          duration: options?.duration ?? 0.8,
          stagger: options?.stagger ?? 0.08,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: options?.start ?? 'top 80%',
          },
        }
      )
    }, el)

    return () => ctx.revert()
  }, [options?.y, options?.stagger, options?.duration, options?.start])

  return ref
}

/**
 * Line-by-line mask reveal for statement text.
 * Splits text into lines is complex; this animates word-by-word opacity.
 * Targets `[data-word]` spans inside the element.
 */
export function useWordReveal<T extends HTMLElement = HTMLHeadingElement>(
  options?: {
    duration?: number
    stagger?: number
    start?: string
  }
) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(el.querySelectorAll('[data-word]'), { clearProps: 'all' })
      return
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll('[data-word]'),
        { yPercent: 120, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: options?.duration ?? 0.7,
          stagger: options?.stagger ?? 0.04,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: options?.start ?? 'top 85%',
          },
        }
      )
    }, el)

    return () => ctx.revert()
  }, [options?.duration, options?.stagger, options?.start])

  return ref
}
