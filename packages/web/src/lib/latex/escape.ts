/**
 * LaTeX character escaping utilities.
 * This is a security boundary - all user content must pass through
 * escapeLatex() before being inserted into LaTeX source.
 */

// Characters that have special meaning in LaTeX and must be escaped
const SPECIAL_CHARS: Record<string, string> = {
  '&': '\\&',
  '%': '\\%',
  $: '\\$',
  '#': '\\#',
  _: '\\_',
  '{': '\\{',
  '}': '\\}',
  '~': '\\textasciitilde{}',
  '^': '\\textasciicircum{}',
  '\\': '\\textbackslash{}',
};

// Unicode characters → LaTeX replacements
const UNICODE_REPLACEMENTS: Record<string, string> = {
  // Curly quotes
  '\u201c': '``', // left double quotation mark
  '\u201d': "''", // right double quotation mark
  '\u2018': '`', // left single quotation mark
  '\u2019': "'", // right single quotation mark
  // Dashes
  '\u2013': '--', // en-dash
  '\u2014': '---', // em-dash
  '\u2012': '--', // figure dash
  // Hyphen-like
  '\u2010': '-', // hyphen
  '\u2011': '-', // non-breaking hyphen
  // Bullets
  '\u2022': '\\textbullet{}', // bullet
  '\u2023': '\\textbullet{}', // triangular bullet
  '\u25cf': '\\textbullet{}', // black circle
  // Ellipsis
  '\\u2026': '\\ldots{}', // ellipsis
  '\u2026': '\\ldots{}', // horizontal ellipsis
  // Copyright, trademark, registered
  '\u00a9': '\\textcopyright{}', // ©
  '\u2122': '\\texttrademark{}', // ™
  '\u00ae': '\\textregistered{}', // ®
  // Degree
  '\u00b0': '\\textdegree{}', // °
  // Common math/symbol
  '\u00d7': '\\texttimes{}', // ×
  '\u00f7': '\\textdiv{}', // ÷
  // Non-breaking space
  '\u00a0': '~',
  // Thin space
  '\u2009': '\\,',
  '\u200a': '\\,',
  // Zero-width characters (strip them)
  '\u200b': '', // zero-width space
  '\u200c': '', // zero-width non-joiner
  '\u200d': '', // zero-width joiner
  '\ufeff': '', // zero-width no-break space / BOM
  // Ligatures
  '\ufb01': 'fl', // fi ligature
  '\ufb02': 'fl', // fl ligature
};

/**
 * Escapes all special LaTeX characters in a string.
 * This function is the security boundary between user input and LaTeX output.
 * Every piece of user content MUST pass through this before insertion.
 *
 * @param text - Raw text from user content
 * @returns LaTeX-safe text with all special characters escaped
 */
export function escapeLatex(text: string): string {
  if (!text) return '';

  let result = text;

  // Step 1: Replace unicode characters with LaTeX equivalents
  // Process longer sequences first to avoid partial replacements
  const sortedUnicode = Object.keys(UNICODE_REPLACEMENTS).sort(
    (a, b) => b.length - a.length
  );
  for (const unicode of sortedUnicode) {
    const replacement = UNICODE_REPLACEMENTS[unicode];
    if (replacement !== undefined) {
      result = result.split(unicode).join(replacement);
    }
  }

  // Step 2: Escape special LaTeX characters
  // Order matters: escape backslash first to avoid double-escaping
  const escapeOrder = ['\\', '&', '%', '$', '#', '_', '{', '}', '~', '^'];
  for (const char of escapeOrder) {
    const escaped = SPECIAL_CHARS[char];
    if (escaped) {
      // Split and rejoin with the escaped version
      result = result.split(char).join(escaped);
    }
  }

  // Step 3: Normalize whitespace
  // Collapse multiple spaces into one (LaTeX treats multiple spaces as one)
  // but preserve leading/trailing
  result = result.replace(/  +/g, ' ');

  return result;
}

/**
 * Escapes text specifically for use in a LaTeX section heading.
 * Adds formatting that makes headings stand out.
 *
 * @param text - Raw heading text
 * @returns LaTeX-safe formatted heading
 */
export function escapeLatexHeading(text: string): string {
  return escapeLatex(text);
}

/**
 * Escapes a URL for safe use in LaTeX hyperref.
 * URLs don't need most LaTeX escaping, but we handle
 * special characters that could break href commands.
 *
 * @param url - Raw URL string
 * @returns LaTeX-safe URL for use in \href{...}{...}
 */
export function escapeLatexUrl(url: string): string {
  if (!url) return '';

  let result = url.trim();

  // Remove zero-width characters
  result = result.replace(/[\u200b\u200c\u200d\ufeff]/g, '');

  // Only escape characters that actually break LaTeX URLs
  // # and % are the main ones; underscores are valid in URLs
  result = result.replace(/#/g, '\\#');
  result = result.replace(/%/g, '\\%');

  return result;
}

/**
 * Escapes text for use in a LaTeX section separator/divider.
 *
 * @param char - The divider character (e.g., '-', '=', '~')
 * @param width - Approximate width in characters
 * @returns LaTeX-safe divider string
 */
export function createLatexDivider(char: string = '~', width: number = 40): string {
  const escaped = escapeLatex(char);
  return escaped.repeat(width);
}

/**
 * Validates that a string doesn't contain common LaTeX injection patterns.
 * Returns true if the text is safe, false if it looks suspicious.
 *
 * @param text - Text to validate
 * @returns true if safe, false if suspicious
 */
export function validateLatexInput(text: string): boolean {
  if (!text) return true;

  // Check for LaTeX commands that shouldn't appear in user content
  // These are commands that could alter document structure or execute code
  const dangerousPatterns = [
    /\\input\{/i,
    /\\include\{/i,
    /\\write\{/i,
    /\\immediate/i,
    /\\write18/i,
    /\\shell_escape/i,
    /\\catcode/i,
    /\\makeatletter/i,
    /\\csname/i,
    /\\expandafter/i,
    /\\def\\/,
    /\\newcommand.*\\/, // nested newcommand
    /\\renewcommand.*\\/,
    /\\begin\{filecontents\}/i,
    /\\end\{filecontents\}/i,
    /\\usepackage\{(--|\s*\\)/i, // suspicious package loading
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(text)) {
      return false;
    }
  }

  return true;
}
