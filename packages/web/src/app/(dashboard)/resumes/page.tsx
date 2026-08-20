'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Search,
  ExternalLink,
  Copy,
  Trash2,
  Download,
  Clock,
  Edit3,
  Check,
  X,
  ChevronDown,
  FilePlus,
} from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { EmptyState } from '@/components/resume/EmptyState'
import { ConfirmDialog } from '@/components/resume/ConfirmDialog'
import toast from 'react-hot-toast'

interface Resume {
  id: string
  name: string
  targetRole: string | null
  companyName: string | null
  status: string
  keywordAlignmentScore: number | null
  template: string
  createdAt: string
  updatedAt: string
  versions: { id: string; pdfPath: string | null }[]
}

type StatusFilter = 'all' | 'draft' | 'generated' | 'compiled'
type SortOption = 'newest' | 'oldest' | 'best_alignment'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'draft':
      return { label: 'Draft', className: 'bg-muted text-muted-foreground' }
    case 'analyzed':
      return { label: 'Analyzed', className: 'bg-primary/10 text-primary' }
    case 'generated':
      return { label: 'Generated', className: 'bg-blue-500/10 text-blue-500' }
    case 'compiled':
      return { label: 'Compiled', className: 'bg-success/10 text-success' }
    default:
      return { label: status, className: 'bg-muted text-muted-foreground' }
  }
}

function getAlignmentColor(score: number) {
  if (score >= 80) return 'bg-success'
  if (score >= 50) return 'bg-primary'
  return 'bg-warning'
}

function getRelativeTime(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(date)
}

const templateLabels: Record<string, string> = {
  'classic-professional': 'Classic Professional',
  'modern-minimalist': 'Modern Minimalist',
  'creative-bold': 'Creative Bold',
  'executive': 'Executive',
}

