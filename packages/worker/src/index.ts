import { Worker, Job } from 'bullmq'
import { PrismaClient } from '@prisma/client'
import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

// ─── Config ──────────────────────────────────────────────────────────────────

const REDIS_HOST = process.env.REDIS_HOST ?? 'redis'
const REDIS_PORT = parseInt(process.env.REDIS_PORT ?? '6379', 10)
const STORAGE_PATH = process.env.STORAGE_PATH ?? '/storage'
const COMPILE_TIMEOUT_MS =
  parseInt(process.env.LATEX_COMPILE_TIMEOUT ?? '30', 10) * 1000
const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY ?? '2', 10)

const connection = { host: REDIS_HOST, port: REDIS_PORT }

// ─── Prisma ──────────────────────────────────────────────────────────────────

const prisma = new PrismaClient()

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface LatexCompileJobData {
  resumeId: string
  versionId: string
  userId: string
  latexSource: string
  template: string
}

interface AIProcessJobData {
  resumeId: string
  userId: string
  stage: 'analyze' | 'generate' | 'quality-check'
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function createTempDir(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'latex-compile-'))
  return dir
}

async function cleanupDir(dirPath: string): Promise<void> {
  try {
    await fs.rm(dirPath, { recursive: true, force: true })
  } catch (err) {
    console.error(`[cleanup] failed to remove ${dirPath}:`, err)
  }
}

function getStorageDir(userId: string, resumeId: string): string {
  return path.resolve(STORAGE_PATH, 'resumes', userId, resumeId)
}

// ─── LaTeX Compilation Worker ────────────────────────────────────────────────

const latexWorker = new Worker<LatexCompileJobData>(
  'latex-compilation',
  async (job: Job<LatexCompileJobData>) => {
    const { resumeId, versionId, userId, latexSource, template } = job.data
    const tempDir = await createTempDir()

    console.log(
      `[latex] starting compile for resume=${resumeId} version=${versionId} template=${template}`
    )

    try {
      // 1. Write .tex source to temp directory
      const texFilePath = path.join(tempDir, 'resume.tex')
      await fs.writeFile(texFilePath, latexSource, 'utf-8')

      // 2. Update version status to compiling
      await prisma.resumeVersion.update({
        where: { id: versionId },
        data: { compileStatus: 'compiling' },
      })

      // 3. Run pdflatex in isolated temp directory (twice for references)
      for (let pass = 1; pass <= 2; pass++) {
        await execFileAsync(
          'pdflatex',
          [
            '-interaction=nonstopmode',
            '-halt-on-error',
            `-jobname=resume`,
            texFilePath,
          ],
          {
            cwd: tempDir,
            timeout: COMPILE_TIMEOUT_MS,
            maxBuffer: 10 * 1024 * 1024,
            env: {
              PATH: process.env.PATH,
              HOME: tempDir,
              TMPDIR: tempDir,
              LANG: 'en_US.UTF-8',
            },
          }
        )
      }

      // 4. Verify PDF was produced
      const pdfName = 'resume.pdf'
      const compiledPdf = path.join(tempDir, pdfName)

      try {
        await fs.access(compiledPdf)
      } catch {
        throw new Error('LaTeX compilation did not produce a PDF output')
      }

      // 5. Copy PDF to persistent storage
      const storageDir = getStorageDir(userId, resumeId)
      await fs.mkdir(storageDir, { recursive: true })
      const pdfDest = path.join(storageDir, `version-${versionId}.pdf`)
      await fs.copyFile(compiledPdf, pdfDest)

      // 6. Update database with success
      await prisma.resumeVersion.update({
        where: { id: versionId },
        data: {
          compileStatus: 'compiled',
          pdfPath: pdfDest,
          compileError: null,
        },
      })

      console.log(
        `[latex] compile succeeded for resume=${resumeId} version=${versionId} -> ${pdfDest}`
      )

      return { pdfPath: pdfDest, success: true }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown compilation error'

      console.error(
        `[latex] compile failed for resume=${resumeId} version=${versionId}:`,
        errorMessage
      )

      // 7. Update database with failure
      await prisma.resumeVersion.update({
        where: { id: versionId },
        data: {
          compileStatus: 'error',
          compileError: errorMessage,
        },
      })

      throw err
    } finally {
      await cleanupDir(tempDir)
    }
  },
  {
    connection,
    concurrency: CONCURRENCY,
    limiter: {
      max: 10,
      duration: 60_000,
    },
  }
)

