'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import gsap from 'gsap'
import { Activity, Cpu, Sparkles, FileText, User, Settings, LogOut } from 'lucide-react'

export default function AetherHeader({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname()
  const waveformRef = useRef<HTMLDivElement>(null)
  const [isPlayingSound, setIsPlayingSound] = useState<boolean>(true)

  useEffect(() => {
    // Animate audio waveform bars using GSAP ticker
    const bars = waveformRef.current?.querySelectorAll('.sound-bar')
    if (!bars || bars.length === 0) return

    const ctx = gsap.context(() => {
      bars.forEach((bar, i) => {
        gsap.to(bar, {
          scaleY: 'random(0.2, 1)',
          duration: 0.3 + i * 0.05,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })
      })
    })

    return () => ctx.revert()
  }, [])

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#06070a]/80 border-b border-white/10 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Cyber Logo */}
        <Link
          href="/dashboard"
          data-cursor="[ HOME ]"
          className="flex items-center gap-3 group"
        >
          <div className="relative w-8 h-8 rounded-md bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center group-hover:border-cyan-400/80 transition-colors shadow-[0_0_12px_rgba(0,240,255,0.15)]">
            <svg viewBox="0 0 14 14" fill="none" className="w-5 h-5 text-cyan-400">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="0.8" />
              <circle cx="7" cy="7" r="2" fill="currentColor" />
              <circle cx="7" cy="1.5" r="0.8" fill="currentColor" />
              <circle cx="7" cy="12.5" r="0.8" fill="currentColor" />
              <circle cx="1.5" cy="7" r="0.8" fill="currentColor" />
              <circle cx="12.5" cy="7" r="0.8" fill="currentColor" />
            </svg>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-sm font-bold tracking-wider text-slate-100 uppercase">
              <span>ResumeForge</span>
              <span className="text-cyan-400 font-mono font-normal">: AI</span>
            </div>
            <span className="text-[9px] font-mono tracking-widest text-slate-400">
              [ OLLAMA : QWEN2.5 ]
            </span>
          </div>
        </Link>

        {/* Center: Cyber Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-[#0b0e17]/80 border border-white/10 rounded-full px-3 py-1.5 shadow-inner">
          <Link
            href="/dashboard"
            data-cursor="[ DASHBOARD ]"
            className={`px-4 py-1.5 rounded-full text-xs font-mono tracking-wider transition-all ${
              pathname === '/dashboard'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            DASHBOARD
          </Link>
          <Link
            href="/resumes"
            data-cursor="[ RESUMES ]"
            className={`px-4 py-1.5 rounded-full text-xs font-mono tracking-wider transition-all ${
              pathname.startsWith('/resumes')
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            RESUMES
          </Link>
          <Link
            href="/profile"
            data-cursor="[ PROFILE ]"
            className={`px-4 py-1.5 rounded-full text-xs font-mono tracking-wider transition-all ${
              pathname === '/profile'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            PROFILE
          </Link>
          <Link
            href="/settings"
            data-cursor="[ SETTINGS ]"
            className={`px-4 py-1.5 rounded-full text-xs font-mono tracking-wider transition-all ${
              pathname === '/settings'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            SETTINGS
          </Link>
        </nav>

        {/* Right: Audio Waveform & Status HUD */}
        <div className="flex items-center gap-4">
          {/* Audio Spectrum Widget */}
          <div
            ref={waveformRef}
            onClick={() => setIsPlayingSound(!isPlayingSound)}
            data-cursor="[ FREQUENCY ]"
            className="hidden sm:flex items-center gap-1 bg-cyan-500/5 border border-cyan-500/20 px-3 py-1.5 rounded-md cursor-pointer hover:border-cyan-400/50 transition-colors"
          >
            <span className="text-[9px] font-mono text-cyan-400 mr-1.5 tracking-widest">
              [ FREQ ]
            </span>
            <div className="flex items-center gap-[2px] h-3">
              <span className="sound-bar w-[2px] h-3 bg-cyan-400 origin-bottom" />
              <span className="sound-bar w-[2px] h-3 bg-cyan-400 origin-bottom" />
              <span className="sound-bar w-[2px] h-3 bg-cyan-400 origin-bottom" />
              <span className="sound-bar w-[2px] h-3 bg-cyan-400 origin-bottom" />
              <span className="sound-bar w-[2px] h-3 bg-cyan-400 origin-bottom" />
            </div>
          </div>

          {/* New Resume CTA */}
          <Link
            href="/resumes/new"
            data-cursor="[ CREATE ]"
            className="relative group overflow-hidden rounded-md p-[1px] font-mono text-xs tracking-wider"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 rounded-md animate-gradient" />
            <span className="relative flex items-center gap-2 bg-[#080a10] px-4 py-2 rounded-[5px] text-cyan-300 group-hover:bg-transparent group-hover:text-black transition-all">
              <Sparkles className="w-3.5 h-3.5" />
              <span>[ CREATE RESUME ]</span>
            </span>
          </Link>
        </div>
      </div>
    </header>
  )
}
