'use client'

import Link from 'next/link'
import { FileText, Sparkles } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      {/* Clean Light Top Header */}
      <header className="sticky top-0 z-30 h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 flex items-center justify-between shadow-sm">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-lg font-display tracking-tight text-slate-900 hover:text-blue-600 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <FileText className="w-4 h-4" />
          </div>
          <span>ResumeForge<span className="text-blue-600">.ai</span></span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            AI Ready (Ollama qwen2.5:7b)
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto p-4 sm:p-8">
        {children}
      </main>
    </div>
  )
}
