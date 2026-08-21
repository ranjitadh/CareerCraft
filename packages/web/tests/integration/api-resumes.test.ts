import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/db'

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(() => ({ value: 'mock-token' })),
    set: vi.fn(),
  })),
}))

vi.mock('@/lib/auth', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/auth')>()
  return {
    ...original,
    getCurrentUser: vi.fn().mockResolvedValue({ userId: 'user-1', email: 'test@example.com' }),
    requireAuth: vi.fn().mockResolvedValue({ userId: 'user-1', email: 'test@example.com' }),
    createSession: vi.fn().mockResolvedValue('mock-token'),
    destroySession: vi.fn(),
    getFullUser: vi.fn().mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      profile: {
        professionalHeadline: 'Engineer',
        email: 'test@example.com',
        phone: '',
        location: 'SF',
        professionalSummary: 'Summary',
      },
      experiences: [],
      education: [],
      skills: [],
      projects: [],
      certifications: [],
      languages: [],
    }),
  }
})

vi.mock('@/lib/storage', () => ({
  getStoragePath: vi.fn(() => '/tmp/test-storage'),
  getLatexPath: vi.fn(() => '/tmp/test-storage/resume.tex'),
  getPdfPath: vi.fn(() => '/tmp/test-storage/resume.pdf'),
  getJsonPath: vi.fn(() => '/tmp/test-storage/resume-content.json'),
  fileExists: vi.fn().mockResolvedValue(false),
  deleteFile: vi.fn().mockResolvedValue(undefined),
  deleteStorageDirectory: vi.fn().mockResolvedValue(undefined),
  saveFile: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue(Buffer.from('test')),
  createStorageDirectories: vi.fn().mockResolvedValue('/tmp/test-storage'),
}))

import { NextRequest } from 'next/server'
import {
  GET as resumesGET,
  POST as resumesPOST,
} from '@/app/api/resumes/route'
import {
  GET as resumeGET,
  PUT as resumePUT,
  DELETE as resumeDELETE,
} from '@/app/api/resumes/[id]/route'

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

function makeRequest(body?: unknown, method = 'POST'): NextRequest {
  return new NextRequest('http://localhost/api/resumes', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

describe('POST /api/resumes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a new resume and returns 201', async () => {
    vi.mocked(prisma.resume.create).mockResolvedValue({
      id: 'resume-1',
      userId: 'user-1',
      name: 'Software Engineer Resume',
      companyName: 'TechCorp',
      targetRole: 'Senior Engineer',
      jobDescription: 'We are looking for a senior software engineer with 5+ years experience.',
      template: 'classic-professional',
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)

    const req = makeRequest({
      name: 'Software Engineer Resume',
      companyName: 'TechCorp',
      targetRole: 'Senior Engineer',
      jobDescription: 'We are looking for a senior software engineer with 5+ years experience.',
    })

    const res = await resumesPOST(req)
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.name).toBe('Software Engineer Resume')
    expect(prisma.resume.create).toHaveBeenCalledOnce()
  })

  it('returns 422 for missing job description', async () => {
    const req = makeRequest({
      name: 'My Resume',
      jobDescription: 'short',
    })

    const res = await resumesPOST(req)
    expect(res.status).toBe(422)
  })

  it('returns 422 for empty name', async () => {
    const req = makeRequest({
      name: '',
      jobDescription: 'A sufficiently long job description that meets the minimum length requirement of fifty characters.',
    })

    const res = await resumesPOST(req)
    expect(res.status).toBe(422)
  })
})

describe('GET /api/resumes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns list of user resumes', async () => {
    vi.mocked(prisma.resume.findMany).mockResolvedValue([
      {
        id: 'resume-1',
        userId: 'user-1',
        name: 'Resume 1',
        status: 'draft',
        versions: [],
        jobAnalysis: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as any)

    const res = await resumesGET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toHaveLength(1)
    expect(json[0].name).toBe('Resume 1')
  })

  it('returns empty array when no resumes', async () => {
    vi.mocked(prisma.resume.findMany).mockResolvedValue([])

    const res = await resumesGET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toEqual([])
  })
})

describe('GET /api/resumes/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns resume by id', async () => {
    vi.mocked(prisma.resume.findUnique).mockResolvedValue({
      id: 'resume-1',
      userId: 'user-1',
      name: 'My Resume',
      versions: [],
      jobAnalysis: null,
    } as any)

    const res = await resumeGET(makeRequest({}, 'GET') as any, makeParams('resume-1'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.name).toBe('My Resume')
  })

  it('returns 404 for non-existent resume', async () => {
    vi.mocked(prisma.resume.findUnique).mockResolvedValue(null)

    const res = await resumeGET(makeRequest({}, 'GET') as any, makeParams('nonexistent'))
    expect(res.status).toBe(404)
  })

  it('returns 404 for resume belonging to different user', async () => {
    vi.mocked(prisma.resume.findUnique).mockResolvedValue({
      id: 'resume-1',
      userId: 'other-user',
      name: 'Other Resume',
      versions: [],
      jobAnalysis: null,
    } as any)

    const res = await resumeGET(makeRequest({}, 'GET') as any, makeParams('resume-1'))
    expect(res.status).toBe(404)
  })
})

describe('PUT /api/resumes/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates resume name', async () => {
    vi.mocked(prisma.resume.findUnique).mockResolvedValue({
      id: 'resume-1',
      userId: 'user-1',
    } as any)
    vi.mocked(prisma.resume.update).mockResolvedValue({
      id: 'resume-1',
      userId: 'user-1',
      name: 'Updated Name',
    } as any)

    const req = makeRequest({ name: 'Updated Name' }, 'PUT')
    const res = await resumePUT(req, makeParams('resume-1'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.name).toBe('Updated Name')
  })

  it('returns 404 for non-existent resume', async () => {
    vi.mocked(prisma.resume.findUnique).mockResolvedValue(null)

    const req = makeRequest({ name: 'Updated' }, 'PUT')
    const res = await resumePUT(req, makeParams('nonexistent'))
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/resumes/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes resume and returns 200', async () => {
    vi.mocked(prisma.resume.findUnique).mockResolvedValue({
      id: 'resume-1',
      userId: 'user-1',
    } as any)
    vi.mocked(prisma.resume.delete).mockResolvedValue({} as any)

    const req = new NextRequest('http://localhost/api/resumes/resume-1', { method: 'DELETE' })
    const res = await resumeDELETE(req, makeParams('resume-1'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.message).toBe('Resume deleted')
    expect(prisma.resume.delete).toHaveBeenCalledOnce()
  })

  it('returns 404 for non-existent resume', async () => {
    vi.mocked(prisma.resume.findUnique).mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/resumes/nonexistent', { method: 'DELETE' })
    const res = await resumeDELETE(req, makeParams('nonexistent'))
    expect(res.status).toBe(404)
  })
})
