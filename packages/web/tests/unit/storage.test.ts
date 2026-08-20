import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

let tmpDir: string

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'resumeforge-test-'))
})

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true })
})

describe('getStoragePath', () => {
  it('returns a path containing userId and resumeId', async () => {
    const { getStoragePath } = await import('@/lib/storage')
    const result = getStoragePath('user-1', 'resume-1')
    expect(result).toContain('user-1')
    expect(result).toContain('resume-1')
    expect(result).toContain('resumes')
  })

  it('returns an absolute path', async () => {
    const { getStoragePath } = await import('@/lib/storage')
    const result = getStoragePath('user-1', 'resume-1')
    expect(path.isAbsolute(result)).toBe(true)
  })
})

describe('getLatexPath', () => {
  it('returns path ending with resume.tex', async () => {
    const { getLatexPath } = await import('@/lib/storage')
    const result = getLatexPath('user-1', 'resume-1')
    expect(result).toMatch(/resume\.tex$/)
  })
})

describe('getPdfPath', () => {
  it('returns path ending with resume.pdf', async () => {
    const { getPdfPath } = await import('@/lib/storage')
    const result = getPdfPath('user-1', 'resume-1')
    expect(result).toMatch(/resume\.pdf$/)
  })
})

describe('getJsonPath', () => {
  it('returns path ending with resume-content.json', async () => {
    const { getJsonPath } = await import('@/lib/storage')
    const result = getJsonPath('user-1', 'resume-1')
    expect(result).toMatch(/resume-content\.json$/)
  })
})

describe('createStorageDirectories', () => {
  it('creates nested directories', async () => {
    const { createStorageDirectories } = await import('@/lib/storage')
    const dir = await createStorageDirectories('user-1', 'resume-1')
    const stat = await fs.stat(dir)
    expect(stat.isDirectory()).toBe(true)
  })

  it('does not throw if directories already exist', async () => {
    const { createStorageDirectories } = await import('@/lib/storage')
    await createStorageDirectories('user-1', 'resume-1')
    await expect(createStorageDirectories('user-1', 'resume-1')).resolves.not.toThrow()
  })
})

describe('saveFile and readFile', () => {
  it('saves and reads string content', async () => {
    const { saveFile, readFileAsString } = await import('@/lib/storage')
    const filePath = path.join(tmpDir, 'test.txt')
    await saveFile(filePath, 'hello world')
    const content = await readFileAsString(filePath)
    expect(content).toBe('hello world')
  })

  it('saves and reads buffer content', async () => {
    const { saveFile, readFile } = await import('@/lib/storage')
    const filePath = path.join(tmpDir, 'test.bin')
    const buf = Buffer.from([0x00, 0x01, 0x02])
    await saveFile(filePath, buf)
    const result = await readFile(filePath)
    expect(result).toEqual(buf)
  })

  it('creates parent directories automatically', async () => {
    const { saveFile, readFileAsString } = await import('@/lib/storage')
    const filePath = path.join(tmpDir, 'nested', 'deep', 'file.txt')
    await saveFile(filePath, 'nested content')
    const content = await readFileAsString(filePath)
    expect(content).toBe('nested content')
  })
})

describe('fileExists', () => {
  it('returns true for existing file', async () => {
    const { saveFile, fileExists } = await import('@/lib/storage')
    const filePath = path.join(tmpDir, 'exists.txt')
    await saveFile(filePath, 'data')
    expect(await fileExists(filePath)).toBe(true)
  })

  it('returns false for non-existing file', async () => {
    const { fileExists } = await import('@/lib/storage')
    expect(await fileExists(path.join(tmpDir, 'nope.txt'))).toBe(false)
  })

  it('returns true for existing directory', async () => {
    const { createStorageDirectories, fileExists } = await import('@/lib/storage')
    const dir = await createStorageDirectories('u1', 'r1')
    expect(await fileExists(dir)).toBe(true)
  })
})

describe('deleteFile', () => {
  it('removes a file', async () => {
    const { saveFile, deleteFile, fileExists } = await import('@/lib/storage')
    const filePath = path.join(tmpDir, 'delete-me.txt')
    await saveFile(filePath, 'bye')
    expect(await fileExists(filePath)).toBe(true)
    await deleteFile(filePath)
    expect(await fileExists(filePath)).toBe(false)
  })
})

describe('deleteStorageDirectory', () => {
  it('removes the storage directory recursively', async () => {
    const { createStorageDirectories, saveFile, deleteStorageDirectory, fileExists } =
      await import('@/lib/storage')
    const dir = await createStorageDirectories('user-1', 'resume-1')
    await saveFile(path.join(dir, 'resume.tex'), 'content')
    expect(await fileExists(dir)).toBe(true)
    await deleteStorageDirectory('user-1', 'resume-1')
    expect(await fileExists(dir)).toBe(false)
  })
})

describe('listFiles', () => {
  it('lists files in a directory', async () => {
    const { saveFile, listFiles } = await import('@/lib/storage')
    const dir = path.join(tmpDir, 'listdir')
    await fs.mkdir(dir)
    await saveFile(path.join(dir, 'a.txt'), 'a')
    await saveFile(path.join(dir, 'b.txt'), 'b')
    const files = await listFiles(dir)
    expect(files).toContain('a.txt')
    expect(files).toContain('b.txt')
  })

  it('returns empty array for non-existing directory', async () => {
    const { listFiles } = await import('@/lib/storage')
    const files = await listFiles(path.join(tmpDir, 'nonexistent'))
    expect(files).toEqual([])
  })
})
