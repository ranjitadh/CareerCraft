export interface ProfileSummary {
  profile: {
    professionalHeadline: string
    email: string
    phone: string
    location: string
    professionalSummary: string
    linkedinUrl?: string
    portfolioUrl?: string
    githubUrl?: string
  }
  experiences: Array<{
    id: string
    company: string
    title: string
    location: string
    startDate: string
    endDate?: string
    isCurrent: boolean
    originalDescription: string
    achievements: string[]
  }>
  education: Array<{
    id: string
    institution: string
    degree: string
    fieldOfStudy: string
    startDate: string
    endDate?: string
  }>
  skills: Array<{
    id: string
    name: string
    category: string
    level?: string
  }>
  projects: Array<{
    id: string
    name: string
    description: string
    url?: string
    technologies: string[]
  }>
  certifications: Array<{
    id: string
    name: string
    issuer: string
    issueDate: string
  }>
  languages: Array<{
    id: string
    name: string
    proficiency: string
  }>
}

export interface JobAnalysisResult {
  targetRole: string
  seniority: string
  industry: string
  employmentType: string
  requiredSkills: string[]
  preferredSkills: string[]
  keywords: string[]
  responsibilities: string[]
  actionVerbs: string[]
  selectionStrategy: {
    relevantExperienceIds: string[]
    relevantProjectIds: string[]
    relevantSkillIds: string[]
  }
  supportedKeywords: string[]
  unsupportedKeywords: string[]
  profileGaps: string[]
}

export interface ResumeContent {
  professionalSummary: string
  coreSkills: string[]
  experience: Array<{
    experienceId: string
    tailoredBullets: string[]
    usedKeywords: string[]
  }>
  projects: Array<{
    projectId: string
    tailoredBullets: string[]
    usedKeywords: string[]
  }>
  educationIds: string[]
  certificationIds: string[]
  languageIds: string[]
  warnings: string[]
}

export interface QualityCheckResult {
  unsupportedClaims: string[]
  repeatedWording: string[]
  weakBullets: string[]
  potentialKeywordStuffing: string[]
  missingDates: boolean
  missingContactInfo: boolean
  atsFormattingStatus: string
  suggestions: string[]
}

export interface AIProvider {
  analyzeJobDescription(jobDescription: string, profile: ProfileSummary): Promise<JobAnalysisResult>
  generateTailoredResume(analysis: JobAnalysisResult, profile: ProfileSummary): Promise<ResumeContent>
  qualityCheck(content: ResumeContent, analysis: JobAnalysisResult): Promise<QualityCheckResult>
}
