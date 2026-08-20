import { OllamaProvider } from './ollama'
import type { AIProvider } from './types'

let provider: AIProvider | null = null

export function getAIProvider(): AIProvider {
  if (!provider) {
    provider = new OllamaProvider(
      process.env.OLLAMA_BASE_URL || 'http://host.docker.internal:11434',
      process.env.OLLAMA_MODEL || 'qwen2.5:14b'
    )
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
export {
  JOB_ANALYSIS_SYSTEM_PROMPT,
  RESUME_GENERATION_SYSTEM_PROMPT,
  QUALITY_CHECK_SYSTEM_PROMPT,
} from './prompts'
