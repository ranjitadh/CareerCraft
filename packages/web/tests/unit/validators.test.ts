import { describe, it, expect } from 'vitest'
import {
  registerSchema,
  loginSchema,
  userProfileSchema,
  experienceSchema,
  educationSchema,
  skillSchema,
  projectSchema,
  certificationSchema,
  languageSchema,
  resumeCreateSchema,
  jobAnalysisResultSchema,
  resumeContentSchema,
  qualityCheckResultSchema,
} from '@/lib/validators'

describe('registerSchema', () => {
  it('accepts valid registration data', () => {
    const result = registerSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'SecurePass1',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = registerSchema.safeParse({
      name: '',
      email: 'john@example.com',
      password: 'SecurePass1',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('name')
    }
  })

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({
      name: 'John',
      email: 'not-an-email',
      password: 'SecurePass1',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('email')
    }
  })

  it('rejects password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({
      name: 'John',
      email: 'john@example.com',
      password: 'Ab1',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('password')
    }
  })

  it('rejects password without uppercase letter', () => {
    const result = registerSchema.safeParse({
      name: 'John',
      email: 'john@example.com',
      password: 'securepass1',
    })
    expect(result.success).toBe(false)
  })

  it('rejects password without lowercase letter', () => {
    const result = registerSchema.safeParse({
      name: 'John',
      email: 'john@example.com',
      password: 'SECUREPASS1',
    })
    expect(result.success).toBe(false)
  })

  it('rejects password without number', () => {
    const result = registerSchema.safeParse({
      name: 'John',
      email: 'john@example.com',
      password: 'SecurePass',
    })
    expect(result.success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('accepts valid login credentials', () => {
    const result = loginSchema.safeParse({
      email: 'john@example.com',
      password: 'anypassword',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing email', () => {
    const result = loginSchema.safeParse({ password: 'pass' })
    expect(result.success).toBe(false)
  })

  it('rejects missing password', () => {
    const result = loginSchema.safeParse({ email: 'john@example.com' })
    expect(result.success).toBe(false)
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({
      email: 'john@example.com',
      password: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('userProfileSchema', () => {
  it('accepts valid profile with all fields', () => {
    const result = userProfileSchema.safeParse({
      professionalHeadline: 'Senior Software Engineer',
      email: 'john@example.com',
      phone: '+1-555-0100',
      location: 'San Francisco, CA',
      linkedinUrl: 'https://linkedin.com/in/johndoe',
      portfolioUrl: 'https://johndoe.dev',
      githubUrl: 'https://github.com/johndoe',
      professionalSummary: 'Experienced engineer with 10 years.',
    })
    expect(result.success).toBe(true)
  })

  it('accepts empty profile (all fields optional)', () => {
    const result = userProfileSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('rejects invalid linkedin URL', () => {
    const result = userProfileSchema.safeParse({
      linkedinUrl: 'not-a-url',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid github URL', () => {
    const result = userProfileSchema.safeParse({
      githubUrl: 'ftp://invalid',
    })
    expect(result.success).toBe(false)
  })

  it('accepts empty string for optional URLs', () => {
    const result = userProfileSchema.safeParse({
      linkedinUrl: '',
      portfolioUrl: '',
      githubUrl: '',
    })
    expect(result.success).toBe(true)
  })

  it('rejects professionalHeadline exceeding 200 chars', () => {
    const result = userProfileSchema.safeParse({
      professionalHeadline: 'A'.repeat(201),
    })
    expect(result.success).toBe(false)
  })
})

describe('experienceSchema', () => {
  const validExperience = {
    company: 'Acme Corp',
    title: 'Software Engineer',
    location: 'New York, NY',
    startDate: '2020-01-01',
    endDate: '2023-12-31',
    isCurrent: false,
    originalDescription: 'Built amazing things',
    achievements: ['Led a team of 5'],
    sortOrder: 0,
  }

  it('accepts valid experience', () => {
    const result = experienceSchema.safeParse(validExperience)
    expect(result.success).toBe(true)
  })

  it('rejects missing company', () => {
    const result = experienceSchema.safeParse({ ...validExperience, company: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing title', () => {
    const result = experienceSchema.safeParse({ ...validExperience, title: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing originalDescription', () => {
    const result = experienceSchema.safeParse({
      ...validExperience,
      originalDescription: '',
    })
    expect(result.success).toBe(false)
  })

  it('accepts current position with no endDate', () => {
    const result = experienceSchema.safeParse({
      ...validExperience,
      isCurrent: true,
      endDate: null,
    })
    expect(result.success).toBe(true)
  })
})

describe('resumeCreateSchema', () => {
  const validResume = {
    name: 'My Resume',
    companyName: 'TechCorp',
    targetRole: 'Senior Engineer',
    jobDescription: 'We are looking for a senior software engineer with 5+ years of experience in distributed systems.',
    template: 'classic-professional',
  }

  it('accepts valid resume creation data', () => {
    const result = resumeCreateSchema.safeParse(validResume)
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = resumeCreateSchema.safeParse({ ...validResume, name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects job description shorter than 50 characters', () => {
    const result = resumeCreateSchema.safeParse({
      ...validResume,
      jobDescription: 'Short description',
    })
    expect(result.success).toBe(false)
  })

  it('defaults template to classic-professional', () => {
    const { template, ...noTemplate } = validResume
    const result = resumeCreateSchema.safeParse(noTemplate)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.template).toBe('classic-professional')
    }
  })
})

describe('jobAnalysisResultSchema', () => {
  const validAnalysis = {
    targetRole: 'Senior Software Engineer',
    seniority: 'Senior',
    industry: 'Tech',
    requiredSkills: ['TypeScript', 'React'],
    preferredSkills: ['AWS', 'GraphQL'],
    keywords: ['distributed systems', 'microservices'],
    responsibilities: ['Lead team', 'Design architecture'],
    actionVerbs: ['Led', 'Designed', 'Implemented'],
    supportedKeywords: ['TypeScript', 'React'],
    unsupportedKeywords: ['Kubernetes'],
  }

  it('accepts valid job analysis', () => {
    const result = jobAnalysisResultSchema.safeParse(validAnalysis)
    expect(result.success).toBe(true)
  })

  it('accepts analysis without optional fields', () => {
    const result = jobAnalysisResultSchema.safeParse({
      targetRole: 'Engineer',
      requiredSkills: [],
      preferredSkills: [],
      keywords: [],
      responsibilities: [],
      actionVerbs: [],
      supportedKeywords: [],
      unsupportedKeywords: [],
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing requiredSkills', () => {
    const { requiredSkills, ...rest } = validAnalysis
    const result = jobAnalysisResultSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects missing targetRole', () => {
    const { targetRole, ...rest } = validAnalysis
    const result = jobAnalysisResultSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects profileMatchScore > 1', () => {
    const result = jobAnalysisResultSchema.safeParse({
      ...validAnalysis,
      profileMatchScore: 1.5,
    })
    expect(result.success).toBe(false)
  })
})

describe('resumeContentSchema', () => {
  const validContent = {
    personalInfo: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1-555-0100',
      location: 'San Francisco, CA',
      professionalSummary: 'Senior engineer.',
    },
    experience: [
      {
        company: 'Acme',
        title: 'Engineer',
        startDate: '2020-01',
        achievements: ['Built stuff'],
      },
    ],
    education: [
      {
        institution: 'MIT',
        degree: 'BS',
        fieldOfStudy: 'CS',
        startDate: '2016-09',
      },
    ],
    skills: [{ name: 'TypeScript', category: 'Languages' }],
  }

  it('accepts valid resume content', () => {
    const result = resumeContentSchema.safeParse(validContent)
    expect(result.success).toBe(true)
  })

  it('accepts content with optional sections omitted', () => {
    const result = resumeContentSchema.safeParse(validContent)
    expect(result.success).toBe(true)
  })

  it('accepts content with projects, certifications, languages', () => {
    const full = {
      ...validContent,
      projects: [
        {
          name: 'Project X',
          description: 'A cool project',
          technologies: ['React', 'Node'],
          startDate: '2022-01',
        },
      ],
      certifications: [
        {
          name: 'AWS Solutions Architect',
          issuer: 'Amazon',
          issueDate: '2023-06-15',
        },
      ],
      languages: [{ name: 'English', proficiency: 'native' }],
    }
    const result = resumeContentSchema.safeParse(full)
    expect(result.success).toBe(true)
  })

  it('rejects missing personalInfo', () => {
    const { personalInfo, ...rest } = validContent
    const result = resumeContentSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects invalid email in personalInfo', () => {
    const result = resumeContentSchema.safeParse({
      ...validContent,
      personalInfo: { ...validContent.personalInfo, email: 'bad-email' },
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty experience array items missing required fields', () => {
    const result = resumeContentSchema.safeParse({
      ...validContent,
      experience: [{ company: 'Acme' }],
    })
    expect(result.success).toBe(false)
  })
})

describe('qualityCheckResultSchema', () => {
  const validQuality = {
    overallScore: 85,
    keywordAlignment: 90,
    formattingScore: 80,
    contentScore: 88,
    atsCompatibility: 92,
    sections: {
      summary: { score: 85, feedback: ['Good summary'] },
      experience: { score: 90, feedback: ['Strong bullets'] },
      skills: { score: 80, feedback: ['Add more skills'] },
      education: { score: 88, feedback: [] },
    },
    suggestions: [
      { section: 'summary', priority: 'high', message: 'Add metrics' },
      { section: 'skills', priority: 'low', message: 'Consider adding Docker' },
    ],
    missingKeywords: ['Kubernetes'],
    addedKeywords: ['TypeScript'],
  }

  it('accepts valid quality check result', () => {
    const result = qualityCheckResultSchema.safeParse(validQuality)
    expect(result.success).toBe(true)
  })

  it('rejects score > 100', () => {
    const result = qualityCheckResultSchema.safeParse({
      ...validQuality,
      overallScore: 101,
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative score', () => {
    const result = qualityCheckResultSchema.safeParse({
      ...validQuality,
      atsCompatibility: -1,
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid suggestion priority', () => {
    const result = qualityCheckResultSchema.safeParse({
      ...validQuality,
      suggestions: [
        { section: 'summary', priority: 'critical', message: 'Fix this' },
      ],
    })
    expect(result.success).toBe(false)
  })

  it('accepts empty suggestions and keywords arrays', () => {
    const result = qualityCheckResultSchema.safeParse({
      ...validQuality,
      suggestions: [],
      missingKeywords: [],
      addedKeywords: [],
    })
    expect(result.success).toBe(true)
  })
})

describe('skillSchema', () => {
  it('accepts valid skill with level', () => {
    const result = skillSchema.safeParse({
      name: 'TypeScript',
      category: 'Languages',
      level: 'advanced',
    })
    expect(result.success).toBe(true)
  })

  it('accepts skill without level', () => {
    const result = skillSchema.safeParse({
      name: 'React',
      category: 'Frontend',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid level', () => {
    const result = skillSchema.safeParse({
      name: 'React',
      category: 'Frontend',
      level: 'master',
    })
    expect(result.success).toBe(false)
  })
})

describe('educationSchema', () => {
  it('accepts valid education', () => {
    const result = educationSchema.safeParse({
      institution: 'MIT',
      degree: 'BS',
      fieldOfStudy: 'Computer Science',
      startDate: '2016-09-01',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing institution', () => {
    const result = educationSchema.safeParse({
      degree: 'BS',
      fieldOfStudy: 'CS',
      startDate: '2016-09-01',
    })
    expect(result.success).toBe(false)
  })
})

describe('projectSchema', () => {
  it('accepts valid project', () => {
    const result = projectSchema.safeParse({
      name: 'ResumeForge',
      description: 'AI-powered resume builder',
      technologies: ['Next.js', 'TypeScript'],
      startDate: '2024-01-01',
    })
    expect(result.success).toBe(true)
  })

  it('accepts project with valid URL', () => {
    const result = projectSchema.safeParse({
      name: 'Project',
      description: 'Desc',
      url: 'https://example.com',
      technologies: [],
      startDate: '2024-01-01',
    })
    expect(result.success).toBe(true)
  })

  it('accepts project with empty URL', () => {
    const result = projectSchema.safeParse({
      name: 'Project',
      description: 'Desc',
      url: '',
      technologies: [],
      startDate: '2024-01-01',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid URL', () => {
    const result = projectSchema.safeParse({
      name: 'Project',
      description: 'Desc',
      url: 'not-a-url',
      technologies: [],
      startDate: '2024-01-01',
    })
    expect(result.success).toBe(false)
  })
})

describe('certificationSchema', () => {
  it('accepts valid certification', () => {
    const result = certificationSchema.safeParse({
      name: 'AWS Solutions Architect',
      issuer: 'Amazon',
      issueDate: '2023-06-15',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing name', () => {
    const result = certificationSchema.safeParse({
      issuer: 'Amazon',
      issueDate: '2023-06-15',
    })
    expect(result.success).toBe(false)
  })
})

describe('languageSchema', () => {
  it('accepts valid language', () => {
    const result = languageSchema.safeParse({
      name: 'English',
      proficiency: 'native',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid proficiency', () => {
    const result = languageSchema.safeParse({
      name: 'English',
      proficiency: 'fluent',
    })
    expect(result.success).toBe(false)
  })

  it('accepts all valid proficiency levels', () => {
    const levels = ['elementary', 'limited', 'professional', 'full', 'native']
    for (const level of levels) {
      const result = languageSchema.safeParse({
        name: 'English',
        proficiency: level,
      })
      expect(result.success).toBe(true)
    }
  })
})
