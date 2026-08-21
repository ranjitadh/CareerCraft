import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/db'

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
  })),
}))

import { NextRequest } from 'next/server'
import { POST as registerPOST } from '@/app/api/auth/register/route'
import { POST as loginPOST } from '@/app/api/auth/login/route'
import { POST as logoutPOST } from '@/app/api/auth/logout/route'
import { GET as meGET } from '@/app/api/auth/me/route'

function makeRequest(body: unknown, method = 'POST'): NextRequest {
  return new NextRequest('http://localhost/api/auth/register', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeGetRequest(): NextRequest {
  return new NextRequest('http://localhost/api/auth/me', { method: 'GET' })
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a new user and returns 201', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      passwordHash: 'hashed',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)

    const req = makeRequest({
      name: 'Test User',
      email: 'test@example.com',
      password: 'SecurePass1',
    })

    const res = await registerPOST(req)
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.name).toBe('Test User')
    expect(json.email).toBe('test@example.com')
    expect(prisma.user.create).toHaveBeenCalledOnce()
  })

  it('returns 409 for duplicate email', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'existing',
      email: 'test@example.com',
    } as any)

    const req = makeRequest({
      name: 'Test User',
      email: 'test@example.com',
      password: 'SecurePass1',
    })

    const res = await registerPOST(req)
    expect(res.status).toBe(409)
  })

  it('returns 422 for invalid data', async () => {
    const req = makeRequest({
      name: '',
      email: 'not-email',
      password: 'weak',
    })

    const res = await registerPOST(req)
    expect(res.status).toBe(422)
  })
})

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns user data for valid credentials', async () => {
    const { hashPassword } = await import('@/lib/auth')
    const hash = await hashPassword('TestPass1')

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      passwordHash: hash,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)

    const req = makeRequest({
      email: 'test@example.com',
      password: 'TestPass1',
    })

    const res = await loginPOST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.id).toBe('user-1')
    expect(json.email).toBe('test@example.com')
  })

  it('returns 401 for non-existent user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const req = makeRequest({
      email: 'nobody@example.com',
      password: 'TestPass1',
    })

    const res = await loginPOST(req)
    expect(res.status).toBe(401)
  })

  it('returns 401 for wrong password', async () => {
    const { hashPassword } = await import('@/lib/auth')
    const hash = await hashPassword('CorrectPass1')

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      passwordHash: hash,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)

    const req = makeRequest({
      email: 'test@example.com',
      password: 'WrongPass1',
    })

    const res = await loginPOST(req)
    expect(res.status).toBe(401)
  })

  it('returns 422 for invalid email format', async () => {
    const req = makeRequest({
      email: 'not-an-email',
      password: 'TestPass1',
    })

    const res = await loginPOST(req)
    expect(res.status).toBe(422)
  })
})

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 200 on logout', async () => {
    const res = await logoutPOST()
    expect(res.status).toBe(200)
  })
})

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const res = await meGET()
    expect(res.status).toBe(401)
  })
})
