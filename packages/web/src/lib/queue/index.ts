import { Queue } from 'bullmq'

const connection = { host: 'redis', port: 6379 }

export const latexQueue = new Queue('latex-compilation', { connection })
export const aiQueue = new Queue('ai-processing', { connection })

// Job types
export interface LatexCompileJob {
  resumeId: string
  versionId: string
  userId: string
  latexSource: string
  template: string
}

export interface AIProcessJob {
  resumeId: string
  userId: string
  stage: 'analyze' | 'generate' | 'quality-check'
}

// Helper to add jobs
export async function queueLatexCompile(job: LatexCompileJob) {
  return latexQueue.add('compile', job, {
    attempts: 2,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
  })
}

export async function queueAIProcess(job: AIProcessJob) {
  return aiQueue.add(job.stage, job, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 10000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
  })
}