// ─── AI Processing Worker ────────────────────────────────────────────────────

const aiWorker = new Worker<AIProcessJobData>(
  'ai-processing',
  async (job: Job<AIProcessJobData>) => {
    const { resumeId, userId, stage } = job.data

    console.log(
      `[ai] processing stage=${stage} for resume=${resumeId}`
    )

    const resume = await prisma.resume.findUniqueOrThrow({
      where: { id: resumeId },
      include: {
        versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
        jobAnalysis: true,
      },
    })

    switch (stage) {
      case 'analyze': {
        if (!resume.jobDescription) {
          throw new Error('Job description is required for analysis')
        }

        // Update resume status
        await prisma.resume.update({
          where: { id: resumeId },
          data: { status: 'analyzing' },
        })

        // Placeholder: AI analysis via Ollama would go here
        // The web app's AI module handles the actual inference
        console.log(`[ai] analysis queued for resume=${resumeId}`)

        await job.updateProgress({ stage: 'analyze', done: true })
        return { stage: 'analyze', success: true }
      }

      case 'generate': {
        if (resume.versions.length === 0) {
          throw new Error('No resume version found to generate from')
        }

        await prisma.resume.update({
          where: { id: resumeId },
          data: { status: 'generating' },
        })

        console.log(`[ai] generation queued for resume=${resumeId}`)

        await job.updateProgress({ stage: 'generate', done: true })
        return { stage: 'generate', success: true }
      }

      case 'quality-check': {
        const latestVersion = resume.versions[0]
        if (!latestVersion) {
          throw new Error('No resume version found for quality check')
        }

        // Placeholder: quality scoring via AI would go here
        console.log(`[ai] quality check queued for resume=${resumeId}`)

        await job.updateProgress({ stage: 'quality-check', done: true })
        return { stage: 'quality-check', success: true }
      }

      default:
        throw new Error(`Unknown AI processing stage: ${stage}`)
    }
  },
  {
    connection,
    concurrency: 1,
    limiter: {
      max: 5,
      duration: 60_000,
    },
  }
)

// ─── Event Handlers ──────────────────────────────────────────────────────────

function setupWorkerEvents(
  worker: Worker,
  name: string
) {
  worker.on('completed', (job) => {
    console.log(`[${name}] job ${job.id} completed (type=${job.name})`)
  })

  worker.on('failed', (job, err) => {
    console.error(
      `[${name}] job ${job?.id} failed after ${job?.attemptsMade} attempt(s):`,
      err.message
    )
  })

  worker.on('error', (err) => {
    console.error(`[${name}] worker error:`, err)
  })

  worker.on('ready', () => {
    console.log(`[${name}] worker ready and listening`)
  })
}

setupWorkerEvents(latexWorker, 'latex')
setupWorkerEvents(aiWorker, 'ai')

// ─── Graceful Shutdown ───────────────────────────────────────────────────────

async function shutdown() {
  console.log('[worker] shutting down gracefully...')

  await latexWorker.close()
  await aiWorker.close()
  await prisma.$disconnect()

  console.log('[worker] shutdown complete')
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

// ─── Startup ─────────────────────────────────────────────────────────────────

console.log('[worker] starting ResumeForge workers...')
console.log(
  `[worker] redis=${REDIS_HOST}:${REDIS_PORT} storage=${STORAGE_PATH} concurrency=${CONCURRENCY}`
)
