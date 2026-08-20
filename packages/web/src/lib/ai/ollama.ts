import { z } from 'zod'
import {
  JOB_ANALYSIS_SYSTEM_PROMPT,
  RESUME_GENERATION_SYSTEM_PROMPT,
  QUALITY_CHECK_SYSTEM_PROMPT,
} from './prompts'
import type { AIProvider, ProfileSummary, JobAnalysisResult, ResumeContent, QualityCheckResult } from './types'

const JobAnalysisSchema = z.object({
  targetRole: z.string(),
  seniority: z.string(),
  industry: z.string(),
  employmentType: z.string(),
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  keywords: z.array(z.string()),
  responsibilities: z.array(z.string()),
  actionVerbs: z.array(z.string()),
  selectionStrategy: z.object({
    relevantExperienceIds: z.array(z.string()),
    relevantProjectIds: z.array(z.string()),
    relevantSkillIds: z.array(z.string()),
  }),
  supportedKeywords: z.array(z.string()),
  unsupportedKeywords: z.array(z.string()),
  profileGaps: z.array(z.string()),
})

const ResumeContentSchema = z.object({
  professionalSummary: z.string(),
  coreSkills: z.array(z.string()),
  experience: z.array(
    z.object({
      experienceId: z.string(),
      tailoredBullets: z.array(z.string()),
      usedKeywords: z.array(z.string()),
    })
  ),
  projects: z.array(
    z.object({
      projectId: z.string(),
      tailoredBullets: z.array(z.string()),
      usedKeywords: z.array(z.string()),
    })
  ),
  educationIds: z.array(z.string()),
  certificationIds: z.array(z.string()),
  languageIds: z.array(z.string()),
  warnings: z.array(z.string()),
})

const QualityCheckSchema = z.object({
  unsupportedClaims: z.array(z.string()),
  repeatedWording: z.array(z.string()),
  weakBullets: z.array(z.string()),
  potentialKeywordStuffing: z.array(z.string()),
  missingDates: z.boolean(),
  missingContactInfo: z.boolean(),
  atsFormattingStatus: z.string(),
  suggestions: z.array(z.string()),
})

interface OllamaGenerateResponse {
  response: string
  done: boolean
  error?: string
}

interface OllamaModel {
  name: string
}

interface OllamaTagsResponse {
  models: OllamaModel[]
}

function extractJsonFromResponse(text: string): unknown {
  let cleaned = text.trim()

  // Strip markdown code fences if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7)
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3)
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3)
  }
  cleaned = cleaned.trim()

  return JSON.parse(cleaned)
}

export class OllamaProvider implements AIProvider {
  private baseUrl: string
  private model: string
  private timeout: number

  constructor(baseUrl: string, model: string, timeout = 120_000) {
    this.baseUrl = baseUrl.replace(/\/+$/, '')
    this.model = model
    this.timeout = timeout
  }

  async analyzeJobDescription(
    jobDescription: string,
    profile: ProfileSummary
  ): Promise<JobAnalysisResult> {
    const userMessage = this.buildJobAnalysisPrompt(jobDescription, profile)
    const raw = await this.generate(JOB_ANALYSIS_SYSTEM_PROMPT, userMessage)
    return this.parseWithRetry(raw, JobAnalysisSchema, 'analyzeJobDescription')
  }

  async generateTailoredResume(
    analysis: JobAnalysisResult,
    profile: ProfileSummary
  ): Promise<ResumeContent> {
    const userMessage = this.buildResumeGenerationPrompt(analysis, profile)
    const raw = await this.generate(RESUME_GENERATION_SYSTEM_PROMPT, userMessage)
    return this.parseWithRetry(raw, ResumeContentSchema, 'generateTailoredResume')
  }