export default function ResumesPage() {
  const router = useRouter()
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [deleteTarget, setDeleteTarget] = useState<Resume | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchResumes() {
      try {
        const res = await fetch('/api/resumes')
        if (res.ok) {
          const data = await res.json()
          setResumes(data)
        }
      } catch {
        toast.error('Failed to load resumes')
      } finally {
        setLoading(false)
      }
    }
    fetchResumes()
  }, [])

  const filtered = useMemo(() => {
    let result = [...resumes]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.companyName?.toLowerCase().includes(q) ||
          r.targetRole?.toLowerCase().includes(q)
      )
    }

    if (statusFilter !== 'all') {
      result = result.filter((r) => {
        if (statusFilter === 'compiled') return r.status === 'compiled'
        if (statusFilter === 'generated') return r.status === 'generated'
        if (statusFilter === 'draft') return r.status === 'draft' || r.status === 'analyzed'
        return true
      })
    }

    switch (sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      case 'best_alignment':
        result.sort(
          (a, b) => (b.keywordAlignmentScore ?? 0) - (a.keywordAlignmentScore ?? 0)
        )
        break
      case 'newest':
      default:
        result.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
    }

    return result
  }, [resumes, search, statusFilter, sortBy])

  async function handleDuplicate(resumeId: string) {
    try {
      const res = await fetch(`/api/resumes/${resumeId}/duplicate`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setResumes((prev) => [data, ...prev])
        toast.success('Resume duplicated')
      } else {
        toast.error('Failed to duplicate')
      }
    } catch {
      toast.error('Failed to duplicate')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/resumes/${deleteTarget.id}`, { method: 'DELETE' })
      if (res.ok) {
        setResumes((prev) => prev.filter((r) => r.id !== deleteTarget.id))
        toast.success('Resume deleted')
      } else {
        toast.error('Failed to delete')
      }
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  function startRename(resume: Resume) {
    setRenamingId(resume.id)
    setRenameValue(resume.name)
  }

  async function submitRename() {
    if (!renamingId || !renameValue.trim()) return
    setRenaming(true)
    try {
      const res = await fetch(`/api/resumes/${renamingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: renameValue.trim() }),
      })
      if (res.ok) {
        setResumes((prev) =>
          prev.map((r) => (r.id === renamingId ? { ...r, name: renameValue.trim() } : r))
        )
        toast.success('Renamed')
      } else {
        toast.error('Failed to rename')
      }
    } catch {
      toast.error('Failed to rename')
    } finally {
      setRenaming(false)
      setRenamingId(null)
    }
  }

  async function handleDownload(resume: Resume) {
    const latestVersion = resume.versions?.[0]
    if (!latestVersion?.pdfPath) {
      toast.error('No PDF available. Generate the resume first.')
      return
    }
    setDownloadingId(resume.id)
    try {
      const res = await fetch(`/api/resumes/${resume.id}/download/pdf`)
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${resume.name.replace(/\s+/g, '_')}.pdf`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        toast.error('Download failed')
      }
    } catch {
      toast.error('Download failed')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Resumes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and track all your tailored resumes.
          </p>
        </div>
        <Link
          href="/resumes/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          <FilePlus className="w-4 h-4" />
          Create resume
        </Link>
      </div>

      {/* Filters */}
      {!loading && resumes.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, company, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 rounded-lg border border-input bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="h-10 rounded-lg border border-input bg-background px-4 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent appearance-none"
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="generated">Generated</option>
              <option value="compiled">Compiled</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-10 rounded-lg border border-input bg-background px-4 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent appearance-none"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="best_alignment">Best alignment</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-5 animate-pulse"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
                <div className="w-16 h-5 bg-muted rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 && resumes.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-6 h-6 text-muted-foreground" />}
          title="No resumes yet"
          description="Create your first tailored resume. Paste a job description and let ResumeForge AI optimize it for you."
          action={{
            label: 'Create your first resume',
            onClick: () => router.push('/resumes/new'),
          }}
          className="rounded-xl border border-border bg-card"
        />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Search className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No resumes match your filters</p>
          <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((resume) => {
              const badge = getStatusBadge(resume.status)
              const alignment = resume.keywordAlignmentScore
              const isRenaming = renamingId === resume.id
              const hasPdf = !!resume.versions?.[0]?.pdfPath

              return (
                <motion.div
                  key={resume.id}
                  layout
                  variants={itemVariants}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group rounded-xl border border-border bg-card p-5 hover:border-border/80 transition-colors flex flex-col"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <FileText className="w-4.5 h-4.5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        {isRenaming ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              autoFocus
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') submitRename()
                                if (e.key === 'Escape') setRenamingId(null)
                              }}
                              className="h-7 w-full rounded border border-primary bg-background px-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                            <button
                              onClick={submitRename}
                              disabled={renaming}
                              className="p-1 rounded text-success hover:bg-success/10"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setRenamingId(null)}
                              className="p-1 rounded text-muted-foreground hover:bg-accent"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <h3 className="text-sm font-semibold text-foreground truncate">
                            {resume.name}
                          </h3>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {resume.targetRole || 'No target role'}
                          {resume.companyName && (
                            <span> at {resume.companyName}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium capitalize',
                        badge.className
                      )}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Alignment bar */}
                  {alignment != null && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-medium text-muted-foreground">
                          Keyword alignment
                        </span>
                        <span className="text-[10px] font-semibold text-foreground">
                          {Math.round(alignment)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className={cn('h-full rounded-full', getAlignmentColor(alignment))}
                          initial={{ width: 0 }}
                          animate={{ width: `${alignment}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <Clock className="w-3 h-3" />
                    <span>{getRelativeTime(resume.updatedAt)}</span>
                    <span className="text-border">·</span>
                    <span>{templateLabels[resume.template] || resume.template}</span>
                  </div>

                  {/* Actions */}
                  <div className="mt-auto pt-3 border-t border-border flex items-center gap-1 flex-wrap">
                    <Link
                      href={`/resumes/${resume.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-accent transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open
                    </Link>
                    {hasPdf && (
                      <button
                        type="button"
                        onClick={() => handleDownload(resume)}
                        disabled={downloadingId === resume.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                      >
                        <Download className="w-3 h-3" />
                        {downloadingId === resume.id ? '...' : 'PDF'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDuplicate(resume.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={() => startRename(resume)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      <Edit3 className="w-3 h-3" />
                      Rename
                    </button>
                    <Link
                      href={`/resumes/${resume.id}?tab=versions`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      <Clock className="w-3 h-3" />
                      History
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(resume)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-auto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete resume?"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This will permanently remove the resume and all its versions. This cannot be undone.`}
        confirmLabel="Delete resume"
        loading={deleting}
      />
    </div>
  )
}
