'use client'

import { useState, useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Loader2,
  Check,
  AlertCircle,
  ShieldCheck,
  Award,
  Briefcase,
  GraduationCap,
  Wrench,
  FolderOpen,
  Globe,
  Languages,
} from 'lucide-react'
import {
  useProfile,
  type ProfileData,
  type ExperienceData,
  type EducationData,
  type SkillData,
  type ProjectData,
  type CertificationData,
  type LanguageData,
} from '@/hooks/use-profile'
import { useAutosave } from '@/hooks/useAutosave'
import { ProfileSection } from '@/components/resume/ProfileSection'
import { ExperienceCard } from '@/components/resume/ExperienceCard'
import { EducationCard } from '@/components/resume/EducationCard'
import { SkillTag } from '@/components/resume/SkillTag'
import { ProjectCard } from '@/components/resume/ProjectCard'
import { ConfirmDialog } from '@/components/resume/ConfirmDialog'
import { EmptyState } from '@/components/resume/EmptyState'
import { SkeletonStatCard } from '@/components/resume/SkeletonCard'
import { ProgressBar } from '@/components/resume/ProgressBar'
import {
  experienceSchema,
  educationSchema,
  skillSchema,
  projectSchema,
  certificationSchema,
  languageSchema,
  type ExperienceInput,
  type EducationInput,
  type SkillInput,
  type ProjectInput,
  type CertificationInput,
  type LanguageInput,
} from '@/lib/validators'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

function SaveIndicator({ status }: { status: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-1.5 text-xs"
    >
      {status === 'saving' && (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Saving...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <Check className="w-3 h-3 text-success" />
          <span className="text-success">Saved just now</span>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle className="w-3 h-3 text-destructive" />
          <span className="text-destructive">Save failed</span>
        </>
      )}
    </motion.div>
  )
}

const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
}

const fieldStyle =
  'w-full h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all'
const textareaStyle =
  'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all resize-none'

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, options)
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(body.error || 'Request failed')
  }
  return res.json()
}

