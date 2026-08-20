import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OllamaProvider } from '@/lib/ai/ollama'
import type { ProfileSummary } from '@/lib/ai/types'

const mockProfile: ProfileSummary = {
  profile: {
    professionalHeadline: 'Software Engineer',
    email: 'test@example.com',
    phone: '+1-555-0100',
    location: 'SF, CA',
    professionalSummary: 'Experienced engineer.',
  },
  experiences: [
    {
      id: 'exp-1',
      company: 'Acme',
      title: 'Engineer',
      location: 'SF',
      startDate: '2020-01-01',
      isCurrent: true,
      originalDescription: 'Built things',
      achievements: ['Led team'],
    },
  ],
  education: [],
  skills: [
    { id: 'sk-1', name: 'TypeScript', category: 'Languages', level: 'advanced' },
  ],
  projects: [],
  certifications: [],
  languages: [],
}

function createProviderWithMockResponse(responseBody: string) {
  const provider = new OllamaProvider('http://localhost:11434', 'test-model')

  const fetchSpy = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ response: responseBody, done: true }),
  })
  vi.stubGlobal('fetch', fetchSpy)

  return { provider, fetchSpy }
}

describe('OllamaProvider', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('analyzeJobDescription', () => {
    it('parses valid job analysis JSON', async () => {
      const analysisResponse = JSON.stringify({
        targetRole: 'Senior Software Engineer',
        seniority: 'Senior',
        industry: 'Tech',
        employmentType: 'full-time',
        requiredSkills: ['TypeScript', 'React'],
        preferredSkills: ['AWS'],
        keywords: ['microservices', 'distributed systems'],
        responsibilities: ['Lead team'],
        actionVerbs: ['Led', 'Designed'],
        selectionStrategy: {
          relevantExperienceIds: ['exp-1'],
          relevantProjectIds: [],
          relevantSkillIds: ['sk-1'],
        },
        supportedKeywords: ['TypeScript'],
        unsupportedKeywords: ['Kubernetes'],
        profileGaps: [],
      })

      const { provider } = createProviderWithMockResponse(analysisResponse)
      const result = await provider.analyzeJobDescription('Job description here...', mockProfile)

      expect(result.targetRole).toBe('Senior Software Engineer')
      expect(result.requiredSkills).toContain('TypeScript')
      expect(result.supportedKeywords).toContain('TypeScript')
      expect(result.unsupportedKeywords).toContain('Kubernetes')
    })

    it('strips markdown code fences from response', async () => {
      const analysisResponse = '```json\n' + JSON.stringify({
        targetRole: 'Engineer',
        seniority: 'Mid',
        industry: 'Tech',
        employmentType: 'full-time',
        requiredSkills: [],
        preferredSkills: [],
        keywords: [],
        responsibilities: [],
        actionVerbs: [],
        selectionStrategy: { relevantExperienceIds: [], relevantProjectIds: [], relevantSkillIds: [] },
        supportedKeywords: [],
        unsupportedKeywords: [],
        profileGaps: [],
      }) + '\n```'

      const { provider } = createProviderWithMockResponse(analysisResponse)
      const result = await provider.analyzeJobDescription('Job desc', mockProfile)
      expect(result.targetRole).toBe('Engineer')
    })

    it('rejects response missing required fields', async () => {
      const invalidResponse = JSON.stringify({
        targetRole: 'Engineer',
      })

      const { provider, fetchSpy } = createProviderWithMockResponse(invalidResponse)

      await expect(
        provider.analyzeJobDescription('Job desc', mockProfile)
      ).rejects.toThrow('Failed to parse')
    })

    it('retries on first failure and succeeds', async () => {
      const validResponse = JSON.stringify({
        targetRole: 'Engineer',
        seniority: 'Senior',
        industry: 'Tech',
        employmentType: 'full-time',
        requiredSkills: ['JS'],
        preferredSkills: [],
        keywords: [],
        responsibilities: [],
        actionVerbs: [],
        selectionStrategy: { relevantExperienceIds: [], relevantProjectIds: [], relevantSkillIds: [] },
        supportedKeywords: [],
        unsupportedKeywords: [],
        profileGaps: [],
      })

      const invalidFirst = JSON.stringify({ broken: true })
      let callCount = 0

      const provider = new OllamaProvider('http://localhost:11434', 'test-model')
      const fetchSpy = vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ response: invalidFirst, done: true }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ response: validResponse, done: true }),
        })
      })
      vi.stubGlobal('fetch', fetchSpy)

      const result = await provider.analyzeJobDescription('Job desc', mockProfile)
      expect(result.targetRole).toBe('Engineer')
      expect(fetchSpy).toHaveBeenCalledTimes(2)
    })
  })

  describe('generateTailoredResume', () => {
    it('parses valid resume content JSON', async () => {
      const resumeResponse = JSON.stringify({
        professionalSummary: 'Experienced engineer with 10 years.',
        coreSkills: ['TypeScript', 'React'],
        experience: [
          {
            experienceId: 'exp-1',
            tailoredBullets: ['Led team of 5 engineers'],
            usedKeywords: ['leadership'],
          },
        ],
        projects: [],
        educationIds: [],
        certificationIds: [],
        languageIds: [],
        warnings: [],
      })

      const { provider } = createProviderWithMockResponse(resumeResponse)
      const mockAnalysis = {
        targetRole: 'Senior Engineer',
        seniority: 'Senior',
        industry: 'Tech',
        employmentType: 'full-time',
        requiredSkills: ['TypeScript'],
        preferredSkills: [],
        keywords: [],
        responsibilities: [],
        actionVerbs: [],
        selectionStrategy: { relevantExperienceIds: [], relevantProjectIds: [], relevantSkillIds: [] },
        supportedKeywords: [],
        unsupportedKeywords: [],
        profileGaps: [],
      }

      const result = await provider.generateTailoredResume(mockAnalysis, mockProfile)
      expect(result.professionalSummary).toBe('Experienced engineer with 10 years.')
      expect(result.coreSkills).toContain('TypeScript')
      expect(result.experience).toHaveLength(1)
      expect(result.experience[0].tailoredBullets).toContain('Led team of 5 engineers')
    })
  })

  describe('qualityCheck', () => {
    it('parses valid quality check JSON', async () => {
      const qualityResponse = JSON.stringify({
        unsupportedClaims: [],
        repeatedWording: ['led the team'],
        weakBullets: [],
        potentialKeywordStuffing: [],
        missingDates: false,
        missingContactInfo: false,
        atsFormattingStatus: 'good',
        suggestions: ['Add more metrics'],
      })

      const { provider } = createProviderWithMockResponse(qualityResponse)
      const mockContent = {
        professionalSummary: 'Test',
        coreSkills: ['TS'],
        experience: [],
        projects: [],
        educationIds: [],
        certificationIds: [],
        languageIds: [],
        warnings: [],
      }
      const mockAnalysis = {
        targetRole: 'Engineer',
        requiredSkills: [],
        preferredSkills: [],
        keywords: [],
        responsibilities: [],
        actionVerbs: [],
        selectionStrategy: { relevantExperienceIds: [], relevantProjectIds: [], relevantSkillIds: [] },
        supportedKeywords: [],
        unsupportedKeywords: [],
        profileGaps: [],
      }

      const result = await provider.qualityCheck(mockContent, mockAnalysis as any)
      expect(result.repeatedWording).toContain('led the team')
      expect(result.suggestions).toContain('Add more metrics')
      expect(result.missingDates).toBe(false)
    })
  })

  describe('healthCheck', () => {
    it('returns true when API is reachable', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
      const provider = new OllamaProvider('http://localhost:11434', 'model')
      expect(await provider.healthCheck()).toBe(true)
    })

    it('returns false when API is unreachable', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')))
      const provider = new OllamaProvider('http://localhost:11434', 'model')
      expect(await provider.healthCheck()).toBe(false)
    })
  })

  describe('modelCheck', () => {
    it('returns available=true when model is present', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ models: [{ name: 'qwen2.5:14b' }, { name: 'llama3:8b' }] }),
      }))
      const provider = new OllamaProvider('http://localhost:11434', 'qwen2.5:14b')
      const result = await provider.modelCheck()
      expect(result.available).toBe(true)
      expect(result.models).toContain('qwen2.5:14b')
    })

    it('returns available=false when model is not present', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ models: [{ name: 'llama3:8b' }] }),
      }))
      const provider = new OllamaProvider('http://localhost:11434', 'qwen2.5:14b')
      const result = await provider.modelCheck()
      expect(result.available).toBe(false)
    })

    it('returns available=false when API is unreachable', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')))
      const provider = new OllamaProvider('http://localhost:11434', 'model')
      const result = await provider.modelCheck()
      expect(result.available).toBe(false)
      expect(result.models).toEqual([])
    })
  })

  describe('error handling', () => {
    it('throws on non-OK API response', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Ollama crashed'),
      }))
      const provider = new OllamaProvider('http://localhost:11434', 'model')
      await expect(
        provider.analyzeJobDescription('Job', mockProfile)
      ).rejects.toThrow('Ollama API error (500)')
    })

    it('throws on Ollama error in response body', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ response: '', done: true, error: 'model not found' }),
      }))
      const provider = new OllamaProvider('http://localhost:11434', 'model')
      await expect(
        provider.analyzeJobDescription('Job', mockProfile)
      ).rejects.toThrow('Ollama generation error: model not found')
    })

    it('throws on empty response', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ response: '', done: true }),
      }))
      const provider = new OllamaProvider('http://localhost:11434', 'model')
      await expect(
        provider.analyzeJobDescription('Job', mockProfile)
      ).rejects.toThrow('Ollama returned an empty response')
    })
  })

  describe('constructor', () => {
    it('strips trailing slashes from base URL', () => {
      const provider = new OllamaProvider('http://localhost:11434///', 'model')
      expect((provider as any).baseUrl).toBe('http://localhost:11434')
    })
  })
})
