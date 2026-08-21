import { OllamaProvider } from './ollama'
import { MockAIProvider } from './mock'
import type {
  AIProvider,
  ProfileSummary,
  JobAnalysisResult,
  ResumeContent,
  QualityCheckResult,
} from './types'

// Helper function to enforce a maximum execution timeout for AI operations
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(errorMessage))
    }, timeoutMs)

    promise
      .then((res) => {
        clearTimeout(timer)
        resolve(res)
      })
      .catch((err) => {
        clearTimeout(timer)
        reject(err)
      })
  })
}

export class FallbackAIProvider implements AIProvider {
  private primary: OllamaProvider
  private fallback: MockAIProvider
  private timeoutMs: number

  constructor(primary: OllamaProvider, fallback: MockAIProvider, timeoutMs = 8000) {
    this.primary = primary
    this.fallback = fallback
    this.timeoutMs = timeoutMs
  }

  async analyzeJobDescription(
    jobDescription: string,
    profile: ProfileSummary
  ): Promise<JobAnalysisResult> {
    try {
      const isHealthy = await withTimeout(
        this.primary.healthCheck(),
        2000,
        'Ollama healthcheck timeout'
      )
      if (isHealthy) {
        return await withTimeout(
          this.primary.analyzeJobDescription(jobDescription, profile),
          this.timeoutMs,
          'Ollama analyzeJobDescription timeout'
        )
      }
    } catch (e) {
      console.warn('[AIProvider] Primary Ollama error/timeout during analysis, using instant fallback', e)
    }
    return this.fallback.analyzeJobDescription(jobDescription, profile)
  }

  async generateTailoredResume(
    analysis: JobAnalysisResult,
    profile: ProfileSummary
  ): Promise<ResumeContent> {
    try {
      const isHealthy = await withTimeout(
        this.primary.healthCheck(),
        2000,
        'Ollama healthcheck timeout'
      )
      if (isHealthy) {
        return await withTimeout(
          this.primary.generateTailoredResume(analysis, profile),
          this.timeoutMs,
          'Ollama generateTailoredResume timeout'
        )
      }
    } catch (e) {
      console.warn('[AIProvider] Primary Ollama error/timeout during resume generation, using instant fallback', e)
    }
    return this.fallback.generateTailoredResume(analysis, profile)
  }

  async qualityCheck(
    content: ResumeContent,
    analysis: JobAnalysisResult
  ): Promise<QualityCheckResult> {
    try {
      const isHealthy = await withTimeout(
        this.primary.healthCheck(),
        2000,
        'Ollama healthcheck timeout'
      )
      if (isHealthy) {
        return await withTimeout(
          this.primary.qualityCheck(content, analysis),
          this.timeoutMs,
          'Ollama qualityCheck timeout'
        )
      }
    } catch (e) {
      console.warn('[AIProvider] Primary Ollama error/timeout during quality check, using instant fallback', e)
    }
    return this.fallback.qualityCheck(content, analysis)
  }
}

let provider: AIProvider | null = null

export function getAIProvider(): AIProvider {
  if (!provider) {
    const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
    const ollamaModel = process.env.OLLAMA_MODEL || 'qwen2.5:7b'

    const primary = new OllamaProvider(ollamaUrl, ollamaModel)
    const fallback = new MockAIProvider()

    // Enforce 8-second timeout for local Ollama calls before instant mock fallback
    provider = new FallbackAIProvider(primary, fallback, 8000)
  }
  return provider
}

export type {
  AIProvider,
  ProfileSummary,
  JobAnalysisResult,
  ResumeContent,
  QualityCheckResult,
} from './types'

export { OllamaProvider } from './ollama'
export { MockAIProvider } from './mock'
export {
  JOB_ANALYSIS_SYSTEM_PROMPT,
  RESUME_GENERATION_SYSTEM_PROMPT,
  QUALITY_CHECK_SYSTEM_PROMPT,
} from './prompts'
