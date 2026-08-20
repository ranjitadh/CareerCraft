'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface ProfileData {
  id: string
  firstName: string | null
  lastName: string | null
  headline: string | null
  summary: string | null
  phone: string | null
  location: string | null
  email: string | null
  website: string | null
  linkedinUrl: string | null
  portfolioUrl: string | null
  githubUrl: string | null
  experiences: ExperienceData[]
  education: EducationData[]
  skills: SkillData[]
  projects: ProjectData[]
  certifications: CertificationData[]
  languages: LanguageData[]
}

export interface ExperienceData {
  id: string
  company: string
  title: string
  location: string | null
  startDate: string
  endDate: string | null
  isCurrent: boolean
  originalDescription: string
  achievements: string[]
  sortOrder: number
}

export interface EducationData {
  id: string
  institution: string
  degree: string
  fieldOfStudy: string
  startDate: string
  endDate: string | null
  description: string | null
  sortOrder: number
}

export interface SkillData {
  id: string
  name: string
  category: string
  level: string | null
  sortOrder: number
}

export interface ProjectData {
  id: string
  name: string
  description: string
  url: string | null
  technologies: string[]
  startDate: string
  endDate: string | null
  sortOrder: number
}

export interface CertificationData {
  id: string
  name: string
  issuer: string
  issueDate: string
  credentialUrl: string | null
  expiryDate: string | null
}

export interface LanguageData {
  id: string
  name: string
  proficiency: string
  sortOrder: number
}

interface RawProfileResponse {
  id: string
  name: string | null
  email: string
  profile: {
    professionalHeadline: string | null
    email: string | null
    phone: string | null
    location: string | null
    linkedinUrl: string | null
    portfolioUrl: string | null
    githubUrl: string | null
    professionalSummary: string | null
  } | null
  experiences: ExperienceData[]
  education: EducationData[]
  skills: SkillData[]
  projects: ProjectData[]
  certifications: CertificationData[]
  languages: LanguageData[]
}

function mapResponse(raw: RawProfileResponse): ProfileData {
  const nameParts = (raw.name || '').split(' ')
  return {
    id: raw.id,
    firstName: nameParts[0] || null,
    lastName: nameParts.length > 1 ? nameParts.slice(1).join(' ') : null,
    headline: raw.profile?.professionalHeadline || null,
    summary: raw.profile?.professionalSummary || null,
    phone: raw.profile?.phone || null,
    location: raw.profile?.location || null,
    email: raw.profile?.email || raw.email,
    website: raw.profile?.portfolioUrl || null,
    linkedinUrl: raw.profile?.linkedinUrl || null,
    portfolioUrl: raw.profile?.portfolioUrl || null,
    githubUrl: raw.profile?.githubUrl || null,
    experiences: raw.experiences || [],
    education: raw.education || [],
    skills: raw.skills || [],
    projects: raw.projects || [],
    certifications: raw.certifications || [],
    languages: raw.languages || [],
  }
}

async function fetchProfile(): Promise<ProfileData> {
  const res = await fetch('/api/profile')
  if (!res.ok) throw new Error('Failed to fetch profile')
  const raw: RawProfileResponse = await res.json()
  return mapResponse(raw)
}

async function updateProfileInfo(data: {
  professionalSummary?: string | null
  phone?: string
  location?: string
  linkedinUrl?: string
  portfolioUrl?: string
  githubUrl?: string
  professionalHeadline?: string
}): Promise<void> {
  const res = await fetch('/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update profile')
}

export function useProfile() {
  const queryClient = useQueryClient()

  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    staleTime: 30_000,
  })

  const mutation = useMutation({
    mutationFn: updateProfileInfo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })

  return {
    profile,
    isLoading,
    error,
    updateProfile: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  }
}
