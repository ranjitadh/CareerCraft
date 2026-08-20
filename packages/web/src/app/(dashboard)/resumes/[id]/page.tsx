'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Save,
  Loader2,
  Download,
  Eye,
  Code2,
  PenTool,
  CheckCircle2,
  Plus,
  X,
  ChevronDown,
  Sparkles,
  Pencil,
  FileText,
  AlertCircle,
  Check,
  Clock,
  AlertTriangle,
  Settings2,
} from 'lucide-react'
import CodeEditor from '@/components/resume/CodeEditor'
import PdfPreview from '@/components/resume/PdfPreview'
import BulletEditor from '@/components/resume/BulletEditor'
import KeywordChip from '@/components/resume/KeywordChip'

type Tab = 'content' | 'latex' | 'preview' | 'quality'

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: 'content', label: 'Content', icon: PenTool },
  { id: 'latex', label: 'LaTeX', icon: Code2 },
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'quality', label: 'Quality Check', icon: CheckCircle2 },
]

export default function ResumeEditorPage() {
  const router = useRouter()
  const params = useParams()
  const resumeId = params.id as string

  const [activeTab, setActiveTab] = useState<Tab>('content')
  const [resumeName, setResumeName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [template, setTemplate] = useState('classic-professional')
  const [showTemplateMenu, setShowTemplateMenu] = useState(false)

  const [resumeData, setResumeData] = useState<any>(null)
  const [latexSource, setLatexSource] = useState('')
  const [latexErrors, setLatexErrors] = useState<string[]>([])
  const [qualityCheck, setQualityCheck] = useState<any>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [lastCompiled, setLastCompiled] = useState<string | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingLatex, setIsGeneratingLatex] = useState(false)

  const [newSkill, setNewSkill] = useState('')
  const [newSkillCategory, setNewSkillCategory] = useState('General')
  const [showAddSkill, setShowAddSkill] = useState(false)

  const [qualityConfirmed, setQualityConfirmed] = useState<Record<string, boolean>>({})

  // Fetch resume data
  useEffect(() => {
    async function fetchResume() {
      try {
        const res = await fetch(`/api/resumes/${resumeId}`)
        if (!res.ok) throw new Error('Failed to load resume')
        const data = await res.json()
        setResumeData(data.resume)
        setResumeName(data.resume.name)
        setTemplate(data.resume.template || 'classic-professional')
        setLatexSource(data.resume.latexSource || '')
        setQualityCheck(data.resume.qualityCheck)
      } catch (err: any) {
        toast.error('Failed to load resume')
        router.push('/resumes')
      } finally {
        setIsLoading(false)
      }
    }
    fetchResume()
  }, [resumeId, router])

  // Autosave
  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/resumes/${resumeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: resumeName,
          template,
          resumeContent: resumeData?.resumeContent,
          latexSource,
          qualityCheck,
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      setLastSaved(new Date().toLocaleTimeString())
      toast.success('Saved')
    } catch {
      toast.error('Failed to save')
    } finally {
      setIsSaving(false)
    }
  }, [resumeId, resumeName, template, resumeData, latexSource, qualityCheck])

  // Auto-save every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      if (resumeData) handleSave()
    }, 30000)
    return () => clearInterval(interval)
  }, [resumeData, handleSave])

  // Generate LaTeX
  const handleGenerateLatex = useCallback(async () => {
    setIsGeneratingLatex(true)
    try {
      const res = await fetch(`/api/resumes/${resumeId}/latex`, { method: 'POST' })
      if (!res.ok) throw new Error('LaTeX generation failed')
      const data = await res.json()
      setLatexSource(data.latex)
      setPdfUrl(data.pdfUrl)
      setLastCompiled('Just now')
      toast.success('LaTeX generated')
    } catch {
      toast.error('LaTeX generation failed')
    } finally {
      setIsGeneratingLatex(false)
    }
  }, [resumeId])

  // Compile LaTeX
  const handleCompileLatex = useCallback(async () => {
    setPdfLoading(true)
    setPdfError(null)
    try {
      const res = await fetch(`/api/resumes/${resumeId}/compile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latex: latexSource }),
      })
      if (!res.ok) {
        const data = await res.json()
        if (data.errors) setLatexErrors(data.errors)
        throw new Error(data.error || 'Compilation failed')
      }
      const data = await res.json()
      setPdfUrl(data.pdfUrl)
      setPdfError(null)
      setLatexErrors([])
      setLastCompiled('Just now')
    } catch (err: any) {
      setPdfError(err.message || 'Compilation failed')
    } finally {
      setPdfLoading(false)
    }
  }, [resumeId, latexSource])

  // Validate LaTeX
  const handleValidateLatex = useCallback(() => {
    const errors: string[] = []
    if (!latexSource) {
      setLatexErrors([])
      return
    }
    const lines = latexSource.split('\n')
    let braceCount = 0
    lines.forEach((line, i) => {
      for (const ch of line) {
        if (ch === '{') braceCount++
        if (ch === '}') braceCount--
      }
      if (braceCount < 0) {
        errors.push(`Line ${i + 1}: Extra closing brace`)
        braceCount = 0
      }
    })
    if (braceCount > 0) {
      errors.push(`Line ${lines.length}: ${braceCount} unclosed brace(s)`)
    }
    if (!latexSource.includes('\\begin{document}')) {
      errors.push('Missing \\begin{document}')
    }
    if (!latexSource.includes('\\end{document}')) {
      errors.push('Missing \\end{document}')
    }
    setLatexErrors(errors)
  }, [latexSource])

  // Quality check
  const handleRunQualityCheck = useCallback(async () => {
    try {
      const res = await fetch(`/api/resumes/${resumeId}/quality-check`, { method: 'POST' })
      if (!res.ok) throw new Error('Quality check failed')
      const data = await res.json()
      setQualityCheck(data.qualityCheck)
      toast.success('Quality check complete')
    } catch {
      toast.error('Quality check failed')
    }
  }, [resumeId])

  // AI rewrite bullet
  const handleAIRewrite = useCallback(
    async (section: 'experience' | 'projects', sectionIdx: number, bulletIdx: number, instruction: string) => {
      try {
        const res = await fetch(`/api/resumes/${resumeId}/ai-rewrite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ section, sectionIdx, bulletIdx, instruction }),
        })
        if (!res.ok) throw new Error('Rewrite failed')
        const { rewritten } = await res.json()
        const newContent = { ...resumeData.resumeContent }
        newContent[section][sectionIdx].tailoredBullets[bulletIdx] = rewritten
        setResumeData({ ...resumeData, resumeContent: newContent })
        toast.success('Bullet rewritten')
      } catch {
        toast.error('AI rewrite failed')
      }
    },
    [resumeId, resumeData]
  )

  // Add skill
  const handleAddSkill = useCallback(() => {
    if (!newSkill.trim()) return
    const newContent = { ...resumeData.resumeContent }
    newContent.coreSkills = [...(newContent.coreSkills || []), newSkill.trim()]
    setResumeData({ ...resumeData, resumeContent: newContent })
    setNewSkill('')
    setShowAddSkill(false)
  }, [newSkill, resumeData])

  // Remove skill
  const handleRemoveSkill = useCallback(
    (idx: number) => {
      const newContent = { ...resumeData.resumeContent }
      newContent.coreSkills = newContent.coreSkills.filter((_: string, i: number) => i !== idx)
      setResumeData({ ...resumeData, resumeContent: newContent })
    },
    [resumeData]
  )

  // Resume content from store
  const resumeContent = resumeData?.resumeContent

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (!resumeData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="text-sm text-muted-foreground">Resume not found</p>
        <button
          onClick={() => router.push('/resumes')}
          className="text-sm text-primary hover:underline"
        >
          Back to resumes
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push('/resumes')}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={resumeName}
            onChange={(e) => setResumeName(e.target.value)}
            className="text-lg font-bold tracking-tight bg-transparent border-none focus:outline-none focus:ring-0 min-w-0 flex-1"
          />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {lastSaved && (
            <span className="text-[11px] text-muted-foreground hidden sm:flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Saved {lastSaved}
            </span>
          )}
          <div className="relative">
            <button
              onClick={() => setShowTemplateMenu(!showTemplateMenu)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline capitalize">{template.replace(/-/g, ' ')}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            <AnimatePresence>
              {showTemplateMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 top-full mt-1 z-50 w-48 py-1 rounded-lg border border-border bg-popover shadow-xl"
                >
                  {['classic-professional', 'modern-minimal', 'executive', 'technical'].map(
                    (t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setTemplate(t)
                          setShowTemplateMenu(false)
                        }}
                        className={cn(
                          'w-full text-left px-3 py-2 text-xs font-medium transition-colors',
                          template === t
                            ? 'bg-primary/10 text-primary'
                            : 'text-foreground hover:bg-accent'
                        )}
                      >
                        {t.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      </button>
                    )
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save
          </button>
          <button
            onClick={() => {
              if (pdfUrl) {
                window.open(pdfUrl, '_blank')
              } else {
                handleGenerateLatex()
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border mb-4 flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors -mb-px',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            {tab.id === 'quality' && qualityCheck && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary ml-1" />
            )}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* Content Tab */}
          {activeTab === 'content' && (
            <motion.div
              key="content"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col lg:flex-row gap-6 overflow-hidden"
            >
              {/* Left panel - Editor */}
              <div className="flex-1 lg:w-3/5 overflow-y-auto space-y-5 pb-8 pr-0 lg:pr-4">
                {/* Professional Summary */}
                <section className="rounded-xl border border-border bg-card p-5 space-y-3">
                  <h3 className="text-sm font-semibold">Professional Summary</h3>
                  <textarea
                    value={resumeContent?.professionalSummary || ''}
                    onChange={(e) => {
                      const newContent = { ...resumeContent, professionalSummary: e.target.value }
                      setResumeData({ ...resumeData, resumeContent: newContent })
                    }}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all resize-none leading-relaxed"
                  />
                </section>

                {/* Core Skills */}
                <section className="rounded-xl border border-border bg-card p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Core Skills</h3>
                    <button
                      onClick={() => setShowAddSkill(!showAddSkill)}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </div>
                  <AnimatePresence>
                    {showAddSkill && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 overflow-hidden"
                      >
                        <input
                          type="text"
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                          placeholder="Skill name"
                          className="flex-1 h-9 px-3 rounded-lg bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                          autoFocus
                        />
                        <button
                          onClick={handleAddSkill}
                          className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => { setShowAddSkill(false); setNewSkill('') }}
                          className="h-9 px-3 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:text-foreground transition-colors"
                        >
                          Cancel
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="flex flex-wrap gap-2">
                    {resumeContent?.coreSkills?.map((skill: string, i: number) => (
                      <motion.span
                        key={`${skill}-${i}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20"
                      >
                        {skill}
                        <button
                          onClick={() => handleRemoveSkill(i)}
                          className="hover:text-destructive transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </motion.span>
                    ))}
                  </div>
                </section>

                {/* Experience */}
                {resumeContent?.experience?.length > 0 && (
                  <section className="rounded-xl border border-border bg-card p-5 space-y-4">
                    <h3 className="text-sm font-semibold">Experience</h3>
                    <div className="space-y-4">
                      {resumeContent.experience.map((exp: any, expIdx: number) => (
                        <div
                          key={expIdx}
                          className="rounded-lg border border-border bg-background p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">{exp.title || 'Position'}</p>
                              <p className="text-xs text-muted-foreground">{exp.company || 'Company'}</p>
                            </div>
                            {exp.relevance && (
                              <span
                                className={cn(
                                  'px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase',
                                  exp.relevance === 'high' && 'bg-emerald-500/10 text-emerald-400',
                                  exp.relevance === 'medium' && 'bg-amber-500/10 text-amber-400',
                                  exp.relevance === 'low' && 'bg-muted text-muted-foreground'
                                )}
                              >
                                {exp.relevance}
                              </span>
                            )}
                          </div>
                          <div className="space-y-2">
                            {exp.tailoredBullets?.map((bullet: string, bIdx: number) => (
                              <BulletEditor
                                key={bIdx}
                                bullet={bullet}
                                index={bIdx}
                                keywords={exp.usedKeywords}
                                onUpdate={(idx, val) => {
                                  const newContent = { ...resumeContent }
                                  newContent.experience[expIdx].tailoredBullets[idx] = val
                                  setResumeData({ ...resumeData, resumeContent: newContent })
                                }}
                                onRemove={(idx) => {
                                  const newContent = { ...resumeContent }
                                  newContent.experience[expIdx].tailoredBullets.splice(idx, 1)
                                  setResumeData({ ...resumeData, resumeContent: newContent })
                                }}
                                onAIRewrite={(idx, instruction) =>
                                  handleAIRewrite('experience', expIdx, idx, instruction)
                                }
                                onRestore={(idx) => {
                                  if (exp.originalBullets?.[idx]) {
                                    const newContent = { ...resumeContent }
                                    newContent.experience[expIdx].tailoredBullets[idx] =
                                      exp.originalBullets[idx]
                                    setResumeData({ ...resumeData, resumeContent: newContent })
                                  }
                                }}
                                original={exp.originalBullets?.[bIdx]}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Projects */}
                {resumeContent?.projects?.length > 0 && (
                  <section className="rounded-xl border border-border bg-card p-5 space-y-4">
                    <h3 className="text-sm font-semibold">Projects</h3>
                    <div className="space-y-4">
                      {resumeContent.projects.map((proj: any, projIdx: number) => (
                        <div
                          key={projIdx}
                          className="rounded-lg border border-border bg-background p-4 space-y-3"
                        >
                          <p className="text-sm font-medium">{proj.name || 'Project'}</p>
                          <div className="space-y-2">
                            {proj.tailoredBullets?.map((bullet: string, bIdx: number) => (
                              <BulletEditor
                                key={bIdx}
                                bullet={bullet}
                                index={bIdx}
                                onUpdate={(idx, val) => {
                                  const newContent = { ...resumeContent }
                                  newContent.projects[projIdx].tailoredBullets[idx] = val
                                  setResumeData({ ...resumeData, resumeContent: newContent })
                                }}
                                onRemove={(idx) => {
                                  const newContent = { ...resumeContent }
                                  newContent.projects[projIdx].tailoredBullets.splice(idx, 1)
                                  setResumeData({ ...resumeData, resumeContent: newContent })
                                }}
                                onAIRewrite={(idx, instruction) =>
                                  handleAIRewrite('projects', projIdx, idx, instruction)
                                }
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Education */}
                {resumeContent?.educationIds?.length > 0 && (
                  <section className="rounded-xl border border-border bg-card p-5 space-y-3">
                    <h3 className="text-sm font-semibold">Education</h3>
                    <p className="text-xs text-muted-foreground italic">
                      Education is pulled from your profile and cannot be edited here.
                      Update it in <span className="text-primary font-medium">My Profile</span>.
                    </p>
                  </section>
                )}

                {/* Certifications */}
                {resumeContent?.certificationIds?.length > 0 && (
                  <section className="rounded-xl border border-border bg-card p-5 space-y-3">
                    <h3 className="text-sm font-semibold">Certifications</h3>
                    <p className="text-xs text-muted-foreground italic">
                      Certifications are pulled from your profile.
                    </p>
                  </section>
                )}

                {/* Languages */}
                {resumeContent?.languageIds?.length > 0 && (
                  <section className="rounded-xl border border-border bg-card p-5 space-y-3">
                    <h3 className="text-sm font-semibold">Languages</h3>
                    <p className="text-xs text-muted-foreground italic">
                      Languages are pulled from your profile.
                    </p>
                  </section>
                )}
              </div>

              {/* Right panel - Preview */}
              <div className="hidden lg:block lg:w-2/5 flex-shrink-0">
                <div className="sticky top-0">
                  <PdfPreview
                    pdfUrl={pdfUrl}
                    isLoading={pdfLoading}
                    error={pdfError}
                    onRetry={handleCompileLatex}
                    onDownload={() => {
                      if (pdfUrl) window.open(pdfUrl, '_blank')
                    }}
                    lastCompiled={lastCompiled}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* LaTeX Tab */}
          {activeTab === 'latex' && (
            <motion.div
              key="latex"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col lg:flex-row gap-6 overflow-hidden"
            >
              <div className="flex-1 lg:w-3/5 overflow-hidden flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={handleValidateLatex}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Validate
                  </button>
                  <button
                    onClick={() => {
                      if (resumeData?.latexSource) setLatexSource(resumeData.latexSource)
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Reset to generated
                  </button>
                  <button
                    onClick={handleGenerateLatex}
                    disabled={isGeneratingLatex}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                  >
                    {isGeneratingLatex ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    Regenerate
                  </button>
                </div>
                <CodeEditor
                  value={latexSource}
                  onChange={setLatexSource}
                  readOnly={false}
                  errors={latexErrors}
                  className="flex-1"
                />
              </div>
              <div className="hidden lg:block lg:w-2/5 flex-shrink-0">
                <div className="sticky top-0">
                  <PdfPreview
                    pdfUrl={pdfUrl}
                    isLoading={pdfLoading}
                    error={pdfError}
                    onRetry={handleCompileLatex}
                    onDownload={() => {
                      if (pdfUrl) window.open(pdfUrl, '_blank')
                    }}
                    lastCompiled={lastCompiled}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <PdfPreview
                pdfUrl={pdfUrl}
                isLoading={pdfLoading}
                error={pdfError}
                onRetry={handleCompileLatex}
                onDownload={() => {
                  if (pdfUrl) window.open(pdfUrl, '_blank')
                }}
                lastCompiled={lastCompiled}
                className="h-full"
              />
            </motion.div>
          )}

          {/* Quality Check Tab */}
          {activeTab === 'quality' && (
            <motion.div
              key="quality"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-y-auto pb-8"
            >
              <div className="max-w-2xl space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Quality Check</h2>
                  <button
                    onClick={handleRunQualityCheck}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Run Quality Check
                  </button>
                </div>

                {!qualityCheck ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-8 h-8 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Run a quality check to see detailed feedback on your resume
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Overall Score */}
                    <div className="rounded-xl border border-border bg-card p-6 flex items-center gap-5">
                      <div className="relative">
                        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" className="text-border" />
                          <motion.circle
                            cx="50" cy="50" r="42" fill="none"
                            stroke="currentColor" strokeWidth="6" strokeLinecap="round"
                            className={cn(
                              qualityCheck.overallScore >= 80 ? 'text-emerald-400' :
                              qualityCheck.overallScore >= 60 ? 'text-amber-400' : 'text-destructive'
                            )}
                            strokeDasharray={2 * Math.PI * 42}
                            initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - qualityCheck.overallScore / 100) }}
                            transition={{ duration: 1 }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold">{qualityCheck.overallScore}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold">Overall Quality Score</h3>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                          <span className="text-muted-foreground">Keywords</span>
                          <span className="font-medium">{qualityCheck.keywordAlignment}/100</span>
                          <span className="text-muted-foreground">ATS</span>
                          <span className="font-medium">{qualityCheck.atsCompatibility}/100</span>
                          <span className="text-muted-foreground">Content</span>
                          <span className="font-medium">{qualityCheck.contentScore}/100</span>
                        </div>
                      </div>
                    </div>

                    {/* Unsupported Claims */}
                    {qualityCheck.unsupportedClaims?.length > 0 && (
                      <QualitySection
                        title="Unsupported Claims"
                        icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
                      >
                        {qualityCheck.unsupportedClaims.map((claim: string, i: number) => (
                          <QualityItem
                            key={i}
                            label={claim}
                            severity="warning"
                            checked={qualityConfirmed[`unsupported-${i}`] || false}
                            onToggle={() =>
                              setQualityConfirmed({
                                ...qualityConfirmed,
                                [`unsupported-${i}`]: !qualityConfirmed[`unsupported-${i}`],
                              })
                            }
                          />
                        ))}
                      </QualitySection>
                    )}

                    {/* Repeated Wording */}
                    {qualityCheck.repeatedWording?.length > 0 && (
                      <QualitySection
                        title="Repeated Wording"
                        icon={<AlertCircle className="w-4 h-4 text-amber-400" />}
                      >
                        <div className="flex flex-wrap gap-2">
                          {qualityCheck.repeatedWording.map((word: string, i: number) => (
                            <span key={i} className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
                              &quot;{word}&quot;
                            </span>
                          ))}
                        </div>
                      </QualitySection>
                    )}

                    {/* Weak Bullets */}
                    {qualityCheck.weakBullets?.length > 0 && (
                      <QualitySection
                        title="Weak Bullet Points"
                        icon={<AlertCircle className="w-4 h-4 text-muted-foreground" />}
                      >
                        {qualityCheck.weakBullets.map((bullet: string, i: number) => (
                          <QualityItem
                            key={i}
                            label={bullet}
                            severity="info"
                            checked={qualityConfirmed[`weak-${i}`] || false}
                            onToggle={() =>
                              setQualityConfirmed({
                                ...qualityConfirmed,
                                [`weak-${i}`]: !qualityConfirmed[`weak-${i}`],
                              })
                            }
                          />
                        ))}
                      </QualitySection>
                    )}

                    {/* Keyword Stuffing */}
                    {qualityCheck.potentialKeywordStuffing?.length > 0 && (
                      <QualitySection
                        title="Keyword Stuffing Warnings"
                        icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
                      >
                        {qualityCheck.potentialKeywordStuffing.map((item: string, i: number) => (
                          <QualityItem key={i} label={item} severity="warning" />
                        ))}
                      </QualitySection>
                    )}

                    {/* Checks */}
                    <QualitySection title="Checks" icon={<CheckCircle2 className="w-4 h-4" />}>
                      <QualityCheckItem
                        label="Contact information present"
                        passed={!qualityCheck.missingContactInfo}
                      />
                      <QualityCheckItem
                        label="All dates included"
                        passed={!qualityCheck.missingDates}
                      />
                      <QualityCheckItem
                        label="ATS formatting"
                        passed={qualityCheck.atsFormattingStatus === 'pass'}
                        detail={qualityCheck.atsFormattingStatus}
                      />
                    </QualitySection>

                    {/* Suggestions */}
                    {qualityCheck.suggestions?.length > 0 && (
                      <QualitySection title="Suggestions" icon={<Sparkles className="w-4 h-4 text-primary" />}>
                        <ul className="space-y-2">
                          {qualityCheck.suggestions.map((s: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                              <Check className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </QualitySection>
                    )}

                    {/* Confirmation */}
                    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                      <h3 className="text-sm font-semibold">Confirm Quality</h3>
                      <p className="text-xs text-muted-foreground">
                        Check all items to confirm you have reviewed the quality feedback
                      </p>
                      <div className="space-y-2 pt-2">
                        {(qualityCheck.unsupportedClaims || []).map((_: string, i: number) => (
                          <label key={i} className="flex items-start gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={qualityConfirmed[`unsupported-${i}`] || false}
                              onChange={() =>
                                setQualityConfirmed({
                                  ...qualityConfirmed,
                                  [`unsupported-${i}`]: !qualityConfirmed[`unsupported-${i}`],
                                })
                              }
                              className="mt-0.5 w-4 h-4 rounded border-input bg-background text-primary focus:ring-ring focus:ring-2 accent-primary"
                            />
                            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                              I have reviewed this unsupported claim
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Helper components for Quality Check tab

function QualitySection({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function QualityItem({
  label,
  severity,
  checked,
  onToggle,
}: {
  label: string
  severity: 'warning' | 'info'
  checked?: boolean
  onToggle?: () => void
}) {
  return (
    <label className="flex items-start gap-3 py-2 cursor-pointer group">
      {onToggle && (
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="mt-0.5 w-4 h-4 rounded border-input bg-background text-primary focus:ring-ring focus:ring-2 accent-primary"
        />
      )}
      <div className="flex-1">
        <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
          {label}
        </span>
      </div>
      {severity === 'warning' ? (
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
      ) : (
        <AlertCircle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
      )}
    </label>
  )
}

function QualityCheckItem({
  label,
  passed,
  detail,
}: {
  label: string
  passed: boolean
  detail?: string
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        {detail && !passed && (
          <span className="text-[10px] text-amber-400">{detail}</span>
        )}
        {passed ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        ) : (
          <AlertCircle className="w-4 h-4 text-destructive" />
        )}
      </div>
    </div>
  )
}
