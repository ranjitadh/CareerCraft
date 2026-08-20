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
        professionalHeadline: 'Software Engineer',
        email: 'test@example.com',
        phone: '+1-555-0100',
        location: 'SF, CA',
        linkedinUrl: 'https://linkedin.com/in/test',
        portfolioUrl: null,
        githubUrl: null,
        professionalSummary: 'Experienced.',
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

import { GET as profileGET, PUT as profilePUT } from '@/app/api/profile/route'
import {
  GET as expGET,
  POST as expPOST,
} from '@/app/api/profile/experience/route'
import {
  PUT as expIdPUT,
  DELETE as expIdDELETE,
} from '@/app/api/profile/experience/[id]/route'

function makeRequest(body: unknown, method = 'PUT'): Request {
  return new Request('http://localhost/api/profile', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe('GET /api/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns full profile data', async () => {
    const res = await profileGET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.name).toBe('Test User')
    expect(json.profile).toBeDefined()
    expect(json.profile.professionalHeadline).toBe('Software Engineer')
  })
})

describe('PUT /api/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates profile successfully', async () => {
    vi.mocked(prisma.userProfile.upsert).mockResolvedValue({
      id: 'profile-1',
      userId: 'user-1',
      professionalHeadline: 'Senior Engineer',
      email: 'test@example.com',
      phone: '+1-555-0200',
      location: 'New York, NY',
      linkedinUrl: null,
      portfolioUrl: null,
      githubUrl: null,
      professionalSummary: 'Updated summary.',
    } as any)

    const req = makeRequest({
      professionalHeadline: 'Senior Engineer',
      phone: '+1-555-0200',
      location: 'New York, NY',
      professionalSummary: 'Updated summary.',
    })

    const res = await profilePUT(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.professionalHeadline).toBe('Senior Engineer')
    expect(prisma.userProfile.upsert).toHaveBeenCalledOnce()
  })

  it('returns 422 for invalid data', async () => {
    const req = makeRequest({
      linkedinUrl: 'not-a-url',
    })

    const res = await profilePUT(req)
    expect(res.status).toBe(422)
  })
})

describe('GET /api/profile/experience', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns list of experiences', async () => {
    vi.mocked(prisma.experience.findMany).mockResolvedValue([
      {
        id: 'exp-1',
        userId: 'user-1',
        company: 'Acme',
        title: 'Engineer',
        location: 'SF',
        startDate: new Date('2020-01-01'),
        endDate: null,
        isCurrent: true,
        originalDescription: 'Built things',
        achievements: [],
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as any)

    const res = await expGET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toHaveLength(1)
    expect(json[0].company).toBe('Acme')
  })
})

describe('POST /api/profile/experience', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a new experience', async () => {
    vi.mocked(prisma.experience.create).mockResolvedValue({
      id: 'exp-new',
      userId: 'user-1',
      company: 'NewCo',
      title: 'Senior Engineer',
      location: 'NYC',
      startDate: new Date('2021-06-01'),
      endDate: null,
      isCurrent: true,
      originalDescription: 'Led projects',
      achievements: ['Led 10 engineers'],
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)

    const req = makeRequest({
      company: 'NewCo',
      title: 'Senior Engineer',
      location: 'NYC',
      startDate: '2021-06-01',
      isCurrent: true,
      originalDescription: 'Led projects',
      achievements: ['Led 10 engineers'],
    })

    const res = await expPOST(req)
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.company).toBe('NewCo')
    expect(prisma.experience.create).toHaveBeenCalledOnce()
  })

  it('returns 422 for missing required fields', async () => {
    const req = makeRequest({
      company: '',
      title: '',
    })

    const res = await expPOST(req)
    expect(res.status).toBe(422)
  })
})

describe('PUT /api/profile/experience/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates an existing experience', async () => {
    vi.mocked(prisma.experience.findUnique).mockResolvedValue({
      id: 'exp-1',
      userId: 'user-1',
      company: 'OldCo',
    } as any)
    vi.mocked(prisma.experience.update).mockResolvedValue({
      id: 'exp-1',
      userId: 'user-1',
      company: 'UpdatedCo',
      title: 'Lead Engineer',
      location: 'SF',
      startDate: new Date('2020-01-01'),
      endDate: null,
      isCurrent: false,
      originalDescription: 'Updated',
      achievements: [],
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)

    const req = makeRequest({
      company: 'UpdatedCo',
      title: 'Lead Engineer',
      startDate: '2020-01-01',
      isCurrent: false,
      originalDescription: 'Updated description',
    })

    const res = await expIdPUT(req, makeParams('exp-1'))
    expect(res.status).toBe(200)
  })

  it('returns 404 for non-existent experience', async () => {
    vi.mocked(prisma.experience.findUnique).mockResolvedValue(null)

    const req = makeRequest({
      company: 'Updated',
      title: 'Updated',
      startDate: '2020-01-01',
      originalDescription: 'Updated',
    })

    const res = await expIdPUT(req, makeParams('nonexistent'))
    expect(res.status).toBe(404)
  })

  it('returns 404 when experience belongs to different user', async () => {
    vi.mocked(prisma.experience.findUnique).mockResolvedValue({
      id: 'exp-1',
      userId: 'other-user',
    } as any)

    const req = makeRequest({
      company: 'Updated',
      title: 'Updated',
      startDate: '2020-01-01',
      originalDescription: 'Updated',
    })

    const res = await expIdPUT(req, makeParams('exp-1'))
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/profile/experience/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes an experience', async () => {
    vi.mocked(prisma.experience.findUnique).mockResolvedValue({
      id: 'exp-1',
      userId: 'user-1',
    } as any)
    vi.mocked(prisma.experience.delete).mockResolvedValue({} as any)

    const req = new Request('http://localhost/api/profile/experience/exp-1', {
      method: 'DELETE',
    })

    const res = await expIdDELETE(req, makeParams('exp-1'))
    expect(res.status).toBe(200)
    expect(prisma.experience.delete).toHaveBeenCalledOnce()
  })

  it('returns 404 for non-existent experience', async () => {
    vi.mocked(prisma.experience.findUnique).mockResolvedValue(null)

    const req = new Request('http://localhost/api/profile/experience/nonexistent', {
      method: 'DELETE',
    })

    const res = await expIdDELETE(req, makeParams('nonexistent'))
    expect(res.status).toBe(404)
  })
})
