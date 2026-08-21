'use client'

import { useState, useRef, useEffect } from 'react'
import gsap from 'gsap'
import { Sparkles, Send, X, Terminal, ChevronUp } from 'lucide-react'

export default function AetherPromptDrawer() {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [query, setQuery] = useState<string>('')
  const [response, setResponse] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      gsap.fromTo(
        drawerRef.current,
        { y: 60, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.2)' }
      )
    }
  }, [isOpen])

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)
    setResponse(null)

    // Simulate AI response stream
    setTimeout(() => {
      setResponse(
        `[SYSTEM RESPONSE]\nAnalyzing query: "${query}"\n\n- Verification: All career experiences matched against Master Profile.\n- Recommended Action: Target role alignment score is 94%.`
      )
      setIsLoading(false)
    }, 800)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          data-cursor="[ ASK AI ]"
          className="group relative flex items-center gap-3 bg-[#0c0f17]/90 backdrop-blur-xl border border-cyan-500/30 hover:border-cyan-400 px-5 py-3 rounded-full shadow-[0_0_25px_rgba(0,240,255,0.2)] transition-all hover:scale-105"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
          </span>
          <span className="text-xs font-mono tracking-widest text-cyan-300 group-hover:text-cyan-200">
            [ ASK RESUMEFORGE AI ]
          </span>
          <ChevronUp className="w-4 h-4 text-cyan-400 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      ) : (
        <div
          ref={drawerRef}
          className="w-[360px] sm:w-[420px] bg-[#090b12]/95 backdrop-blur-2xl border border-cyan-500/40 rounded-xl p-5 shadow-[0_0_40px_rgba(0,240,255,0.25)] space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono tracking-wider text-cyan-300 uppercase">
                [ AI INTERACTIVE PROMPT ]
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Response area */}
          {response && (
            <div className="bg-[#050609] border border-cyan-500/20 rounded-lg p-3 text-xs font-mono text-cyan-200 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
              {response}
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about resume tailoring or keywords..."
              className="flex-1 bg-[#050609] border border-white/10 focus:border-cyan-400 text-xs text-slate-100 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 transition-all placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-cyan-500 hover:bg-cyan-400 text-black px-3.5 py-2.5 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
