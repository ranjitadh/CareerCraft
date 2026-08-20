'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useResumeStore } from '@/stores/resume-store'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Loader2,
  FileText,
  Sparkles,
  PenTool,
  CheckCircle2,
  Download,
  AlertCircle,
  Lightbulb,
  Target,
  Check,
  X,
  FileDown,
  RotateCcw,
} from 'lucide-react'
import WizardStep from '@/components/resume/WizardStep'
import StepProgress from '@/components/resume/StepProgress'
import AnalysisCard from '@/components/resume/AnalysisCard'
import KeywordChip from '@/components/resume/KeywordChip'
import BulletEditor from '@/components/resume/BulletEditor'

const TOTAL_STEPS = 5

export default function NewResumePage() {
  const router = useRouter()
  const store = useResumeStore()

  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Step 1 validation
  const canProceedStep1 = useMemo(
    () =>
      store.resumeName.trim().length > 0 &&
      store.jobDescription.trim().length >= 50,
    [store.resumeName, store.jobDescription]
  )

  const handleAnalyze = useCallback(async () => {
    if (!canProceedStep1) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    setLoadingMessage('Creating resume...')
    setError(null)

    try {
      // Step A: Create the resume
      const createRes = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: store.resumeName,
          companyName: store.companyName || undefined,
          targetRole: store.targetRole || undefined,
          jobDescription: store.jobDescription,
          template: store.template,
        }),
      })

      if (!createRes.ok) {
        const data = await createRes.json()
        throw new Error(data.error || 'Failed to create resume')
      }

      const { resume } = await createRes.json()
      store.setResumeId(resume.id)

      // Step B: Analyze
      setLoadingMessage('Analyzing job description with AI...')
      const analyzeRes = await fetch(`/api/resumes/${resume.id}/analyze`, {
        method: 'POST',
      })

      if (!analyzeRes.ok) {
        const data = await analyzeRes.json()
        throw new Error(data.error || 'Failed to analyze job description')
      }

      const { analysis } = await analyzeRes.json()
      store.setAnalysis(analysis)
      store.setStep(2)
      toast.success('Analysis complete!')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      toast.error(err.message || 'Analysis failed')
    } finally {
      setIsLoading(false)
      setLoadingMessage('')
    }
  }, [canProceedStep1, store])

  const handleGenerateResume = useCallback(async () => {
    if (!store.resumeId) return

    setIsLoading(true)
    setLoadingMessage('Generating tailored resume content...')
    setError(null)

    try {
      const res = await fetch(`/api/resumes/${store.resumeId}/generate`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to generate resume')
      }

      const { resumeContent } = await res.json()
      store.setResumeContent(resumeContent)
      store.setStep(3)
      toast.success('Resume content generated!')
    } catch (err: any) {
      setError(err.message || 'Generation failed')
      toast.error(err.message || 'Failed to generate resume')
    } finally {
      setIsLoading(false)
      setLoadingMessage('')
    }
  }, [store])

  const handleQualityCheck = useCallback(async () => {
    if (!store.resumeId) return

    setIsLoading(true)
    setLoadingMessage('Running quality checks...')
    setError(null)

    try {
      const res = await fetch(`/api/resumes/${store.resumeId}/quality-check`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Quality check failed')
      }

      const { qualityCheck } = await res.json()
      store.setQualityCheck(qualityCheck)
      store.setStep(4)
    } catch (err: any) {
      setError(err.message || 'Quality check failed')
      toast.error(err.message || 'Quality check failed')
    } finally {
      setIsLoading(false)
      setLoadingMessage('')
    }
  }, [store])

  const handleGenerateLatex = useCallback(async () => {
    if (!store.resumeId) return

    setIsLoading(true)
    setLoadingMessage('Generating LaTeX source...')
    setError(null)

    try {
      const res = await fetch(`/api/resumes/${store.resumeId}/latex`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to generate LaTeX')
      }

      const { latex, pdfUrl } = await res.json()
      store.setLatexSource(latex)
      store.setStep(5)
      toast.success('Resume ready for export!')
    } catch (err: any) {
      setError(err.message || 'LaTeX generation failed')
      toast.error(err.message || 'Failed to generate LaTeX')
    } finally {
      setIsLoading(false)
      setLoadingMessage('')
    }
  }, [store])

  const canGoBack = store.step > 1 && store.step < 5
  const canGoNext = false // Navigation handled by action buttons per step

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/resumes')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to resumes
        </button>
        <h1 className="text-2xl font-bold tracking-tight">Create New Resume</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Build a tailored, ATS-optimized resume in 5 steps
        </p>
      </div>

      {/* Progress */}
      <StepProgress currentStep={store.step} />

      {/* Loading overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-card border border-border shadow-2xl"
            >
              <div className="relative">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-primary animate-pulse" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-foreground">{loadingMessage}</p>
                <p className="text-xs text-muted-foreground">This may take a moment...</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-foreground flex-1">{error}</p>
              <button
                onClick={() => setError(null)}
                className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step Content */}
      <div className="relative min-h-[500px]">
        <AnimatePresence mode="wait" custom={store.step}>
        {/* Step 1: Job Description */}
        <WizardStep stepKey={1} currentStep={store.step}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              <div className="rounded-xl border border-border bg-card p-6 space-y-5">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">Job Details</h2>
                  <p className="text-sm text-muted-foreground">
                    Provide the job posting details to tailor your resume
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Resume Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={store.resumeName}
                      onChange={(e) => store.setResumeName(e.target.value)}
                      placeholder="e.g., Senior Frontend Engineer at Google"
                      className="w-full h-11 px-4 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Company Name</label>
                      <input
                        type="text"
                        value={store.companyName}
                        onChange={(e) => store.setCompanyName(e.target.value)}
                        placeholder="e.g., Google"
                        className="w-full h-11 px-4 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Target Role</label>
                      <input
                        type="text"
                        value={store.targetRole}
                        onChange={(e) => store.setTargetRole(e.target.value)}
                        placeholder="e.g., Senior Frontend Engineer"
                        className="w-full h-11 px-4 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Job Description <span className="text-destructive">*</span>
                    </label>
                    <textarea
                      value={store.jobDescription}
                      onChange={(e) => store.setJobDescription(e.target.value)}
                      placeholder="Paste the full job description here..."
                      rows={12}
                      className="w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all resize-none leading-relaxed"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-muted-foreground">
                        Minimum 50 characters required
                      </p>
                      <span
                        className={cn(
                          'text-[11px] font-medium',
                          store.jobDescription.length >= 50
                            ? 'text-emerald-400'
                            : 'text-muted-foreground'
                        )}
                      >
                        {store.jobDescription.length} / 50 min
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={!canProceedStep1 || isLoading}
                  className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Analyze Job Description
                </button>
              </div>
            </div>

            {/* Info panel */}
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold">Tips for best results</h3>
                </div>
                <ul className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>Paste the complete job posting including requirements, responsibilities, and nice-to-haves</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>The AI will identify key skills, keywords, and match them against your profile</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>A complete profile in &quot;My Profile&quot; leads to much better resume tailoring</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>Include salary range and benefits info — the AI can reference company perks</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-primary">How it works</h3>
                </div>
                <ol className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">1</span>
                    <span>AI analyzes the job description for skills, keywords, and requirements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">2</span>
                    <span>Match score shows how well your profile aligns with the role</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">3</span>
                    <span>Resume is tailored with optimized bullet points and keywords</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">4</span>
                    <span>Quality check ensures ATS compatibility before export</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </WizardStep>

        {/* Step 2: Analysis Results */}
        <WizardStep stepKey={2} currentStep={store.step}>
          <div className="space-y-6">
            {store.analysis && (
              <>
                {/* Profile Match Score */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative">
                      <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                        <circle
                          cx="60"
                          cy="60"
                          r="52"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          className="text-border"
                        />
                        <motion.circle
                          cx="60"
                          cy="60"
                          r="52"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          strokeLinecap="round"
                          className="text-primary"
                          strokeDasharray={2 * Math.PI * 52}
                          initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                          animate={{
                            strokeDashoffset:
                              2 * Math.PI * 52 * (1 - (store.analysis.profileMatchScore || 0)),
                          }}
                          transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.span
                          className="text-2xl font-bold text-foreground"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          {Math.round((store.analysis.profileMatchScore || 0) * 100)}%
                        </motion.span>
                        <span className="text-[10px] text-muted-foreground">Match</span>
                      </div>
                    </div>
                    <div className="text-center sm:text-left space-y-2">
                      <h2 className="text-lg font-semibold">Profile Match Score</h2>
                      <p className="text-sm text-muted-foreground">
                        Your profile matches {store.analysis.supportedKeywords?.length || 0} of{' '}
                        {store.analysis.keywords?.length || 0} key requirements
                      </p>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1.5 text-emerald-400">
                          <Check className="w-3.5 h-3.5" />
                          {store.analysis.supportedKeywords?.length || 0} supported
                        </span>
                        <span className="flex items-center gap-1.5 text-amber-400">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {store.analysis.unsupportedKeywords?.length || 0} unsupported
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Analysis cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Role Overview */}
                  <AnalysisCard
                    title="Role Overview"
                    icon={<Target className="w-4 h-4" />}
                    delay={0.15}
                  >
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Target Role</span>
                        <span className="font-medium">{store.analysis.targetRole}</span>
                      </div>
                      {store.analysis.seniority && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Seniority</span>
                          <span className="font-medium">{store.analysis.seniority}</span>
                        </div>
                      )}
                      {store.analysis.industry && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Industry</span>
                          <span className="font-medium">{store.analysis.industry}</span>
                        </div>
                      )}
                    </div>
                  </AnalysisCard>

                  {/* Required Skills */}
                  <AnalysisCard
                    title="Required Skills"
                    type="chips"
                    icon={<Sparkles className="w-4 h-4" />}
                    delay={0.2}
                  >
                    <div className="flex flex-wrap gap-1.5">
                      {store.analysis.requiredSkills?.map((skill: string) => (
                        <KeywordChip
                          key={skill}
                          keyword={skill}
                          status={
                            store.analysis.supportedKeywords?.includes(skill)
                              ? 'supported'
                              : 'unsupported'
                          }
                        />
                      ))}
                    </div>
                  </AnalysisCard>

                  {/* Preferred Skills */}
                  {store.analysis.preferredSkills?.length > 0 && (
                    <AnalysisCard
                      title="Preferred Skills"
                      type="chips"
                      delay={0.25}
                    >
                      <div className="flex flex-wrap gap-1.5">
                        {store.analysis.preferredSkills.map((skill: string) => (
                          <KeywordChip
                            key={skill}
                            keyword={skill}
                            status={
                              store.analysis.supportedKeywords?.includes(skill)
                                ? 'supported'
                                : 'neutral'
                            }
                          />
                        ))}
                      </div>
                    </AnalysisCard>
                  )}

                  {/* Key Responsibilities */}
                  <AnalysisCard
                    title="Key Responsibilities"
                    icon={<FileText className="w-4 h-4" />}
                    delay={0.3}
                  >
                    <ul className="space-y-1.5">
                      {store.analysis.responsibilities?.map(
                        (resp: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                            {resp}
                          </li>
                        )
                      )}
                    </ul>
                  </AnalysisCard>
                </div>

                {/* Keywords section */}
                <AnalysisCard
                  title="Keywords Analysis"
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  delay={0.35}
                >
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-medium text-emerald-400 mb-2 flex items-center gap-1.5">
                        <Check className="w-3 h-3" />
                        Supported Keywords ({store.analysis.supportedKeywords?.length || 0})
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {store.analysis.supportedKeywords?.map((kw: string) => (
                          <KeywordChip key={kw} keyword={kw} status="supported" />
                        ))}
                      </div>
                    </div>
                    {store.analysis.unsupportedKeywords?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-amber-400 mb-2 flex items-center gap-1.5">
                          <AlertCircle className="w-3 h-3" />
                          Unsupported Keywords ({store.analysis.unsupportedKeywords.length})
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {store.analysis.unsupportedKeywords.map((kw: string) => (
                            <KeywordChip key={kw} keyword={kw} status="unsupported" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </AnalysisCard>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <button
                    onClick={handleGenerateResume}
                    disabled={isLoading}
                    className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    <PenTool className="w-4 h-4" />
                    Generate Tailored Resume
                  </button>
                  <button
                    onClick={() => store.setStep(1)}
                    className="h-11 rounded-lg border border-border bg-background text-foreground font-medium text-sm hover:bg-accent transition-all flex items-center justify-center gap-2 px-6"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Edit Profile First
                  </button>
                </div>
              </>
            )}
          </div>
        </WizardStep>

        {/* Step 3: Tailor Resume */}
        <WizardStep stepKey={3} currentStep={store.step}>
          <div className="space-y-6">
            {store.resumeContent && (
              <>
                {/* Warnings */}
                {store.resumeContent.warnings?.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4"
                  >
                    <h4 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Warnings
                    </h4>
                    <ul className="space-y-1">
                      {store.resumeContent.warnings.map((w: string, i: number) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="text-amber-400">•</span>
                          {w}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* Professional Summary */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-xl border border-border bg-card p-6 space-y-3"
                >
                  <h3 className="text-sm font-semibold">Professional Summary</h3>
                  <textarea
                    value={store.resumeContent.professionalSummary}
                    onChange={(e) =>
                      store.setResumeContent({
                        ...store.resumeContent,
                        professionalSummary: e.target.value,
                      })
                    }
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all resize-none leading-relaxed"
                  />
                </motion.div>

                {/* Core Skills */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="rounded-xl border border-border bg-card p-6 space-y-3"
                >
                  <h3 className="text-sm font-semibold">Core Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {store.resumeContent.coreSkills?.map((skill: string, i: number) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20"
                      >
                        {skill}
                        <button
                          onClick={() => {
                            const newSkills = store.resumeContent.coreSkills.filter(
                              (_: string, idx: number) => idx !== i
                            )
                            store.setResumeContent({
                              ...store.resumeContent,
                              coreSkills: newSkills,
                            })
                          }}
                          className="hover:text-destructive transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </motion.div>

                {/* Experience */}
                {store.resumeContent.experience?.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-xl border border-border bg-card p-6 space-y-4"
                  >
                    <h3 className="text-sm font-semibold">Experience</h3>
                    <div className="space-y-4">
                      {store.resumeContent.experience.map(
                        (exp: any, expIdx: number) => (
                          <div
                            key={expIdx}
                            className="rounded-lg border border-border bg-background p-4 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium">{exp.title || exp.company}</p>
                                <p className="text-xs text-muted-foreground">
                                  {exp.tailoredBullets?.length || 0} bullet points
                                </p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {exp.tailoredBullets?.map(
                                (bullet: string, bIdx: number) => (
                                  <BulletEditor
                                    key={bIdx}
                                    bullet={bullet}
                                    index={bIdx}
                                    keywords={exp.usedKeywords}
                                    onUpdate={(idx, val) => {
                                      const newContent = { ...store.resumeContent }
                                      newContent.experience[expIdx].tailoredBullets[idx] = val
                                      store.setResumeContent(newContent)
                                    }}
                                    onRemove={(idx) => {
                                      const newContent = { ...store.resumeContent }
                                      newContent.experience[expIdx].tailoredBullets.splice(idx, 1)
                                      store.setResumeContent(newContent)
                                    }}
                                  />
                                )
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Projects */}
                {store.resumeContent.projects?.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="rounded-xl border border-border bg-card p-6 space-y-4"
                  >
                    <h3 className="text-sm font-semibold">Projects</h3>
                    <div className="space-y-4">
                      {store.resumeContent.projects.map(
                        (proj: any, projIdx: number) => (
                          <div
                            key={projIdx}
                            className="rounded-lg border border-border bg-background p-4 space-y-3"
                          >
                            <p className="text-sm font-medium">{proj.name}</p>
                            <div className="space-y-2">
                              {proj.tailoredBullets?.map(
                                (bullet: string, bIdx: number) => (
                                  <BulletEditor
                                    key={bIdx}
                                    bullet={bullet}
                                    index={bIdx}
                                    onUpdate={(idx, val) => {
                                      const newContent = { ...store.resumeContent }
                                      newContent.projects[projIdx].tailoredBullets[idx] = val
                                      store.setResumeContent(newContent)
                                    }}
                                    onRemove={(idx) => {
                                      const newContent = { ...store.resumeContent }
                                      newContent.projects[projIdx].tailoredBullets.splice(idx, 1)
                                      store.setResumeContent(newContent)
                                    }}
                                  />
                                )
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Education */}
                {store.resumeContent.educationIds?.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-xl border border-border bg-card p-6 space-y-3"
                  >
                    <h3 className="text-sm font-semibold">Education</h3>
                    <p className="text-xs text-muted-foreground italic">
                      Education is pulled from your profile and is read-only
                    </p>
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <button
                    onClick={handleQualityCheck}
                    disabled={isLoading}
                    className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Run Quality Check
                  </button>
                  <button
                    onClick={() => store.setStep(2)}
                    className="h-11 rounded-lg border border-border bg-background text-foreground font-medium text-sm hover:bg-accent transition-all flex items-center justify-center gap-2 px-6"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                </div>
              </>
            )}
          </div>
        </WizardStep>

        {/* Step 4: Review */}
        <WizardStep stepKey={4} currentStep={store.step}>
          <div className="space-y-6">
            {store.qualityCheck && (
              <>
                {/* Overall score */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" className="text-border" />
                        <motion.circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="6"
                          strokeLinecap="round"
                          className={cn(
                            store.qualityCheck.overallScore >= 80
                              ? 'text-emerald-400'
                              : store.qualityCheck.overallScore >= 60
                              ? 'text-amber-400'
                              : 'text-destructive'
                          )}
                          strokeDasharray={2 * Math.PI * 42}
                          initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                          animate={{
                            strokeDashoffset:
                              2 * Math.PI * 42 * (1 - store.qualityCheck.overallScore / 100),
                          }}
                          transition={{ duration: 1, delay: 0.2 }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-bold">{store.qualityCheck.overallScore}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Quality Score</h3>
                      <p className="text-sm text-muted-foreground">
                        {store.qualityCheck.overallScore >= 80
                          ? 'Excellent! Your resume is ready.'
                          : store.qualityCheck.overallScore >= 60
                          ? 'Good, but some improvements suggested.'
                          : 'Consider addressing the issues below.'}
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Quality details grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <AnalysisCard title="Keyword Alignment" delay={0.1}>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold">{store.qualityCheck.keywordAlignment}</span>
                      <span className="text-xs text-muted-foreground">/100</span>
                    </div>
                  </AnalysisCard>
                  <AnalysisCard title="ATS Compatibility" delay={0.15}>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold">{store.qualityCheck.atsCompatibility}</span>
                      <span className="text-xs text-muted-foreground">/100</span>
                    </div>
                  </AnalysisCard>
                  <AnalysisCard title="Content Score" delay={0.2}>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold">{store.qualityCheck.contentScore}</span>
                      <span className="text-xs text-muted-foreground">/100</span>
                    </div>
                  </AnalysisCard>
                </div>

                {/* Issues */}
                <div className="space-y-4">
                  {store.qualityCheck.unsupportedClaims?.length > 0 && (
                    <AnalysisCard title="Unsupported Claims" delay={0.25}>
                      <ul className="space-y-1.5">
                        {store.qualityCheck.unsupportedClaims.map((claim: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                            {claim}
                          </li>
                        ))}
                      </ul>
                    </AnalysisCard>
                  )}

                  {store.qualityCheck.repeatedWording?.length > 0 && (
                    <AnalysisCard title="Repeated Wording" delay={0.3}>
                      <div className="flex flex-wrap gap-2">
                        {store.qualityCheck.repeatedWording.map((word: string, i: number) => (
                          <span key={i} className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
                            &quot;{word}&quot;
                          </span>
                        ))}
                      </div>
                    </AnalysisCard>
                  )}

                  {store.qualityCheck.weakBullets?.length > 0 && (
                    <AnalysisCard title="Weak Bullet Points" delay={0.35}>
                      <ul className="space-y-1.5">
                        {store.qualityCheck.weakBullets.map((bullet: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <AlertCircle className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </AnalysisCard>
                  )}

                  {/* ATS Status */}
                  <AnalysisCard title="ATS Formatting Status" delay={0.4}>
                    <div className="flex items-center gap-2">
                      {store.qualityCheck.atsFormattingStatus === 'pass' ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <span className="text-sm text-emerald-400 font-medium">Passing</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-amber-400" />
                          <span className="text-sm text-amber-400 font-medium">
                            {store.qualityCheck.atsFormattingStatus}
                          </span>
                        </>
                      )}
                    </div>
                  </AnalysisCard>
                </div>

                {/* Confirmation checklist */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="rounded-xl border border-border bg-card p-6 space-y-4"
                >
                  <h3 className="text-sm font-semibold">Please confirm</h3>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="mt-0.5 w-4 h-4 rounded border-input bg-background text-primary focus:ring-ring focus:ring-2 accent-primary"
                      id="confirm-review"
                    />
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      I have reviewed the resume content and confirm all information is accurate
                    </span>
                  </label>
                </motion.div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <button
                    onClick={handleGenerateLatex}
                    disabled={isLoading}
                    className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Generate LaTeX &amp; PDF
                  </button>
                  <button
                    onClick={() => store.setStep(3)}
                    className="h-11 rounded-lg border border-border bg-background text-foreground font-medium text-sm hover:bg-accent transition-all flex items-center justify-center gap-2 px-6"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Editing
                  </button>
                </div>
              </>
            )}
          </div>
        </WizardStep>

        {/* Step 5: Export */}
        <WizardStep stepKey={5} currentStep={store.step}>
          <div className="space-y-6">
            {/* Success state */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center space-y-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
                className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center mx-auto"
              >
                <motion.div
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <Check className="w-8 h-8 text-emerald-400" />
                </motion.div>
              </motion.div>
              <div>
                <h2 className="text-xl font-bold">Resume Generated!</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Your tailored resume is ready for download
                </p>
              </div>
            </motion.div>

            {/* Download actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.button
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={() => {
                  if (store.resumeId) {
                    window.open(`/api/resumes/${store.resumeId}/download/pdf`, '_blank')
                  }
                }}
                className="flex items-center gap-4 p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <FileDown className="w-6 h-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">Download PDF</p>
                  <p className="text-xs text-muted-foreground">ATS-optimized, print-ready</p>
                </div>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                onClick={() => {
                  if (store.latexSource) {
                    const blob = new Blob([store.latexSource], { type: 'text/plain' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `${store.resumeName || 'resume'}.tex`
                    a.click()
                    URL.revokeObjectURL(url)
                  }
                }}
                className="flex items-center gap-4 p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <FileText className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">Download LaTeX</p>
                  <p className="text-xs text-muted-foreground">Source code (.tex)</p>
                </div>
              </motion.button>
            </div>

            {/* Resume metadata */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-xl border border-border bg-card p-5"
            >
              <h3 className="text-sm font-semibold mb-3">Resume Details</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Name</span>
                  <p className="font-medium">{store.resumeName}</p>
                </div>
                {store.companyName && (
                  <div>
                    <span className="text-muted-foreground">Company</span>
                    <p className="font-medium">{store.companyName}</p>
                  </div>
                )}
                {store.targetRole && (
                  <div>
                    <span className="text-muted-foreground">Target Role</span>
                    <p className="font-medium">{store.targetRole}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Template</span>
                  <p className="font-medium capitalize">{store.template.replace(/-/g, ' ')}</p>
                </div>
              </div>
            </motion.div>

            {/* Application checklist */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="rounded-xl border border-border bg-card p-5 space-y-3"
            >
              <h3 className="text-sm font-semibold">Before you apply</h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  Customize the cover letter for this specific company
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  Verify all contact information is current
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  Research the hiring manager for personalization
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  Double-check the company name spelling
                </li>
              </ul>
            </motion.div>

            {/* Disclaimer */}
            <p className="text-[11px] text-muted-foreground/60 text-center">
              This resume was generated by AI. Always review and verify the content before submitting.
              Some claims may need manual verification.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => {
                  store.reset()
                  router.push('/resumes/new')
                }}
                className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Create Another Version
              </button>
              <button
                onClick={() => router.push('/resumes')}
                className="h-11 rounded-lg border border-border bg-background text-foreground font-medium text-sm hover:bg-accent transition-all flex items-center justify-center gap-2 px-6"
              >
                View All Resumes
              </button>
            </div>
          </div>
        </WizardStep>
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      {canGoBack && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/80 backdrop-blur-lg lg:ml-64"
        >
          <div className="max-w-5xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
            <button
              onClick={() => store.setStep(store.step - 1)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <span className="text-xs text-muted-foreground">
              Step {store.step} of {TOTAL_STEPS}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  )
}
