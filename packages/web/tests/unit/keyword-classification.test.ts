import { describe, it, expect } from 'vitest'

interface SkillItem {
  id: string
  name: string
  category: string
  level?: string
}

function classifyKeywords(
  jobKeywords: string[],
  profileSkills: SkillItem[]
): { supported: string[]; unsupported: string[] } {
  const skillNamesLower = profileSkills.map((s) => s.name.toLowerCase())

  const supported: string[] = []
  const unsupported: string[] = []

  for (const keyword of jobKeywords) {
    const kwLower = keyword.toLowerCase()
    const matched = skillNamesLower.some(
      (name) => name.includes(kwLower) || kwLower.includes(name)
    )
    if (matched) {
      supported.push(keyword)
    } else {
      unsupported.push(keyword)
    }
  }

  return { supported, unsupported }
}

const profileSkills: SkillItem[] = [
  { id: '1', name: 'TypeScript', category: 'Languages', level: 'advanced' },
  { id: '2', name: 'React', category: 'Frontend', level: 'expert' },
  { id: '3', name: 'Node.js', category: 'Backend', level: 'advanced' },
  { id: '4', name: 'PostgreSQL', category: 'Database', level: 'intermediate' },
  { id: '5', name: 'AWS', category: 'Cloud', level: 'intermediate' },
  { id: '6', name: 'Docker', category: 'DevOps', level: 'beginner' },
]

describe('classifyKeywords', () => {
  it('marks skills present in profile as supported', () => {
    const result = classifyKeywords(['TypeScript', 'React'], profileSkills)
    expect(result.supported).toContain('TypeScript')
    expect(result.supported).toContain('React')
    expect(result.unsupported).toHaveLength(0)
  })

  it('marks skills not in profile as unsupported', () => {
    const result = classifyKeywords(['Kubernetes', 'Terraform'], profileSkills)
    expect(result.unsupported).toContain('Kubernetes')
    expect(result.unsupported).toContain('Terraform')
    expect(result.supported).toHaveLength(0)
  })

  it('handles partial matches correctly', () => {
    const result = classifyKeywords(['typescript', 'node'], profileSkills)
    expect(result.supported).toContain('typescript')
    expect(result.supported).toContain('node')
  })

  it('handles empty keyword list', () => {
    const result = classifyKeywords([], profileSkills)
    expect(result.supported).toHaveLength(0)
    expect(result.unsupported).toHaveLength(0)
  })

  it('handles empty profile skills', () => {
    const result = classifyKeywords(['TypeScript', 'React'], [])
    expect(result.unsupported).toContain('TypeScript')
    expect(result.unsupported).toContain('React')
  })

  it('handles mixed supported and unsupported', () => {
    const result = classifyKeywords(
      ['TypeScript', 'React', 'Kubernetes', 'GraphQL'],
      profileSkills
    )
    expect(result.supported).toContain('TypeScript')
    expect(result.supported).toContain('React')
    expect(result.unsupported).toContain('Kubernetes')
    expect(result.unsupported).toContain('GraphQL')
    expect(result.supported).toHaveLength(2)
    expect(result.unsupported).toHaveLength(2)
  })

  it('handles keyword that is a substring of a skill name', () => {
    const skills: SkillItem[] = [
      { id: '1', name: 'PostgreSQL', category: 'Database' },
    ]
    const result = classifyKeywords(['Postgres'], skills)
    expect(result.supported).toContain('Postgres')
  })

  it('handles keyword that contains a skill name', () => {
    const skills: SkillItem[] = [
      { id: '1', name: 'Node', category: 'Backend' },
    ]
    const result = classifyKeywords(['Node.js'], skills)
    expect(result.supported).toContain('Node.js')
  })

  it('is case-insensitive', () => {
    const result = classifyKeywords(['TYPESCRIPT', 'react'], profileSkills)
    expect(result.supported).toContain('TYPESCRIPT')
    expect(result.supported).toContain('react')
  })
})
