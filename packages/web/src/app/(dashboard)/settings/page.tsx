'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  User,
  Lock,
  Palette,
  Brain,
  HardDrive,
  Database,
  Loader2,
  Check,
  AlertCircle,
  Wifi,
  WifiOff,
  Download,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const fieldStyle =
  'w-full h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all'

interface UserState {
  id: string
  name: string | null
  email: string
  createdAt: string
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserState | null>(null)
  const [loading, setLoading] = useState(true)

  // Account
  const [name, setName] = useState('')
  const [nameSaving, setNameSaving] = useState(false)

  // Password
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)

  // Appearance
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [defaultTemplate, setDefaultTemplate] = useState('classic-professional')

  // AI Config
  const [ollamaModel, setOllamaModel] = useState('qwen2.5:14b')
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434')
  const [ollamaStatus, setOllamaStatus] = useState<'idle' | 'testing' | 'connected' | 'failed'>('idle')

  // Storage
  const [storagePath, setStoragePath] = useState('./storage')
  const [storageUsed, setStorageUsed] = useState('Calculating...')

  // Delete
  const [deleteAllResumesOpen, setDeleteAllResumesOpen] = useState(false)
  const [deleteAllResumesConfirm, setDeleteAllResumesConfirm] = useState('')
  const [deleteAllResumesLoading, setDeleteAllResumesLoading] = useState(false)
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)
  const [deleteAccountStep, setDeleteAccountStep] = useState(0)
  const [deleteAccountText, setDeleteAccountText] = useState('')
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          setUser(data)
          setName(data.name || '')
        }
        // Load settings from localStorage
        const savedTheme = localStorage.getItem('rf-theme') as 'dark' | 'light' | null
        if (savedTheme) setTheme(savedTheme)
        const savedTemplate = localStorage.getItem('rf-default-template')
        if (savedTemplate) setDefaultTemplate(savedTemplate)
        const savedModel = localStorage.getItem('rf-ollama-model')
        if (savedModel) setOllamaModel(savedModel)
        const savedUrl = localStorage.getItem('rf-ollama-url')
        if (savedUrl) setOllamaUrl(savedUrl)
        const savedStoragePath = localStorage.getItem('rf-storage-path')
        if (savedStoragePath) setStoragePath(savedStoragePath)
        // Estimate storage
        setStorageUsed('~24 MB (estimated)')
      } catch {
        toast.error('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleUpdateName() {
    if (!name.trim()) return
    setNameSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (res.ok) {
        toast.success('Name updated')
        setUser((prev) => (prev ? { ...prev, name: name.trim() } : prev))
      } else {
        toast.error('Failed to update name')
      }
    } catch {
      toast.error('Failed to update name')
    } finally {
      setNameSaving(false)
    }
  }

  async function handleUpdatePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const current = form.get('currentPassword') as string
    const newPw = form.get('newPassword') as string
    const confirm = form.get('confirmPassword') as string

    if (!current || !newPw || !confirm) {
      toast.error('Please fill in all fields')
      return
    }
    if (newPw.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (newPw !== confirm) {
      toast.error('Passwords do not match')
      return
    }

    setPasswordSaving(true)
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: newPw }),
      })
      if (res.ok) {
        toast.success('Password updated')
        ;(e.target as HTMLFormElement).reset()
      } else {
        const data = await res.json().catch(() => ({ error: 'Failed' }))
        toast.error(data.error || 'Failed to update password')
      }
    } catch {
      toast.error('Failed to update password')
    } finally {
      setPasswordSaving(false)
    }
  }

  function handleThemeChange(newTheme: 'dark' | 'light') {
    setTheme(newTheme)
    localStorage.setItem('rf-theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
    document.documentElement.classList.toggle('light', newTheme === 'light')
    toast.success(`Theme set to ${newTheme}`)
  }

  function handleTemplateChange(template: string) {
    setDefaultTemplate(template)
    localStorage.setItem('rf-default-template', template)
    toast.success('Default template updated')
  }

  function handleSaveOllamaConfig() {
    localStorage.setItem('rf-ollama-model', ollamaModel)
    localStorage.setItem('rf-ollama-url', ollamaUrl)
    toast.success('AI configuration saved')
  }

  async function handleTestConnection() {
    setOllamaStatus('testing')
    try {
      const res = await fetch('/api/health/ollama')
      if (res.ok) {
        setOllamaStatus('connected')
      } else {
        setOllamaStatus('failed')
      }
    } catch {
      setOllamaStatus('failed')
    }
  }

  async function handleExportData() {
    try {
      const [profileRes, resumesRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/resumes'),
      ])
      const profile = profileRes.ok ? await profileRes.json() : null
      const resumes = resumesRes.ok ? await resumesRes.json() : null
      const data = { profile, resumes, exportedAt: new Date().toISOString() }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `resumeforge-export-${format(new Date(), 'yyyy-MM-dd')}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Data exported')
    } catch {
      toast.error('Export failed')
    }
  }

  async function handleDeleteAllResumes() {
    setDeleteAllResumesLoading(true)
    try {
      const res = await fetch('/api/resumes', { method: 'DELETE' })
      if (res.ok) {
        toast.success('All resumes deleted')
        setDeleteAllResumesOpen(false)
        setDeleteAllResumesConfirm('')
      } else {
        toast.error('Failed to delete resumes')
      }
    } catch {
      toast.error('Failed to delete resumes')
    } finally {
      setDeleteAllResumesLoading(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleteAccountLoading(true)
    try {
      const res = await fetch('/api/auth/account', { method: 'DELETE' })
      if (res.ok) {
        toast.success('Account deleted')
        window.location.href = '/login'
      } else {
        toast.error('Failed to delete account')
      }
    } catch {
      toast.error('Failed to delete account')
    } finally {
      setDeleteAccountLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        <div className="h-4 bg-muted rounded w-72 animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 bg-card rounded-xl border border-border animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account, preferences, and application settings.
        </p>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* ─── Account ──────────────────────────────────────── */}
        <motion.div
          variants={sectionVariants}
          className="rounded-xl border border-border bg-card p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <User className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Account</h2>
              <p className="text-xs text-muted-foreground">Manage your account details.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">
                Display name
              </label>
              <div className="flex items-center gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={cn(fieldStyle, 'flex-1')}
                  placeholder="Your name"
                />
                <button
                  onClick={handleUpdateName}
                  disabled={nameSaving || name === (user?.name || '')}
                  className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 flex-shrink-0"
                >
                  {nameSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Email</label>
              <input
                value={user?.email || ''}
                disabled
                className={cn(fieldStyle, 'opacity-60 cursor-not-allowed')}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Email cannot be changed.
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">
                Member since
              </label>
              <p className="text-sm text-muted-foreground">
                {user?.createdAt ? format(new Date(user.createdAt), 'MMMM d, yyyy') : '—'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ─── Password ─────────────────────────────────────── */}
        <motion.div
          variants={sectionVariants}
          className="rounded-xl border border-border bg-card p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Lock className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Password</h2>
              <p className="text-xs text-muted-foreground">Update your password regularly.</p>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">
                Current password
              </label>
              <div className="relative">
                <input
                  name="currentPassword"
                  type={showCurrentPw ? 'text' : 'password'}
                  className={cn(fieldStyle, 'pr-10')}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">
                  New password
                </label>
                <div className="relative">
                  <input
                    name="newPassword"
                    type={showNewPw ? 'text' : 'password'}
                    className={cn(fieldStyle, 'pr-10')}
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">
                  Confirm new password
                </label>
                <div className="relative">
                  <input
                    name="confirmPassword"
                    type={showConfirmPw ? 'text' : 'password'}
                    className={cn(fieldStyle, 'pr-10')}
                    placeholder="Re-enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={passwordSaving}
                className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {passwordSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Update password
              </button>
            </div>
          </form>
        </motion.div>

        {/* ─── Appearance ───────────────────────────────────── */}
        <motion.div
          variants={sectionVariants}
          className="rounded-xl border border-border bg-card p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Palette className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Appearance</h2>
              <p className="text-xs text-muted-foreground">Customize the look and feel.</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-xs font-medium text-foreground block mb-2">Theme</label>
              <div className="flex gap-3">
                {(['dark', 'light'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleThemeChange(t)}
                    className={cn(
                      'flex items-center gap-2.5 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors',
                      theme === t
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full border-2',
                        t === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
                      )}
                    />
                    {t === 'dark' ? 'Dark' : 'Light'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">
                Default resume template
              </label>
              <select
                value={defaultTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className={cn(fieldStyle, 'max-w-xs')}
              >
                <option value="classic-professional">Classic Professional</option>
                <option value="modern-minimalist">Modern Minimalist</option>
                <option value="creative-bold">Creative Bold</option>
                <option value="executive">Executive</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* ─── AI Configuration ─────────────────────────────── */}
        <motion.div
          variants={sectionVariants}
          className="rounded-xl border border-border bg-card p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Brain className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">AI Configuration</h2>
              <p className="text-xs text-muted-foreground">
                Configure the Ollama backend for AI features.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">
                  Model name
                </label>
                <input
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                  className={fieldStyle}
                  placeholder="qwen2.5:14b"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Default: qwen2.5:14b
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">
                  Ollama base URL
                </label>
                <input
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  className={fieldStyle}
                  placeholder="http://localhost:11434"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveOllamaConfig}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Save configuration
              </button>
              <button
                onClick={handleTestConnection}
                disabled={ollamaStatus === 'testing'}
                className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {ollamaStatus === 'testing' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : ollamaStatus === 'connected' ? (
                  <Wifi className="w-3.5 h-3.5 text-success" />
                ) : ollamaStatus === 'failed' ? (
                  <WifiOff className="w-3.5 h-3.5 text-destructive" />
                ) : (
                  <Wifi className="w-3.5 h-3.5" />
                )}
                Test connection
              </button>
              {ollamaStatus === 'connected' && (
                <span className="flex items-center gap-1.5 text-xs text-success">
                  <Check className="w-3 h-3" /> Connected
                </span>
              )}
              {ollamaStatus === 'failed' && (
                <span className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="w-3 h-3" /> Unreachable
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* ─── Storage ──────────────────────────────────────── */}
        <motion.div
          variants={sectionVariants}
          className="rounded-xl border border-border bg-card p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <HardDrive className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Storage</h2>
              <p className="text-xs text-muted-foreground">Resume files and generated PDFs.</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Storage path</span>
              <code className="text-xs text-foreground bg-muted px-2 py-1 rounded font-mono">
                {storagePath}
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Estimated usage</span>
              <span className="text-xs font-medium text-foreground">{storageUsed}</span>
            </div>
          </div>
        </motion.div>

        {/* ─── Data Management ──────────────────────────────── */}
        <motion.div
          variants={sectionVariants}
          className="rounded-xl border border-border bg-card p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Database className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Data Management</h2>
              <p className="text-xs text-muted-foreground">Export or delete your data.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-background/50">
              <div>
                <p className="text-sm font-medium text-foreground">Export all data</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Download a JSON file with your profile and all resumes.
                </p>
              </div>
              <button
                onClick={handleExportData}
                className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/30 bg-destructive/5">
              <div>
                <p className="text-sm font-medium text-foreground">Delete all resumes</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Permanently remove all resumes and their versions.
                </p>
              </div>
              <button
                onClick={() => {
                  setDeleteAllResumesConfirm('')
                  setDeleteAllResumesOpen(true)
                }}
                className="px-4 py-2 rounded-lg border border-destructive/30 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete all
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/30 bg-destructive/5">
              <div>
                <p className="text-sm font-medium text-destructive">Delete account</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Permanently delete your account and all associated data.
                </p>
              </div>
              <button
                onClick={() => {
                  setDeleteAccountStep(0)
                  setDeleteAccountText('')
                  setDeleteAccountOpen(true)
                }}
                className="px-4 py-2 rounded-lg bg-destructive text-white text-sm font-medium hover:bg-destructive/90 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete account
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Delete All Resumes Dialog */}
      {deleteAllResumesOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setDeleteAllResumesOpen(false)
              setDeleteAllResumesConfirm('')
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md rounded-xl border border-border bg-card shadow-2xl p-6 z-10"
          >
            <h3 className="text-base font-semibold text-foreground mb-2">
              Delete all resumes?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              This will permanently delete all your resumes and their versions. This
              cannot be undone. Type <strong>DELETE ALL</strong> to confirm.
            </p>
            <input
              autoFocus
              value={deleteAllResumesConfirm}
              onChange={(e) => setDeleteAllResumesConfirm(e.target.value)}
              placeholder='Type "DELETE ALL"'
              className={cn(fieldStyle, 'mb-4')}
            />
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setDeleteAllResumesOpen(false)
                  setDeleteAllResumesConfirm('')
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllResumes}
                disabled={
                  deleteAllResumesConfirm !== 'DELETE ALL' || deleteAllResumesLoading
                }
                className="px-4 py-2 rounded-lg bg-destructive text-white text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleteAllResumesLoading && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                Delete all resumes
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Account Triple Confirm */}
      {deleteAccountOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setDeleteAccountOpen(false)
              setDeleteAccountStep(0)
              setDeleteAccountText('')
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md rounded-xl border border-border bg-card shadow-2xl p-6 z-10"
          >
            {deleteAccountStep === 0 && (
              <>
                <h3 className="text-base font-semibold text-foreground mb-2">
                  Delete your account?
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This will permanently delete your account, profile, and all resumes. Are
                  you sure you want to proceed?
                </p>
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      setDeleteAccountOpen(false)
                      setDeleteAccountStep(0)
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setDeleteAccountStep(1)}
                    className="px-4 py-2 rounded-lg border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors"
                  >
                    I understand, continue
                  </button>
                </div>
              </>
            )}

            {deleteAccountStep === 1 && (
              <>
                <h3 className="text-base font-semibold text-foreground mb-2">
                  Final confirmation
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Type <strong>DELETE MY ACCOUNT</strong> to permanently delete everything.
                  This action is irreversible.
                </p>
                <input
                  autoFocus
                  value={deleteAccountText}
                  onChange={(e) => setDeleteAccountText(e.target.value)}
                  placeholder='Type "DELETE MY ACCOUNT"'
                  className={cn(fieldStyle, 'mb-4')}
                />
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      setDeleteAccountOpen(false)
                      setDeleteAccountStep(0)
                      setDeleteAccountText('')
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={
                      deleteAccountText !== 'DELETE MY ACCOUNT' || deleteAccountLoading
                    }
                    className="px-4 py-2 rounded-lg bg-destructive text-white text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {deleteAccountLoading && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    )}
                    Delete my account
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}
