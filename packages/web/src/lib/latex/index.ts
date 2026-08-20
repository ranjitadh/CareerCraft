/**
 * LaTeX generation module for ResumeForge AI.
 *
 * Provides utilities for generating ATS-safe LaTeX resumes from
 * structured resume content and user profile data.
 */

// Character escaping (security boundary)
export {
  escapeLatex,
  escapeLatexHeading,
  escapeLatexUrl,
  createLatexDivider,
  validateLatexInput,
} from './escape';

// Template management
export {
  getTemplate,
  listTemplates,
  clearTemplateCache,
  AVAILABLE_TEMPLATES,
} from './templates';
export type { TemplateName } from './templates';

// LaTeX generation
export { generateLatex } from './generator';
