export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left brand panel - hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-card border-r border-border flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-2.5 mb-16">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold text-lg">R</span>
            </div>
            <span className="text-xl font-bold tracking-tight">
              ResumeForge<span className="text-primary ml-1">AI</span>
            </span>
          </div>

          <h2 className="text-4xl font-bold tracking-tight leading-tight mb-6">
            Build resumes that
            <br />
            <span className="text-primary">get interviews</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
            AI-powered resume builder with real-time ATS scoring,
            intelligent content suggestions, and professional LaTeX templates.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-success" />
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-medium">ATS Score Analysis</span> - Know your resume passes before you submit
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-success" />
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-medium">AI Content Generation</span> - Professional bullet points and summaries
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-success" />
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-medium">LaTeX Export</span> - Publication-quality PDF output
            </p>
          </div>
        </div>
      </div>

      {/* Right content panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold text-lg">R</span>
            </div>
            <span className="text-xl font-bold tracking-tight">
              ResumeForge<span className="text-primary ml-1">AI</span>
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
