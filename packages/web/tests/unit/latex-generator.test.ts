import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ResumeContent, ProfileSummary } from '@/lib/ai/types'

vi.mock('@/lib/latex/templates', () => ({
  getTemplate: vi.fn(() => `\\documentclass[11pt]{article}
\\begin{document}
%%NAME%%
%%EMAIL%%
%%PHONE%%
%%LOCATION%%
%%LINKEDIN%%
%%GITHUB%%
%%SUMMARY_SECTION%%
%%SKILLS_SECTION%%
%%EXPERIENCE_SECTION%%
%%PROJECTS_SECTION%%
%%EDUCATION_SECTION%%
%%CERTIFICATIONS_SECTION%%
%%LANGUAGES_SECTION%%
\\end{document}`),
  AVAILABLE_TEMPLATES: ['classic-professional', 'technical'],
}))

import { generateLatex } from '@/lib/latex/generator'

function makeProfile(overrides: Partial<ProfileSummary> = {}): ProfileSummary {
  return {
    profile: {
      professionalHeadline: 'John Doe',
      email: 'john@example.com',
      phone: '+1-555-0100',
      location: 'San Francisco, CA',
      professionalSummary: 'Experienced engineer.',
      linkedinUrl: 'https://linkedin.com/in/johndoe',
      githubUrl: 'https://github.com/johndoe',
      ...overrides?.profile,
    },
    experiences: overrides?.experiences ?? [],
    education: overrides?.education ?? [],
    skills: overrides?.skills ?? [],
    projects: overrides?.projects ?? [],
    certifications: overrides?.certifications ?? [],
    languages: overrides?.languages ?? [],
  }
}

function makeContent(overrides: Partial<ResumeContent> = {}): ResumeContent {
  return {
    professionalSummary: 'Senior engineer with 10 years experience.',
    coreSkills: ['TypeScript', 'React', 'Node.js'],
    experience: [],
    projects: [],
    educationIds: [],
    certificationIds: [],
    languageIds: [],
    warnings: [],
    ...overrides,
  }
}