export default function ProfilePage() {
  const { profile, isLoading, updateProfile } = useProfile()
  const [summarySaveStatus, setSummarySaveStatus] = useState<string>('idle')
  const [contactSaveStatus, setContactSaveStatus] = useState<string>('idle')
  const [deleteTarget, setDeleteTarget] = useState<{
    type: string
    id: string
    name: string
  } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const [showExperienceForm, setShowExperienceForm] = useState(false)
  const [editingExperience, setEditingExperience] = useState<ExperienceData | null>(null)
  const [showEducationForm, setShowEducationForm] = useState(false)
  const [editingEducation, setEditingEducation] = useState<EducationData | null>(null)
  const [showSkillForm, setShowSkillForm] = useState(false)
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectData | null>(null)
  const [showCertForm, setShowCertForm] = useState(false)
  const [editingCert, setEditingCert] = useState<CertificationData | null>(null)
  const [showLangForm, setShowLangForm] = useState(false)
  const [editingLang, setEditingLang] = useState<LanguageData | null>(null)

  // Summary autosave
  const {
    register: registerSummary,
    watch: watchSummary,
    formState: { isDirty: summaryDirty },
  } = useForm({
    values: {
      professionalSummary: profile?.summary || '',
    },
  })

  const watchSummaryText = watchSummary('professionalSummary')

  const triggerSummarySave = useCallback(async () => {
    setSummarySaveStatus('saving')
    try {
      await updateProfile({ professionalSummary: watchSummaryText || null })
      setSummarySaveStatus('saved')
      setTimeout(() => setSummarySaveStatus('idle'), 3000)
    } catch {
      setSummarySaveStatus('error')
    }
  }, [watchSummaryText, updateProfile])

  const { triggerSave: debouncedSummarySave } = useAutosave(triggerSummarySave, 1500)

  useEffect(() => {
    if (summaryDirty) debouncedSummarySave()
  }, [summaryDirty, watchSummaryText, debouncedSummarySave])

  // Contact info autosave
  const {
    register: registerContact,
    formState: { isDirty: contactDirty },
    watch: watchContact,
  } = useForm({
    values: {
      phone: profile?.phone || '',
      location: profile?.location || '',
      website: profile?.website || '',
      linkedinUrl: profile?.linkedinUrl || '',
      githubUrl: profile?.githubUrl || '',
    },
  })

  const contactValues = watchContact()

  const triggerContactSave = useCallback(async () => {
    setContactSaveStatus('saving')
    try {
      await updateProfile({
        phone: contactValues.phone || undefined,
        location: contactValues.location || undefined,
        linkedinUrl: contactValues.linkedinUrl || undefined,
        portfolioUrl: contactValues.website || undefined,
        githubUrl: contactValues.githubUrl || undefined,
      })
      setContactSaveStatus('saved')
      setTimeout(() => setContactSaveStatus('idle'), 3000)
    } catch {
      setContactSaveStatus('error')
    }
  }, [contactValues, updateProfile])

  const { triggerSave: debouncedContactSave } = useAutosave(triggerContactSave, 1500)

  useEffect(() => {
    if (contactDirty) debouncedContactSave()
  }, [contactDirty, contactValues, debouncedContactSave])

  function refresh() {
    setRefreshKey((k) => k + 1)
    window.location.reload()
  }

  // Profile completeness
  const completeness = profile
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

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await apiFetch(`/api/profile/${deleteTarget.type}/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      toast.success(`${deleteTarget.name} removed`)
      refresh()
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  function openDeleteConfirm(type: string, id: string, name: string) {
    setDeleteTarget({ type, id, name })
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        <div className="h-4 bg-muted rounded w-96 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 bg-card rounded-xl border border-border animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Safety message */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 mb-6"
      >
        <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">Your data stays yours. </span>
          ResumeForge only uses information you provide. It will never invent experience,
          skills, qualifications, or achievements.
        </p>
      </motion.div>

      {/* Title + completeness */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Your Profile
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Keep your profile updated to generate the best resumes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ProgressBar
            value={completeness}
            label="Profile complete"
            size="sm"
            className="w-40"
          />
        </div>
      </div>

      <motion.div
        key={refreshKey}
        variants={{
          visible: { transition: { staggerChildren: 0.08 } },
        }}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* ─── Professional Summary ────────────────────────────────── */}
        <motion.div variants={sectionVariants}>
          <ProfileSection title="Professional Summary" defaultOpen>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  This summary is tailored by AI for each resume you create.
                </span>
                <SaveIndicator status={summarySaveStatus} />
              </div>
              <textarea
                {...registerSummary('professionalSummary')}
                rows={5}
                className={textareaStyle}
                placeholder="Experienced software engineer with 5+ years building scalable web applications..."
              />
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1.5">Phone</label>
                    <input {...registerContact('phone')} className={fieldStyle} placeholder="+1 (555) 000-0000" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1.5">Location</label>
                    <input {...registerContact('location')} className={fieldStyle} placeholder="San Francisco, CA" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1.5">LinkedIn</label>
                    <input {...registerContact('linkedinUrl')} className={fieldStyle} placeholder="https://linkedin.com/in/..." />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1.5">Portfolio</label>
                    <input {...registerContact('website')} className={fieldStyle} placeholder="https://yoursite.com" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1.5">GitHub</label>
                    <input {...registerContact('githubUrl')} className={fieldStyle} placeholder="https://github.com/..." />
                  </div>
                </div>
                <div className="flex justify-end">
                  <SaveIndicator status={contactSaveStatus} />
                </div>
              </div>
            </div>
          </ProfileSection>
        </motion.div>

        {/* ─── Work Experience ─────────────────────────────────────── */}
        <motion.div variants={sectionVariants}>
          <ProfileSection
            title="Work Experience"
            count={profile?.experiences?.length}
            onAdd={() => { setEditingExperience(null); setShowExperienceForm(true) }}
          >
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {showExperienceForm && (
                  <ExperienceForm
                    data={editingExperience}
                    onCancel={() => { setShowExperienceForm(false); setEditingExperience(null) }}
                    onSaved={() => { setShowExperienceForm(false); setEditingExperience(null); refresh() }}
                  />
                )}
              </AnimatePresence>
              <AnimatePresence mode="popLayout">
                {profile?.experiences?.map((exp) => (
                  <ExperienceCard
                    key={exp.id}
                    experience={exp}
                    onEdit={(e) => { setEditingExperience(e); setShowExperienceForm(true) }}
                    onDelete={(id) => openDeleteConfirm('experience', id, exp.title)}
                  />
                ))}
              </AnimatePresence>
              {!showExperienceForm && (!profile?.experiences || profile.experiences.length === 0) && (
                <EmptyState
                  icon={<Briefcase className="w-5 h-5 text-muted-foreground" />}
                  title="No experience added yet"
                  description="Add your work experience to build a comprehensive profile."
                  action={{ label: 'Add experience', onClick: () => setShowExperienceForm(true) }}
                />
              )}
            </div>
          </ProfileSection>
        </motion.div>

        {/* ─── Education ────────────────────────────────────────────── */}
        <motion.div variants={sectionVariants}>
          <ProfileSection
            title="Education"
            count={profile?.education?.length}
            onAdd={() => { setEditingEducation(null); setShowEducationForm(true) }}
          >
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {showEducationForm && (
                  <EducationForm
                    data={editingEducation}
                    onCancel={() => { setShowEducationForm(false); setEditingEducation(null) }}
                    onSaved={() => { setShowEducationForm(false); setEditingEducation(null); refresh() }}
                  />
                )}
              </AnimatePresence>
              <AnimatePresence mode="popLayout">
                {profile?.education?.map((edu) => (
                  <EducationCard
                    key={edu.id}
                    education={edu}
                    onEdit={(e) => { setEditingEducation(e); setShowEducationForm(true) }}
                    onDelete={(id) => openDeleteConfirm('education', id, edu.institution)}
                  />
                ))}
              </AnimatePresence>
              {!showEducationForm && (!profile?.education || profile.education.length === 0) && (
                <EmptyState
                  icon={<GraduationCap className="w-5 h-5 text-muted-foreground" />}
                  title="No education added yet"
                  description="Add your educational background to your profile."
                  action={{ label: 'Add education', onClick: () => setShowEducationForm(true) }}
                />
              )}
            </div>
          </ProfileSection>
        </motion.div>

        {/* ─── Skills ──────────────────────────────────────────────── */}
        <motion.div variants={sectionVariants}>
          <ProfileSection
            title="Skills"
            count={profile?.skills?.length}
            onAdd={() => setShowSkillForm(true)}
          >
            <div className="space-y-4">
              <AnimatePresence>
                {showSkillForm && (
                  <SkillForm
                    onCancel={() => setShowSkillForm(false)}
                    onSaved={() => { setShowSkillForm(false); refresh() }}
                  />
                )}
              </AnimatePresence>
              {profile?.skills && profile.skills.length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(
                    profile.skills.reduce(
                      (acc, skill) => {
                        const cat = skill.category || 'Other'
                        if (!acc[cat]) acc[cat] = []
                        acc[cat].push(skill)
                        return acc
                      },
                      {} as Record<string, SkillData[]>
                    )
                  ).map(([category, skills]) => (
                    <div key={category}>
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        {category}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        <AnimatePresence mode="popLayout">
                          {skills.map((skill) => (
                            <SkillTag
                              key={skill.id}
                              name={skill.name}
                              category={skill.category}
                              level={skill.level}
                              onDelete={() => openDeleteConfirm('skills', skill.id, skill.name)}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                !showSkillForm && (
                  <EmptyState
                    icon={<Wrench className="w-5 h-5 text-muted-foreground" />}
                    title="No skills added yet"
                    description="Add your skills grouped by category for smarter resume matching."
                    action={{ label: 'Add skills', onClick: () => setShowSkillForm(true) }}
                  />
                )
              )}
            </div>
          </ProfileSection>
        </motion.div>

        {/* ─── Projects ────────────────────────────────────────────── */}
        <motion.div variants={sectionVariants}>
          <ProfileSection
            title="Projects"
            count={profile?.projects?.length}
            onAdd={() => { setEditingProject(null); setShowProjectForm(true) }}
          >
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {showProjectForm && (
                  <ProjectForm
                    data={editingProject}
                    onCancel={() => { setShowProjectForm(false); setEditingProject(null) }}
                    onSaved={() => { setShowProjectForm(false); setEditingProject(null); refresh() }}
                  />
                )}
              </AnimatePresence>
              <AnimatePresence mode="popLayout">
                {profile?.projects?.map((proj) => (
                  <ProjectCard
                    key={proj.id}
                    project={proj}
                    onEdit={(p) => { setEditingProject(p); setShowProjectForm(true) }}
                    onDelete={(id) => openDeleteConfirm('projects', id, proj.name)}
                  />
                ))}
              </AnimatePresence>
              {!showProjectForm && (!profile?.projects || profile.projects.length === 0) && (
                <EmptyState
                  icon={<FolderOpen className="w-5 h-5 text-muted-foreground" />}
                  title="No projects added yet"
                  description="Showcase your best projects to stand out from the crowd."
                  action={{ label: 'Add project', onClick: () => setShowProjectForm(true) }}
                />
              )}
            </div>
          </ProfileSection>
        </motion.div>

        {/* ─── Certifications ──────────────────────────────────────── */}
        <motion.div variants={sectionVariants}>
          <ProfileSection
            title="Certifications"
            count={profile?.certifications?.length}
            onAdd={() => { setEditingCert(null); setShowCertForm(true) }}
          >
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {showCertForm && (
                  <CertificationForm
                    data={editingCert}
                    onCancel={() => { setShowCertForm(false); setEditingCert(null) }}
                    onSaved={() => { setShowCertForm(false); setEditingCert(null); refresh() }}
                  />
                )}
              </AnimatePresence>
              <AnimatePresence mode="popLayout">
                {profile?.certifications?.map((cert) => (
                  <motion.div
                    key={cert.id}
                    layout
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group flex items-center justify-between rounded-lg border border-border bg-background/50 p-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                        <Award className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{cert.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {cert.issuer} · {format(new Date(cert.issueDate), 'MMM yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => { setEditingCert(cert); setShowCertForm(true) }}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        aria-label={`Edit ${cert.name}`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeleteConfirm('certifications', cert.id, cert.name)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        aria-label={`Delete ${cert.name}`}
                      >
                        Delete
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {!showCertForm && (!profile?.certifications || profile.certifications.length === 0) && (
                <EmptyState
                  icon={<Award className="w-5 h-5 text-muted-foreground" />}
                  title="No certifications yet"
                  description="Add relevant certifications to strengthen your profile."
                  action={{ label: 'Add certification', onClick: () => setShowCertForm(true) }}
                />
              )}
            </div>
          </ProfileSection>
        </motion.div>

        {/* ─── Languages ───────────────────────────────────────────── */}
        <motion.div variants={sectionVariants}>
          <ProfileSection
            title="Languages"
            count={profile?.languages?.length}
            onAdd={() => { setEditingLang(null); setShowLangForm(true) }}
          >
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {showLangForm && (
                  <LanguageForm
                    data={editingLang}
                    onCancel={() => { setShowLangForm(false); setEditingLang(null) }}
                    onSaved={() => { setShowLangForm(false); setEditingLang(null); refresh() }}
                  />
                )}
              </AnimatePresence>
              <AnimatePresence mode="popLayout">
                {profile?.languages?.map((lang) => (
                  <motion.div
                    key={lang.id}
                    layout
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group flex items-center justify-between rounded-lg border border-border bg-background/50 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                        <Globe className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{lang.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{lang.proficiency}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => { setEditingLang(lang); setShowLangForm(true) }}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        aria-label={`Edit ${lang.name}`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeleteConfirm('languages', lang.id, lang.name)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        aria-label={`Delete ${lang.name}`}
                      >
                        Delete
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {!showLangForm && (!profile?.languages || profile.languages.length === 0) && (
                <EmptyState
                  icon={<Languages className="w-5 h-5 text-muted-foreground" />}
                  title="No languages added yet"
                  description="Add the languages you speak to diversify your profile."
                  action={{ label: 'Add language', onClick: () => setShowLangForm(true) }}
                />
              )}
            </div>
          </ProfileSection>
        </motion.div>
      </motion.div>

      {/* Confirm dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete ${deleteTarget?.type ? deleteTarget.type.charAt(0).toUpperCase() + deleteTarget.type.slice(1).replace(/s$/, '') : 'item'}?`}
        description={`Are you sure you want to remove "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   INLINE FORMS
   ═══════════════════════════════════════════════════════════════════════════════ */

interface FormProps<T> {
  data: T | null
  onCancel: () => void
  onSaved: () => void
}

function ExperienceForm({ data, onCancel, onSaved }: FormProps<ExperienceData>) {
  const [saving, setSaving] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExperienceInput>({
    // @ts-expect-error - zod resolver type compatibility with react-hook-form
    resolver: zodResolver(experienceSchema),
    values: data
      ? {
          company: data.company,
          title: data.title,
          location: data.location || '',
          startDate: new Date(data.startDate),
          endDate: data.endDate ? new Date(data.endDate) : null,
          isCurrent: data.isCurrent,
          originalDescription: data.originalDescription,
          achievements: data.achievements,
          sortOrder: data.sortOrder,
        }
      : undefined,
    defaultValues: {
      company: '',
      title: '',
      location: '',
      startDate: new Date(),
      endDate: null,
      isCurrent: false,
      originalDescription: '',
      achievements: [],
      sortOrder: 0,
    },
  })

  async function onSubmit(values: ExperienceInput) {
    setSaving(true)
    try {
      const payload = {
        ...values,
        startDate: values.startDate instanceof Date ? values.startDate.toISOString() : values.startDate,
        endDate: values.endDate instanceof Date ? values.endDate.toISOString() : values.endDate,
      }
      if (data) {
        await apiFetch(`/api/profile/experience/${data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        await apiFetch('/api/profile/experience', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      toast.success(data ? 'Experience updated' : 'Experience added')
      onSaved()
    } catch {
      toast.error('Failed to save experience')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      onSubmit={handleSubmit(onSubmit as any)}
      className="rounded-lg border border-primary/30 bg-primary/5 p-5 space-y-4"
    >
      <h4 className="text-sm font-semibold text-foreground">
        {data ? 'Edit Experience' : 'Add Experience'}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Job Title *</label>
          <input {...register('title')} className={fieldStyle} placeholder="Software Engineer" />
          {errors.title && <p className="text-destructive text-xs mt-1">{errors.title.message}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Company *</label>
          <input {...register('company')} className={fieldStyle} placeholder="Acme Inc." />
          {errors.company && <p className="text-destructive text-xs mt-1">{errors.company.message}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Location</label>
          <input {...register('location')} className={fieldStyle} placeholder="San Francisco, CA" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Start Date *</label>
            <input type="date" {...register('startDate')} className={fieldStyle} />
            {errors.startDate && <p className="text-destructive text-xs mt-1">{errors.startDate.message}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">End Date</label>
            <input type="date" {...register('endDate')} className={fieldStyle} />
          </div>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-foreground block mb-1">Description *</label>
        <textarea {...register('originalDescription')} rows={3} className={textareaStyle} placeholder="Describe your role and responsibilities..." />
        {errors.originalDescription && <p className="text-destructive text-xs mt-1">{errors.originalDescription.message}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {data ? 'Update' : 'Add'} Experience
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          Cancel
        </button>
      </div>
    </motion.form>
  )
}

function EducationForm({ data, onCancel, onSaved }: FormProps<EducationData>) {
  const [saving, setSaving] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EducationInput>({
    // @ts-expect-error - zod resolver type compatibility with react-hook-form
    resolver: zodResolver(educationSchema),
    values: data
      ? {
          institution: data.institution,
          degree: data.degree,
          fieldOfStudy: data.fieldOfStudy,
          startDate: new Date(data.startDate),
          endDate: data.endDate ? new Date(data.endDate) : null,
          description: data.description || '',
          sortOrder: data.sortOrder,
        }
      : undefined,
    defaultValues: {
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: new Date(),
      endDate: null,
      description: '',
      sortOrder: 0,
    },
  })

  async function onSubmit(values: EducationInput) {
    setSaving(true)
    try {
      const payload = {
        ...values,
        startDate: values.startDate instanceof Date ? values.startDate.toISOString() : values.startDate,
        endDate: values.endDate instanceof Date ? values.endDate.toISOString() : values.endDate,
      }
      if (data) {
        await apiFetch(`/api/profile/education/${data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        await apiFetch('/api/profile/education', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      toast.success(data ? 'Education updated' : 'Education added')
      onSaved()
    } catch {
      toast.error('Failed to save education')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      onSubmit={handleSubmit(onSubmit as any)}
      className="rounded-lg border border-primary/30 bg-primary/5 p-5 space-y-4"
    >
      <h4 className="text-sm font-semibold text-foreground">
        {data ? 'Edit Education' : 'Add Education'}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Institution *</label>
          <input {...register('institution')} className={fieldStyle} placeholder="Stanford University" />
          {errors.institution && <p className="text-destructive text-xs mt-1">{errors.institution.message}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Degree *</label>
          <input {...register('degree')} className={fieldStyle} placeholder="B.S." />
          {errors.degree && <p className="text-destructive text-xs mt-1">{errors.degree.message}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Field of Study *</label>
          <input {...register('fieldOfStudy')} className={fieldStyle} placeholder="Computer Science" />
          {errors.fieldOfStudy && <p className="text-destructive text-xs mt-1">{errors.fieldOfStudy.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Start Date *</label>
            <input type="date" {...register('startDate')} className={fieldStyle} />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">End Date</label>
            <input type="date" {...register('endDate')} className={fieldStyle} />
          </div>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-foreground block mb-1">Description</label>
        <textarea {...register('description')} rows={2} className={textareaStyle} placeholder="GPA, honors, relevant coursework..." />
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {data ? 'Update' : 'Add'} Education
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          Cancel
        </button>
      </div>
    </motion.form>
  )
}

function SkillForm({ onCancel, onSaved }: { onCancel: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SkillInput>({
    // @ts-expect-error - zod resolver type compatibility with react-hook-form
    resolver: zodResolver(skillSchema),
    defaultValues: {
      name: '',
      category: 'frontend',
      level: 'intermediate',
      sortOrder: 0,
    },
  })

  async function onSubmit(values: SkillInput) {
    setSaving(true)
    try {
      await apiFetch('/api/profile/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      toast.success('Skill added')
      reset()
      onSaved()
    } catch {
      toast.error('Failed to save skill')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      onSubmit={handleSubmit(onSubmit as any)}
      className="rounded-lg border border-primary/30 bg-primary/5 p-5 space-y-4"
    >
      <h4 className="text-sm font-semibold text-foreground">Add Skill</h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Skill Name *</label>
          <input {...register('name')} className={fieldStyle} placeholder="React, Python, Figma..." />
          {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Category *</label>
          <select {...register('category')} className={fieldStyle}>
            <option value="frontend">Frontend</option>
            <option value="backend">Backend</option>
            <option value="database">Database</option>
            <option value="devops">DevOps</option>
            <option value="machine learning">Machine Learning</option>
            <option value="design">Design</option>
            <option value="tools">Tools</option>
            <option value="language">Language</option>
          </select>
          {errors.category && <p className="text-destructive text-xs mt-1">{errors.category.message}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Level</label>
          <select {...register('level')} className={fieldStyle}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Add Skill
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          Cancel
        </button>
      </div>
    </motion.form>
  )
}

function ProjectForm({ data, onCancel, onSaved }: FormProps<ProjectData>) {
  const [saving, setSaving] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectInput>({
    // @ts-expect-error - zod resolver type compatibility with react-hook-form
    resolver: zodResolver(projectSchema),
    values: data
      ? {
          name: data.name,
          description: data.description,
          url: data.url || '',
          technologies: data.technologies,
          startDate: new Date(data.startDate),
          endDate: data.endDate ? new Date(data.endDate) : null,
          sortOrder: data.sortOrder,
        }
      : undefined,
    defaultValues: {
      name: '',
      description: '',
      url: '',
      technologies: [],
      startDate: new Date(),
      endDate: null,
      sortOrder: 0,
    },
  })

  async function onSubmit(values: ProjectInput) {
    setSaving(true)
    try {
      const payload = {
        ...values,
        startDate: values.startDate instanceof Date ? values.startDate.toISOString() : values.startDate,
        endDate: values.endDate instanceof Date ? values.endDate.toISOString() : values.endDate,
      }
      if (data) {
        await apiFetch(`/api/profile/projects/${data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        await apiFetch('/api/profile/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      toast.success(data ? 'Project updated' : 'Project added')
      onSaved()
    } catch {
      toast.error('Failed to save project')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      onSubmit={handleSubmit(onSubmit as any)}
      className="rounded-lg border border-primary/30 bg-primary/5 p-5 space-y-4"
    >
      <h4 className="text-sm font-semibold text-foreground">
        {data ? 'Edit Project' : 'Add Project'}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Project Name *</label>
          <input {...register('name')} className={fieldStyle} placeholder="E-commerce Platform" />
          {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-foreground block mb-1">URL</label>
          <input {...register('url')} className={fieldStyle} placeholder="https://github.com/..." />
          {errors.url && <p className="text-destructive text-xs mt-1">{errors.url.message}</p>}
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-foreground block mb-1">Description *</label>
        <textarea {...register('description')} rows={3} className={textareaStyle} placeholder="Built a full-stack e-commerce platform serving 10k+ users..." />
        {errors.description && <p className="text-destructive text-xs mt-1">{errors.description.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Start Date *</label>
          <input type="date" {...register('startDate')} className={fieldStyle} />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground block mb-1">End Date</label>
          <input type="date" {...register('endDate')} className={fieldStyle} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {data ? 'Update' : 'Add'} Project
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          Cancel
        </button>
      </div>
    </motion.form>
  )
}

function CertificationForm({ data, onCancel, onSaved }: FormProps<CertificationData>) {
  const [saving, setSaving] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CertificationInput>({
    resolver: zodResolver(certificationSchema),
    values: data
      ? {
          name: data.name,
          issuer: data.issuer,
          issueDate: new Date(data.issueDate),
          credentialUrl: data.credentialUrl || '',
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        }
      : undefined,
    defaultValues: {
      name: '',
      issuer: '',
      issueDate: new Date(),
      credentialUrl: '',
      expiryDate: null,
    },
  })

  async function onSubmit(values: CertificationInput) {
    setSaving(true)
    try {
      const payload = {
        ...values,
        issueDate: values.issueDate instanceof Date ? values.issueDate.toISOString() : values.issueDate,
        expiryDate: values.expiryDate instanceof Date ? values.expiryDate.toISOString() : values.expiryDate,
      }
      if (data) {
        await apiFetch(`/api/profile/certifications/${data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        await apiFetch('/api/profile/certifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      toast.success(data ? 'Certification updated' : 'Certification added')
      onSaved()
    } catch {
      toast.error('Failed to save certification')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      onSubmit={handleSubmit(onSubmit as any)}
      className="rounded-lg border border-primary/30 bg-primary/5 p-5 space-y-4"
    >
      <h4 className="text-sm font-semibold text-foreground">
        {data ? 'Edit Certification' : 'Add Certification'}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Name *</label>
          <input {...register('name')} className={fieldStyle} placeholder="AWS Solutions Architect" />
          {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Issuer *</label>
          <input {...register('issuer')} className={fieldStyle} placeholder="Amazon Web Services" />
          {errors.issuer && <p className="text-destructive text-xs mt-1">{errors.issuer.message}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Issue Date *</label>
          <input type="date" {...register('issueDate')} className={fieldStyle} />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Credential URL</label>
          <input {...register('credentialUrl')} className={fieldStyle} placeholder="https://..." />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {data ? 'Update' : 'Add'} Certification
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          Cancel
        </button>
      </div>
    </motion.form>
  )
}

function LanguageForm({ data, onCancel, onSaved }: FormProps<LanguageData>) {
  const [saving, setSaving] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LanguageInput>({
    // @ts-expect-error - zod resolver type compatibility with react-hook-form
    resolver: zodResolver(languageSchema),
    values: data
      ? {
          name: data.name,
          proficiency: data.proficiency as LanguageInput['proficiency'],
          sortOrder: data.sortOrder,
        }
      : undefined,
    defaultValues: {
      name: '',
      proficiency: 'professional',
      sortOrder: 0,
    },
  })

  async function onSubmit(values: LanguageInput) {
    setSaving(true)
    try {
      if (data) {
        await apiFetch(`/api/profile/languages/${data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        })
      } else {
        await apiFetch('/api/profile/languages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        })
      }
      toast.success(data ? 'Language updated' : 'Language added')
      onSaved()
    } catch {
      toast.error('Failed to save language')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      onSubmit={handleSubmit(onSubmit as any)}
      className="rounded-lg border border-primary/30 bg-primary/5 p-5 space-y-4"
    >
      <h4 className="text-sm font-semibold text-foreground">
        {data ? 'Edit Language' : 'Add Language'}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Language *</label>
          <input {...register('name')} className={fieldStyle} placeholder="Spanish" />
          {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Proficiency *</label>
          <select {...register('proficiency')} className={fieldStyle}>
            <option value="elementary">Elementary</option>
            <option value="limited">Limited Working</option>
            <option value="professional">Professional</option>
            <option value="full">Full Professional</option>
            <option value="native">Native</option>
          </select>
          {errors.proficiency && <p className="text-destructive text-xs mt-1">{errors.proficiency.message}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {data ? 'Update' : 'Add'} Language
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          Cancel
        </button>
      </div>
    </motion.form>
  )
}