  async qualityCheck(
    content: ResumeContent,
    analysis: JobAnalysisResult
  ): Promise<QualityCheckResult> {
    const userMessage = this.buildQualityCheckPrompt(content, analysis)
    const raw = await this.generate(QUALITY_CHECK_SYSTEM_PROMPT, userMessage)
    return this.parseWithRetry(raw, QualityCheckSchema, 'qualityCheck')
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(10_000),
      })
      return res.ok
    } catch {
      return false
    }
  }

  async modelCheck(): Promise<{ available: boolean; models: string[] }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(10_000),
      })
      if (!res.ok) {
        return { available: false, models: [] }
      }
      const data: OllamaTagsResponse = await res.json()
      const models = data.models.map((m) => m.name)
      const available = models.some(
        (name) => name === this.model || name.startsWith(this.model + ':')
      )
      return { available, models }
    } catch {
      return { available: false, models: [] }
    }
  }

  private async generate(systemPrompt: string, userMessage: string): Promise<string> {
    const payload = {
      model: this.model,
      system: systemPrompt,
      prompt: userMessage,
      format: 'json',
      stream: false,
    }

    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(this.timeout),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(
        `Ollama API error (${res.status}): ${body || res.statusText}`
      )
    }

    const data: OllamaGenerateResponse = await res.json()

    if (data.error) {
      throw new Error(`Ollama generation error: ${data.error}`)
    }

    if (!data.response) {
      throw new Error('Ollama returned an empty response')
    }

    return data.response
  }

  private async parseWithRetry<T>(
    raw: string,
    schema: z.ZodSchema<T>,
    stage: string
  ): Promise<T> {
    let lastError: unknown

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const json = extractJsonFromResponse(raw)
        const result = schema.safeParse(json)
        if (result.success) {
          return result.data
        }
        const issues = result.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ')
        lastError = new Error(`Schema validation failed for ${stage}: ${issues}`)

        if (attempt === 0) {
          raw = await this.regenerateWithInstruction(raw, lastError as Error)
        }
      } catch (err) {
        lastError = err
        if (attempt === 0) {
          raw = await this.regenerateWithInstruction(
            raw,
            err instanceof Error ? err : new Error(String(err))
          )
        }
      }
    }

    throw new Error(
      `Failed to parse ${stage} response after retries: ${lastError instanceof Error ? lastError.message : String(lastError)}`
    )
  }

  private async regenerateWithInstruction(
    _previousResponse: string,
    error: Error
  ): Promise<string> {
    const repairPrompt = [
      'Your previous response was invalid.',
      `Error: ${error.message}`,
      'You MUST return ONLY a valid JSON object matching the exact schema requested.',
      'No markdown fences, no explanations, no additional text — only raw JSON.',
      'Fix the issues above and try again.',
    ].join('\n')

    return this.generate('', repairPrompt)
  }

  private buildJobAnalysisPrompt(jobDescription: string, profile: ProfileSummary): string {
    return [
      '=== JOB DESCRIPTION ===',
      jobDescription,
      '',
      '=== CANDIDATE PROFILE ===',
      JSON.stringify(profile, null, 2),
      '',
      'Analyze the job description against the candidate profile. Return the structured JSON analysis.',
    ].join('\n')
  }

  private buildResumeGenerationPrompt(
    analysis: JobAnalysisResult,
    profile: ProfileSummary
  ): string {
    return [
      '=== JOB ANALYSIS ===',
      JSON.stringify(analysis, null, 2),
      '',
      '=== CANDIDATE PROFILE ===',
      JSON.stringify(profile, null, 2),
      '',
      'Generate tailored resume content based on this job analysis and the candidate profile.',
      'Use the selectionStrategy from the job analysis to determine which experiences, projects, and skills to include.',
    ].join('\n')
  }

  private buildQualityCheckPrompt(
    content: ResumeContent,
    analysis: JobAnalysisResult
  ): string {
    return [
      '=== GENERATED RESUME CONTENT ===',
      JSON.stringify(content, null, 2),
      '',
      '=== JOB ANALYSIS ===',
      JSON.stringify(analysis, null, 2),
      '',
      'Review the generated resume content for truthfulness, quality, and ATS compatibility.',
    ].join('\n')
  }
}
