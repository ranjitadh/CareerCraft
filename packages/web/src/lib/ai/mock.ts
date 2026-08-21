import type {
  AIProvider,
  ProfileSummary,
  JobAnalysisResult,
  ResumeContent,
  QualityCheckResult,
} from './types'

export class MockAIProvider implements AIProvider {
  async analyzeJobDescription(
    jobDescription: string,
    profile: ProfileSummary
  ): Promise<JobAnalysisResult> {
    const lines = jobDescription
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    const firstLine = lines[0] || 'Software Engineer'
    const targetRole = firstLine.replace(/^(job description|role|title|position):\s*/i, '').slice(0, 50) || 'Software Engineer'

    // Extract potential skills from profile matching job description words
    const profileSkills = profile.skills.map((s) => s.name)
    const jdLower = jobDescription.toLowerCase()

    const supportedKeywords = profileSkills.filter((skill) =>
      jdLower.includes(skill.toLowerCase())
    )
    if (supportedKeywords.length === 0 && profileSkills.length > 0) {
      supportedKeywords.push(...profileSkills.slice(0, 5))
    }

    const commonTech = ['TypeScript', 'React', 'Node.js', 'Python', 'Docker', 'PostgreSQL', 'AWS', 'GraphQL', 'REST API', 'CI/CD']
    const requiredSkills = Array.from(new Set([...supportedKeywords, ...commonTech.filter((t) => jdLower.includes(t.toLowerCase()))])).slice(0, 8)
    const preferredSkills = commonTech.filter((t) => !requiredSkills.includes(t)).slice(0, 4)

    const unsupportedKeywords = requiredSkills.filter(
      (s) => !profileSkills.some((ps) => ps.toLowerCase() === s.toLowerCase())
    )

    const relevantExperienceIds = profile.experiences.map((e) => e.id)
    const relevantProjectIds = profile.projects.map((p) => p.id)
    const relevantSkillIds = profile.skills.map((s) => s.id)

    return {
      targetRole,
      seniority: jdLower.includes('senior') ? 'Senior' : jdLower.includes('lead') ? 'Lead' : 'Mid-Level',
      industry: 'Technology',
      employmentType: 'Full-time',
      requiredSkills: requiredSkills.length > 0 ? requiredSkills : ['JavaScript', 'TypeScript', 'React'],
      preferredSkills: preferredSkills.length > 0 ? preferredSkills : ['Docker', 'AWS'],
      keywords: Array.from(new Set([...requiredSkills, ...supportedKeywords])),
      responsibilities: [
        'Architect, develop, and maintain high-performance web applications and backend microservices.',
        'Collaborate with cross-functional product and engineering teams to ship customer-facing features.',
        'Optimize code quality, test coverage, and deployment pipelines for reliable releases.',
      ],
      actionVerbs: ['Architected', 'Developed', 'Engineered', 'Optimized', 'Spearheaded', 'Implemented'],
      selectionStrategy: {
        relevantExperienceIds,
        relevantProjectIds,
        relevantSkillIds,
      },
      supportedKeywords,
      unsupportedKeywords,
      profileGaps: unsupportedKeywords.map((kw) => `Missing verified experience in ${kw}`),
    }
  }

  async generateTailoredResume(
    analysis: JobAnalysisResult,
    profile: ProfileSummary
  ): Promise<ResumeContent> {
    const coreSkills = profile.skills.map((s) => s.name).slice(0, 12)

    const experience = profile.experiences.map((exp) => {
      const origBullets = exp.originalDescription
        ? exp.originalDescription.split('\n').filter((l) => l.trim().length > 5)
        : []

      const tailoredBullets = origBullets.length > 0
        ? origBullets.map((b) => b.replace(/^[-•*]\s*/, ''))
        : exp.achievements && exp.achievements.length > 0
        ? exp.achievements
        : [
            `Spearheaded core initiatives at ${exp.company} as ${exp.title}, delivering high-impact feature sets.`,
            `Engineered scalable systems using ${coreSkills.slice(0, 3).join(', ')} to enhance overall reliability.`,
            `Collaborated with cross-functional stakeholders to streamline release cycles and developer productivity.`,
          ]

      return {
        experienceId: exp.id,
        tailoredBullets,
        usedKeywords: analysis.supportedKeywords.slice(0, 4),
      }
    })

    const projects = profile.projects.map((proj) => ({
      projectId: proj.id,
      tailoredBullets: [
        proj.description || `Built ${proj.name} utilizing ${proj.technologies.join(', ')}.`,
      ],
      usedKeywords: proj.technologies,
    }))

    const summary = profile.profile.professionalSummary ||
      `Results-driven ${analysis.targetRole} with proven expertise in ${coreSkills.slice(0, 4).join(', ')}. Experienced in building scalable systems and delivering high-impact solutions.`

    return {
      professionalSummary: summary,
      coreSkills,
      experience,
      projects,
      educationIds: profile.education.map((e) => e.id),
      certificationIds: profile.certifications.map((c) => c.id),
      languageIds: profile.languages.map((l) => l.id),
      warnings: [],
    }
  }

  async qualityCheck(
    content: ResumeContent,
    analysis: JobAnalysisResult
  ): Promise<QualityCheckResult> {
    return {
      unsupportedClaims: [],
      repeatedWording: [],
      weakBullets: [],
      potentialKeywordStuffing: [],
      missingDates: false,
      missingContactInfo: false,
      atsFormattingStatus: 'Pass (Optimal ATS Compatibility)',
      suggestions: [
        'Ensure key achievements quantify business impact (e.g. percentages or metrics).',
        'Keep professional summary concise and focused on target role keywords.',
      ],
    }
  }
}
