import Link from 'next/link'
import { FileText, Sparkles, ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-lg text-center space-y-8">
        <div className="flex items-center justify-center gap-3">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <FileText className="w-7 h-7 text-primary" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            ResumeForge <span className="text-primary">AI</span>
          </h1>
        </div>

        <p className="text-muted-foreground text-lg leading-relaxed">
          Build ATS-optimized, professionally formatted resumes
          powered by AI. Stand out in every application.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border text-foreground font-medium text-sm hover:bg-accent transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  )
}
