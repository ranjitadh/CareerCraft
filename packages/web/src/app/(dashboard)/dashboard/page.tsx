'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  FileText,
  FilePlus,
  TrendingUp,
  BarChart3,
  CalendarDays,
  MoreHorizontal,
  ExternalLink,
  Copy,
  Trash2,
  Search,
  Sparkles,
} from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { useProfile } from '@/hooks/use-profile'
import { SkeletonStatCard, SkeletonCard } from '@/components/resume/SkeletonCard'
import { EmptyState } from '@/components/resume/EmptyState'
import { ProgressBar } from '@/components/resume/ProgressBar'
import { ProgressRing } from '@/components/resume/ProgressBar'
import toast from 'react-hot-toast'

interface Resume {
  id: string
  name: string
  targetRole: string | null
  companyName: string | null
  status: string
  keywordAlignment: number | null
  createdAt: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

function getStatusColor(status: string) {
  switch (status) {
    case 'draft':
      return 'bg-muted text-muted-foreground'
    case 'processing':
      return 'bg-primary/10 text-primary'
    case 'completed':
      return 'bg-success/10 text-success'
    case 'error':
      return 'bg-destructive/10 text-destructive'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const { profile, isLoading: profileLoading } = useProfile()
  const [resumes, setResumes] = useState<Resume[]>([])
  const [resumesLoading, setResumesLoading] = useState(true)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

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
        setResumesLoading(false)
      }
    }
    fetchResumes()
  }, [])

  const isLoading = profileLoading || resumesLoading

  const totalResumes = resumes.length
  const now = new Date()
  const resumesThisMonth = resumes.filter((r) => {
    const d = new Date(r.createdAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const avgKeywordAlignment =
    resumes.length > 0
      ? Math.round(
          resumes.reduce((sum, r) => sum + (r.keywordAlignment ?? 0), 0) /
            resumes.length
        )
      : 0

  const profileCompleteness = profile
    ? (() => {
        let filled = 0
        let total = 0
        const fields = [
          profile.firstName,
          profile.lastName,
          profile.headline,
          profile.summary,
          profile.phone,
          profile.location,
        ]
        total += fields.length
        filled += fields.filter((f) => f && f.length > 0).length
        total += 3
        if (profile.experiences?.length) filled++
        if (profile.education?.length) filled++
        if (profile.skills?.length) filled++
        return total === 0 ? 0 : Math.round((filled / total) * 100)
      })()
    : 0

  async function handleDuplicate(resumeId: string) {
    try {
      const res = await fetch(`/api/resumes/${resumeId}/duplicate`, {
        method: 'POST',
      })
      if (res.ok) {
        const data = await res.json()
        setResumes((prev) => [data, ...prev])
        toast.success('Resume duplicated')
      } else {
        toast.error('Failed to duplicate resume')
      }
    } catch {
      toast.error('Failed to duplicate resume')
    }
    setOpenMenuId(null)
  }

  async function handleDelete(resumeId: string) {
    try {
      const res = await fetch(`/api/resumes/${resumeId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setResumes((prev) => prev.filter((r) => r.id !== resumeId))
        toast.success('Resume deleted')
      } else {
        toast.error('Failed to delete resume')
      }
    } catch {
      toast.error('Failed to delete resume')
    }
    setOpenMenuId(null)
  }

  const firstName = profile?.firstName || profile?.headline?.split(' ')[0] || 'there'

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Build ATS-optimized resumes tailored to every job.
          </p>
        </div>
        <Link
          href="/resumes/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          <FilePlus className="w-4 h-4" />
          Create tailored resume
        </Link>
      </div>

      {/* Stats grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8"
        >
          <motion.div variants={itemVariants} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Resumes
              </span>
            </div>
            <p className="text-3xl font-bold text-foreground">{totalResumes}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {totalResumes === 0 ? 'No resumes yet' : `${resumesThisMonth} created this month`}
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                This Month
              </span>
            </div>
            <p className="text-3xl font-bold text-foreground">{resumesThisMonth}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Avg Keyword Match
              </span>
            </div>
            <div className="flex items-end gap-3">
              <p className="text-3xl font-bold text-foreground">{avgKeywordAlignment}%</p>
              <TrendingUp className="w-4 h-4 text-success mb-1.5" />
            </div>
            <div className="mt-3">
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <motion.div
                  className={cn(
                    'h-full rounded-full',
                    avgKeywordAlignment >= 80
                      ? 'bg-success'
                      : avgKeywordAlignment >= 50
                      ? 'bg-primary'
                      : 'bg-warning'
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${avgKeywordAlignment}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Profile Completeness
              </span>
            </div>
            <div className="flex items-center gap-4">
              <ProgressRing value={profileCompleteness} size={56} strokeWidth={4} />
              <div>
                <p className="text-3xl font-bold text-foreground">{profileCompleteness}%</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {profileCompleteness < 100 ? 'Complete your profile' : 'Profile complete'}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Recent resumes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Recent resumes</h2>
          {resumes.length > 0 && (
            <Link
              href="/resumes"
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              View all →
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} lines={1} />
            ))}
          </div>
        ) : resumes.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-6 h-6 text-muted-foreground" />}
            title="No resumes yet"
            description="Create your first AI-tailored resume to get started. Just paste a job description and let ResumeForge do the heavy lifting."
            action={{
              label: 'Create your first resume',
              onClick: () => router.push('/resumes/new'),
            }}
            className="rounded-xl border border-border bg-card"
          />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {resumes.map((resume) => (
              <motion.div
                key={resume.id}
                variants={itemVariants}
                className="group relative rounded-xl border border-border bg-card p-5 hover:border-border/80 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-sm font-semibold text-foreground truncate">
                          {resume.name}
                        </h3>
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium capitalize',
                            getStatusColor(resume.status)
                          )}
                        >
                          {resume.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {resume.targetRole && <span>{resume.targetRole}</span>}
                        {resume.targetRole && resume.companyName && (
                          <span> at </span>
                        )}
                        {resume.companyName && <span>{resume.companyName}</span>}
                        {!resume.targetRole && !resume.companyName && (
                          <span>No target role set</span>
                        )}
                        <span className="mx-1.5">·</span>
                        <span>{formatDate(resume.createdAt)}</span>
                      </p>
                      {resume.keywordAlignment != null && (
                        <div className="mt-3 max-w-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-medium text-muted-foreground">
                              Keyword alignment
                            </span>
                            <span className="text-[10px] font-semibold text-foreground">
                              {resume.keywordAlignment}%
                            </span>
                          </div>
                          <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                            <motion.div
                              className={cn(
                                'h-full rounded-full',
                                resume.keywordAlignment >= 80
                                  ? 'bg-success'
                                  : resume.keywordAlignment >= 50
                                  ? 'bg-primary'
                                  : 'bg-warning'
                              )}
                              initial={{ width: 0 }}
                              animate={{ width: `${resume.keywordAlignment}%` }}
                              transition={{ duration: 0.6, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Link
                      href={`/resumes/${resume.id}`}
                      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      aria-label={`Open ${resume.name}`}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenuId(openMenuId === resume.id ? null : resume.id)
                        }
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        aria-label="More actions"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {openMenuId === resume.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.12 }}
                            className="absolute right-0 top-full mt-1 z-20 w-44 rounded-lg border border-border bg-card shadow-xl py-1"
                          >
                            <button
                              type="button"
                              onClick={() => handleDuplicate(resume.id)}
                              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                              Duplicate
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(resume.id)}
                              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </motion.div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
