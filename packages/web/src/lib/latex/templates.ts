import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Available LaTeX template names
 */
export type TemplateName =
  | 'classic-professional'
  | 'modern-minimal'
  | 'executive'
  | 'technical';

/**
 * List of all available templates
 */
export const AVAILABLE_TEMPLATES: TemplateName[] = [
  'classic-professional',
  'modern-minimal',
  'executive',
  'technical',
];

/**
 * Path to the LaTeX templates directory
 */
const TEMPLATES_DIR = join(__dirname, '..', '..', '..', 'latex-templates');

/**
 * Cache for loaded templates to avoid repeated file reads
 */
const templateCache = new Map<string, string>();

/**
 * Loads a LaTeX template by name.
 * Falls back to classic-professional if the requested template is unknown.
 *
 * @param templateName - Name of the template to load
 * @returns The raw LaTeX template string with %%PLACEHOLDER%% tokens
 */
export function getTemplate(templateName: string): string {
  // Normalize the template name
  const normalizedName = normalizeTemplateName(templateName);

  // Check cache first
  if (templateCache.has(normalizedName)) {
    return templateCache.get(normalizedName)!;
  }

  // Try to load from filesystem
  try {
    const templatePath = join(TEMPLATES_DIR, `${normalizedName}.tex`);
    const content = readFileSync(templatePath, 'utf-8');
    templateCache.set(normalizedName, content);
    return content;
  } catch {
    // Template not found, fall back to classic-professional
    if (normalizedName !== 'classic-professional') {
      console.warn(
        `Template "${normalizedName}" not found, falling back to "classic-professional"`
      );
      return getTemplate('classic-professional');
    }
    throw new Error(
      `Failed to load default template "classic-professional" from ${TEMPLATES_DIR}`
    );
  }
}

/**
 * Normalizes a template name to a valid filename.
 * Handles variations like "Classic Professional", "classic_professional", etc.
 *
 * @param name - Raw template name
 * @returns Normalized template name (lowercase, hyphenated)
 */
function normalizeTemplateName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Clears the template cache. Useful for development/testing.
 */
export function clearTemplateCache(): void {
  templateCache.clear();
}

/**
 * Lists all available template names.
 *
 * @returns Array of available template names
 */
export function listTemplates(): TemplateName[] {
  return [...AVAILABLE_TEMPLATES];
}
