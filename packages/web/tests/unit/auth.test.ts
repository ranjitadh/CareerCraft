import { describe, it, expect, vi, beforeEach } from 'vitest'
import { hashPassword, verifyPassword } from '@/lib/auth'

describe('hashPassword', () => {
  it('returns a string hash', async () => {
    const hash = await hashPassword('TestPassword1')
    expect(typeof hash).toBe('string')
    expect(hash.length).toBeGreaterThan(0)
  })

  it('hash starts with bcrypt prefix', async () => {
    const hash = await hashPassword('TestPassword1')
    expect(hash).toMatch(/^\$2[aby]?\$/)
  })

  it('produces different hashes for the same password (salt)', async () => {
    const hash1 = await hashPassword('TestPassword1')
    const hash2 = await hashPassword('TestPassword1')
    expect(hash1).not.toBe(hash2)
  })
})

describe('verifyPassword', () => {
  it('returns true for correct password', async () => {
    const password = 'MySecurePass1'
    const hash = await hashPassword(password)
    const result = await verifyPassword(password, hash)
    expect(result).toBe(true)
  })

  it('returns false for wrong password', async () => {
    const hash = await hashPassword('CorrectPassword1')
    const result = await verifyPassword('WrongPassword1', hash)
    expect(result).toBe(false)
  })

  it('returns false for empty password against a hash', async () => {
    const hash = await hashPassword('Something1')
    const result = await verifyPassword('', hash)
    expect(result).toBe(false)
  })

  it('handles special characters in password', async () => {
    const password = 'P@$$w0rd!#&*'
    const hash = await hashPassword(password)
    const result = await verifyPassword(password, hash)
    expect(result).toBe(true)
  })
})