describe('generateLatex', () => {
  it('generates a complete LaTeX document', () => {
    const latex = generateLatex(makeContent(), makeProfile())
    expect(latex).toContain('\\documentclass')
    expect(latex).toContain('\\begin{document}')
    expect(latex).toContain('\\end{document}')
  })

  it('includes profile name in header', () => {
    const latex = generateLatex(makeContent(), makeProfile())
    expect(latex).toContain('John Doe')
  })

  it('includes email in header', () => {
    const latex = generateLatex(makeContent(), makeProfile())
    expect(latex).toContain('john@example.com')
  })

  it('includes professional summary', () => {
    const latex = generateLatex(makeContent(), makeProfile())
    expect(latex).toContain('Professional Summary')
    expect(latex).toContain('Senior engineer with 10 years experience.')
  })

  it('escapes special characters in user content', () => {
    const profile = makeProfile({
      profile: {
        ...makeProfile().profile,
        professionalHeadline: 'Senior Engineer & Architect',
      },
    })
    const latex = generateLatex(makeContent(), profile)
    expect(latex).toContain('Senior Engineer \\& Architect')
    expect(latex).not.toMatch(/Senior Engineer & Architect/)
  })

  it('omits summary section when empty', () => {
    const content = makeContent({ professionalSummary: '' })
    const latex = generateLatex(content, makeProfile())
    expect(latex).not.toContain('Professional Summary')
  })

  it('includes skills section', () => {
    const latex = generateLatex(makeContent(), makeProfile())
    expect(latex).toContain('Core Skills')
    expect(latex).toContain('TypeScript')
    expect(latex).toContain('React')
  })

  it('omits skills section when empty', () => {
    const content = makeContent({ coreSkills: [] })
    const latex = generateLatex(content, makeProfile())
    expect(latex).not.toContain('Core Skills')
  })

  it('uses technical template for technical skills format', () => {
    const latex = generateLatex(makeContent(), makeProfile(), 'technical')
    expect(latex).toContain('Technical Skills')
    expect(latex).toContain('\\texttt{')
  })

  it('includes experience section with matched experiences', () => {
    const profile = makeProfile({
      experiences: [
        {
          id: 'exp-1',
          company: 'Acme Corp',
          title: 'Senior Engineer',
          location: 'New York, NY',
          startDate: '2020-01-15',
          endDate: '2024-01-15',
          isCurrent: false,
          originalDescription: 'Built things',
          achievements: ['Led team of 5'],
        },
      ],
    })
    const content = makeContent({
      experience: [
        {
          experienceId: 'exp-1',
          tailoredBullets: ['Led a cross-functional team of 5 engineers'],
          usedKeywords: ['leadership'],
        },
      ],
    })
    const latex = generateLatex(content, profile)
    expect(latex).toContain('Professional Experience')
    expect(latex).toContain('Senior Engineer')
    expect(latex).toContain('Acme Corp')
    expect(latex).toContain('Led a cross-functional team')
  })

  it('omits experience section when empty', () => {
    const latex = generateLatex(makeContent(), makeProfile())
    expect(latex).not.toContain('Professional Experience')
  })

  it('includes education section', () => {
    const profile = makeProfile({
      education: [
        {
          id: 'edu-1',
          institution: 'MIT',
          degree: 'BS',
          fieldOfStudy: 'Computer Science',
          startDate: '2012-09-01',
          endDate: '2016-06-01',
        },
      ],
    })
    const content = makeContent({ educationIds: ['edu-1'] })
    const latex = generateLatex(content, profile)
    expect(latex).toContain('Education')
    expect(latex).toContain('MIT')
    expect(latex).toContain('Computer Science')
  })

  it('omits education section when no IDs', () => {
    const latex = generateLatex(makeContent(), makeProfile())
    expect(latex).not.toContain('Education')
  })

  it('includes certifications section', () => {
    const profile = makeProfile({
      certifications: [
        {
          id: 'cert-1',
          name: 'AWS Architect',
          issuer: 'Amazon',
          issueDate: '2023-06-15',
        },
      ],
    })
    const content = makeContent({ certificationIds: ['cert-1'] })
    const latex = generateLatex(content, profile)
    expect(latex).toContain('Certifications')
    expect(latex).toContain('AWS Architect')
  })

  it('includes languages section', () => {
    const profile = makeProfile({
      languages: [
        { id: 'lang-1', name: 'English', proficiency: 'native' },
        { id: 'lang-2', name: 'Spanish', proficiency: 'professional' },
      ],
    })
    const content = makeContent({ languageIds: ['lang-1', 'lang-2'] })
    const latex = generateLatex(content, profile)
    expect(latex).toContain('Languages')
    expect(latex).toContain('English (native)')
    expect(latex).toContain('Spanish (professional)')
  })

  it('includes projects section', () => {
    const profile = makeProfile({
      projects: [
        {
          id: 'proj-1',
          name: 'ResumeForge',
          description: 'AI-powered resume builder',
          url: 'https://resumeforge.ai',
          technologies: ['Next.js', 'TypeScript'],
        },
      ],
    })
    const content = makeContent({
      projects: [
        {
          projectId: 'proj-1',
          tailoredBullets: ['Built AI-powered resume generation system'],
          usedKeywords: ['AI', 'TypeScript'],
        },
      ],
    })
    const latex = generateLatex(content, profile)
    expect(latex).toContain('Projects')
    expect(latex).toContain('ResumeForge')
    expect(latex).toContain('Next.js')
  })

  it('includes LinkedIn URL as href', () => {
    const latex = generateLatex(makeContent(), makeProfile())
    expect(latex).toContain('\\href{https://linkedin.com/in/johndoe}')
  })

  it('includes GitHub URL as href', () => {
    const latex = generateLatex(makeContent(), makeProfile())
    expect(latex).toContain('\\href{https://github.com/johndoe}')
  })

  it('omits LinkedIn when not provided', () => {
    const profile = makeProfile({
      profile: { ...makeProfile().profile, linkedinUrl: undefined },
    })
    const latex = generateLatex(makeContent(), profile)
    expect(latex).not.toContain('linkedin.com')
  })

  it('throws when resumeContent is null', () => {
    expect(() => generateLatex(null as any, makeProfile())).toThrow()
  })

  it('throws when profile is null', () => {
    expect(() => generateLatex(makeContent(), null as any)).toThrow()
  })
})
