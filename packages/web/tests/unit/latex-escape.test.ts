import { describe, it, expect } from 'vitest'
import {
  escapeLatex,
  escapeLatexHeading,
  escapeLatexUrl,
  createLatexDivider,
  validateLatexInput,
} from '@/lib/latex/escape'

describe('escapeLatex', () => {
  it('returns empty string for empty input', () => {
    expect(escapeLatex('')).toBe('')
  })

  it('passes plain ASCII text through unchanged', () => {
    expect(escapeLatex('Hello World')).toBe('Hello World')
  })

  it('escapes ampersand', () => {
    expect(escapeLatex('A & B')).toBe('A \\& B')
  })

  it('escapes percent sign', () => {
    expect(escapeLatex('100%')).toBe('100\\%')
  })

  it('escapes dollar sign', () => {
    expect(escapeLatex('$100')).toBe('\\$100')
  })

  it('escapes hash', () => {
    expect(escapeLatex('#1')).toBe('\\#1')
  })

  it('escapes underscore', () => {
    expect(escapeLatex('hello_world')).toBe('hello\\_world')
  })

  it('escapes curly braces', () => {
    expect(escapeLatex('{text}')).toBe('\\{text\\}')
  })

  it('escapes tilde', () => {
    expect(escapeLatex('hello~world')).toBe('hello\\textasciitilde{}world')
  })

  it('escapes caret', () => {
    expect(escapeLatex('x^2')).toBe('x\\textasciicircum{}2')
  })

  it('escapes backslash', () => {
    expect(escapeLatex('path\\to')).toBe('path\\textbackslash{}to')
  })

  it('replaces left curly double quote', () => {
    expect(escapeLatex('\u201chello\u201d')).toBe("``hello''")
  })

  it('replaces right curly single quote', () => {
    expect(escapeLatex("it\u2019s")).toBe("it's")
  })

  it('replaces left curly single quote', () => {
    expect(escapeLatex('\u2018test\u2019')).toBe("`test'")
  })

  it('replaces em-dash with triple hyphen', () => {
    expect(escapeLatex('word\u2014word')).toBe('word---word')
  })

  it('replaces en-dash with double hyphen', () => {
    expect(escapeLatex('1\u201310')).toBe('1--10')
  })

  it('replaces figure dash with double hyphen', () => {
    expect(escapeLatex('1\u20122')).toBe('1--2')
  })

  it('replaces hyphen-like characters', () => {
    expect(escapeLatex('\u2010')).toBe('-')
    expect(escapeLatex('\u2011')).toBe('-')
  })

  it('replaces bullet with textbullet', () => {
    expect(escapeLatex('\u2022 item')).toBe('\\textbullet{} item')
  })

  it('replaces ellipsis with ldots', () => {
    expect(escapeLatex('wait\u2026')).toBe('wait\\ldots{}')
  })

  it('replaces copyright symbol', () => {
    expect(escapeLatex('\u00a9 2024')).toBe('\\textcopyright{} 2024')
  })

  it('replaces trademark symbol', () => {
    expect(escapeLatex('Product\u2122')).toBe('Product\\texttrademark{}')
  })

  it('replaces registered symbol', () => {
    expect(escapeLatex('\u00ae')).toBe('\\textregistered{}')
  })

  it('replaces degree symbol', () => {
    expect(escapeLatex('90\u00b0')).toBe('90\\textdegree{}')
  })

  it('replaces multiplication symbol', () => {
    expect(escapeLatex('2\u00d73')).toBe('2\\texttimes{}3')
  })

  it('replaces non-breaking space with tilde', () => {
    expect(escapeLatex('hello\u00a0world')).toBe('hello~world')
  })

  it('strips zero-width space', () => {
    expect(escapeLatex('hello\u200bworld')).toBe('helloworld')
  })

  it('strips zero-width non-joiner', () => {
    expect(escapeLatex('a\u200cb')).toBe('ab')
  })

  it('strips zero-width joiner', () => {
    expect(escapeLatex('a\u200db')).toBe('ab')
  })

  it('strips BOM', () => {
    expect(escapeLatex('\ufefftext')).toBe('text')
  })

  it('replaces fi ligature', () => {
    expect(escapeLatex('\ufb01le')).toBe('fle')
  })

  it('replaces fl ligature', () => {
    expect(escapeLatex('\ufb02ow')).toBe('flow')
  })

  it('collapses multiple spaces into one', () => {
    expect(escapeLatex('hello   world')).toBe('hello world')
  })

  it('handles mixed special characters and unicode', () => {
    const input = 'Acme & Co.\u2014 "Best\u201d product #1 (100%)'
    const result = escapeLatex(input)
    expect(result).toContain('\\&')
    expect(result).toContain('---')
    expect(result).toContain("''")
    expect(result).toContain('\\#')
    expect(result).toContain('\\%')
  })

  it('neutralizes injection attempts with LaTeX commands', () => {
    const result = escapeLatex('\\input{/etc/passwd}')
    expect(result).toContain('\\textbackslash{}')
    expect(result).not.toMatch(/\\input\{/)
  })

  it('handles multiple occurrences of same character', () => {
    expect(escapeLatex('a & b & c')).toBe('a \\& b \\& c')
  })
})

describe('escapeLatexHeading', () => {
  it('escapes heading text', () => {
    expect(escapeLatexHeading('Section 100%')).toBe('Section 100\\%')
  })

  it('returns empty string for empty input', () => {
    expect(escapeLatexHeading('')).toBe('')
  })
})

describe('escapeLatexUrl', () => {
  it('returns empty string for empty input', () => {
    expect(escapeLatexUrl('')).toBe('')
  })

  it('escapes hash in URL', () => {
    expect(escapeLatexUrl('https://example.com/path#section')).toBe(
      'https://example.com/path\\#section'
    )
  })

  it('escapes percent in URL', () => {
    expect(escapeLatexUrl('https://example.com/path?q=100%25')).toBe(
      'https://example.com/path?q=100\\%25'
    )
  })

  it('does not escape underscores in URL', () => {
    expect(escapeLatexUrl('https://example.com/my_path')).toBe(
      'https://example.com/my_path'
    )
  })

  it('strips zero-width characters from URL', () => {
    expect(escapeLatexUrl('https://exam\u200ble.com')).toBe(
      'https://example.com'
    )
  })

  it('trims whitespace from URL', () => {
    expect(escapeLatexUrl('  https://example.com  ')).toBe(
      'https://example.com'
    )
  })
})

describe('createLatexDivider', () => {
  it('creates divider with default char and width', () => {
    const result = createLatexDivider()
    expect(result).toBe('~'.repeat(40))
  })

  it('creates divider with custom width', () => {
    const result = createLatexDivider('~', 10)
    expect(result).toBe('~'.repeat(10))
  })

  it('escapes special divider characters', () => {
    const result = createLatexDivider('&', 5)
    expect(result).toBe('\\&'.repeat(5))
  })
})

describe('validateLatexInput', () => {
  it('returns true for empty string', () => {
    expect(validateLatexInput('')).toBe(true)
  })

  it('returns true for plain text', () => {
    expect(validateLatexInput('Hello World 123')).toBe(true)
  })

  it('returns true for escaped characters', () => {
    expect(validateLatexInput('100\\% complete')).toBe(true)
  })

  it('rejects \\input{ command', () => {
    expect(validateLatexInput('\\input{/etc/passwd}')).toBe(false)
  })

  it('rejects \\include{ command', () => {
    expect(validateLatexInput('\\include{secrets}')).toBe(false)
  })

  it('rejects \\write{ command', () => {
    expect(validateLatexInput('\\write{evil}')).toBe(false)
  })

  it('rejects \\immediate', () => {
    expect(validateLatexInput('\\immediate\\write18{rm -rf /}')).toBe(false)
  })

  it('rejects \\shell_escape', () => {
    expect(validateLatexInput('\\shell_escape')).toBe(false)
  })

  it('rejects \\catcode', () => {
    expect(validateLatexInput('\\catcode`\\\\=12')).toBe(false)
  })

  it('rejects \\makeatletter', () => {
    expect(validateLatexInput('\\makeatletter')).toBe(false)
  })

  it('rejects \\csname', () => {
    expect(validateLatexInput('\\csname whatever\\endcsname')).toBe(false)
  })

  it('rejects \\expandafter', () => {
    expect(validateLatexInput('\\expandafter\\def')).toBe(false)
  })

  it('rejects \\def\\ pattern', () => {
    expect(validateLatexInput('\\def\\malicious{}')).toBe(false)
  })

  it('rejects nested \\newcommand', () => {
    expect(validateLatexInput('\\newcommand{\\x}{\\input{bad}}')).toBe(false)
  })

  it('rejects \\begin{filecontents}', () => {
    expect(validateLatexInput('\\begin{filecontents*}')).toBe(false)
  })

  it('rejects \\write18', () => {
    expect(validateLatexInput('\\write18{whoami}')).toBe(false)
  })

  it('accepts normal \\section and \\textbf', () => {
    expect(validateLatexInput('\\section{Hello} \\textbf{World}')).toBe(true)
  })
})
