'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import ThreeCanvas from './ThreeCanvas'

export default function AetherBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    // Particle nodes for high-tech HUD grid effect
    const numParticles = 30
    const particles = Array.from({ length: numParticles }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.4 + 0.2,
    }))

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      // Draw subtle connections
      for (let i = 0; i < numParticles; i++) {
        const p1 = particles[i]
        p1.x += p1.vx
        p1.y += p1.vy

        if (p1.x < 0 || p1.x > width) p1.vx *= -1
        if (p1.y < 0 || p1.y > height) p1.vy *= -1

        ctx.fillStyle = `rgba(0, 240, 255, ${p1.alpha})`
        ctx.beginPath()
        ctx.arc(p1.x, p1.y, p1.size, 0, Math.PI * 2)
        ctx.fill()

        for (let j = i + 1; j < numParticles; j++) {
          const p2 = particles[j]
          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 120) {
            ctx.strokeStyle = `rgba(0, 240, 255, ${0.1 * (1 - dist / 120)})`
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        }
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    // Ambient GSAP glow animation
    gsap.to('.ambient-glow-1', {
      x: 60,
      y: 40,
      duration: 8,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    })

    gsap.to('.ambient-glow-2', {
      x: -50,
      y: -30,
      duration: 10,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    })

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#06070a]">
      {/* 3D Three.js WebGL Interactive Canvas */}
      <ThreeCanvas />

      {/* Radial glow spots */}
      <div className="ambient-glow-1 absolute -top-40 left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px]" />
      <div className="ambient-glow-2 absolute top-1/3 -right-20 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px]" />

      {/* Grid background */}
      <div className="absolute inset-0 bg-aether-grid opacity-25" />

      {/* Particle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-50" />
    </div>
  )
}
