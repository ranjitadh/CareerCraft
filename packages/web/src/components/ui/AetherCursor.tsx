'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

export default function AetherCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const [label, setLabel] = useState<string>('')
  const [visible, setVisible] = useState<boolean>(false)

  useEffect(() => {
    const cursor = cursorRef.current
    const dot = dotRef.current
    if (!cursor || !dot) return

    // Hide default cursor on desktop
    const onMouseMove = (e: MouseEvent) => {
      if (!visible) setVisible(true)

      gsap.to(dot, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.1,
        ease: 'power2.out',
      })

      gsap.to(cursor, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.35,
        ease: 'power3.out',
      })
    }

    const onMouseLeave = () => setVisible(false)
    const onMouseEnter = () => setVisible(true)

    window.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseleave', onMouseLeave)
    document.addEventListener('mouseenter', onMouseEnter)

    // Interactive element hover detection
    const handleElementHover = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const interactiveEl = target.closest('button, a, input, textarea, [data-cursor]')

      if (interactiveEl) {
        const customText = interactiveEl.getAttribute('data-cursor') || '[ SELECT ]'
        setLabel(customText)
        gsap.to(cursor, { scale: 1.6, borderColor: 'rgba(0, 240, 255, 0.8)', duration: 0.2 })
      } else {
        setLabel('')
        gsap.to(cursor, { scale: 1, borderColor: 'rgba(0, 240, 255, 0.3)', duration: 0.2 })
      }
    }

    window.addEventListener('mouseover', handleElementHover)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseleave', onMouseLeave)
      document.removeEventListener('mouseenter', onMouseEnter)
      window.removeEventListener('mouseover', handleElementHover)
    }
  }, [visible])

  if (!visible) return null

  return (
    <div className="hidden lg:block pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {/* Outer Ring */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-cyan-500/40 bg-cyan-500/5 backdrop-blur-[1px] flex items-center justify-center transition-opacity"
      >
        {label && (
          <span className="absolute top-10 whitespace-nowrap text-[9px] font-mono tracking-widest text-cyan-400 bg-[#07090e]/90 border border-cyan-500/30 px-1.5 py-0.5 rounded shadow-lg">
            {label}
          </span>
        )}
      </div>

      {/* Inner Dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]"
      />
    </div>
  )
}
