import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM yyyy')
}

export function calculateProfileCompleteness(profile: {
  firstName?: string | null
  lastName?: string | null
  headline?: string | null
  summary?: string | null
  phone?: string | null
  location?: string | null
  website?: string | null
  experiences?: unknown[]
  education?: unknown[]
  skills?: unknown[]
}): number {
  let filled = 0
  let total = 0

  const fields = [
    profile.firstName,
    profile.lastName,
    profile.headline,
    profile.summary,
    profile.phone,
    profile.location,
    profile.website,
  ]

  total += fields.length
  filled += fields.filter((f) => f && f.length > 0).length

  total += 3
  if (profile.experiences && profile.experiences.length > 0) filled++
  if (profile.education && profile.education.length > 0) filled++
  if (profile.skills && profile.skills.length > 0) filled++

  return total === 0 ? 0 : Math.round((filled / total) * 100)
}
