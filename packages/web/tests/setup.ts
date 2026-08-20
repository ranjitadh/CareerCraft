import { vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    userProfile: { findUnique: vi.fn(), upsert: vi.fn() },
    experience: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), findUnique: vi.fn() },
    education: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), findUnique: vi.fn() },
    skill: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), findUnique: vi.fn() },
    project: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), findUnique: vi.fn() },
    certification: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    language: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    resume: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    resumeVersion: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), findFirst: vi.fn() },
    jobAnalysis: { findFirst: vi.fn(), upsert: vi.fn() },
    auditLog: { create: vi.fn() },
    $disconnect: vi.fn(),
  },
}))
