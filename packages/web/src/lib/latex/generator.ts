import { escapeLatex, validateLatexInput } from './escape';
import { getTemplate } from './templates';
import type { ResumeContent, ProfileSummary } from '../ai/types';

/**
 * Generates a complete LaTeX document from resume content and profile data.
 *
 * @param resumeContent - The AI-generated tailored resume content
 * @param profile - The user's profile data (experiences, education, etc.)
 * @param template - Template name to use (defaults to 'classic-professional')
 * @returns Complete .tex source code ready for compilation
 */
export function generateLatex(
  resumeContent: ResumeContent,
  profile: ProfileSummary,
  template: string = 'classic-professional'
): string {
  // Validate inputs
  if (!resumeContent || !profile) {
    throw new Error('resumeContent and profile are required');
  }

  // Load template
  const templateSource = getTemplate(template);

  // Build the document by replacing placeholders
  let latex = templateSource;

  // Header
  latex = latex.replace(
    '%%NAME%%',
    escapeLatex(profile.profile.professionalHeadline || 'Your Name')
  );
  latex = latex.replace('%%EMAIL%%', escapeLatex(profile.profile.email || ''));
  latex = latex.replace('%%PHONE%%', escapeLatex(profile.profile.phone || ''));
  latex = latex.replace(
    '%%LOCATION%%',
    escapeLatex(profile.profile.location || '')
  );
  latex = latex.replace(
    '%%LINKEDIN%%',
    profile.profile.linkedinUrl
      ? `\\href{${escapeUrlForLatex(profile.profile.linkedinUrl)}}{${escapeLatex(profile.profile.linkedinUrl)}}`
      : ''
  );
  latex = latex.replace(
    '%%GITHUB%%',
    profile.profile.githubUrl
      ? `\\href{${escapeUrlForLatex(profile.profile.githubUrl)}}{${escapeLatex(profile.profile.githubUrl)}}`
      : ''
  );

  // Sections
  latex = latex.replace(
    '%%SUMMARY_SECTION%%',
    buildSummarySection(resumeContent.professionalSummary)
  );
  latex = latex.replace(
    '%%SKILLS_SECTION%%',
    buildSkillsSection(resumeContent.coreSkills, template)
  );
  latex = latex.replace(
    '%%EXPERIENCE_SECTION%%',
    buildExperienceSection(resumeContent.experience, profile.experiences)
  );
  latex = latex.replace(
    '%%PROJECTS_SECTION%%',
    buildProjectsSection(resumeContent.projects, profile.projects)
  );
  latex = latex.replace(
    '%%EDUCATION_SECTION%%',
    buildEducationSection(resumeContent.educationIds, profile.education)
  );
  latex = latex.replace(
    '%%CERTIFICATIONS_SECTION%%',
    buildCertificationsSection(
      resumeContent.certificationIds,
      profile.certifications
    )
  );
  latex = latex.replace(
    '%%LANGUAGES_SECTION%%',
    buildLanguagesSection(resumeContent.languageIds, profile.languages)
  );

  return latex;
}

/**
 * Builds the professional summary section LaTeX
 */
function buildSummarySection(summary: string): string {
  if (!summary || !summary.trim()) return '';

  const safeText = escapeLatex(summary);
  return `\\section*{Professional Summary}\n${safeText}`;
}

/**
 * Builds the skills section LaTeX
 */
function buildSkillsSection(
  skills: string[],
  template: string
): string {
  if (!skills || skills.length === 0) return '';

  // Technical template uses categorized format with monospace
  if (template === 'technical') {
    return buildTechnicalSkillsSection(skills);
  }

  // Other templates use comma-separated list
  const escapedSkills = skills.map((s) => escapeLatex(s));
  const skillsText = escapedSkills.join(', \\enspace ');

  return `\\section*{Core Skills}\n${skillsText}`;
}

/**
 * Builds skills section for technical template (grouped by category)
 */
function buildTechnicalSkillsSection(skills: string[]): string {
  if (!skills || skills.length === 0) return '';

  // Group skills into logical categories based on common patterns
  const categories = categorizeSkills(skills);

  let latex = `\\section*{Technical Skills}\n`;

  for (const [category, categorySkills] of Object.entries(categories)) {
    const escapedCategory = escapeLatex(category);
    const escapedSkills = categorySkills
      .map((s) => `\\texttt{${escapeLatex(s)}}`)
      .join(' $\\cdot$ ');
    latex += `\\textbf{${escapedCategory}:} ${escapedSkills} \\\\\n`;
  }

  return latex.trimEnd();
}

/**
 * Attempts to categorize skills into logical groups
 */
function categorizeSkills(
  skills: string[]
): Record<string, string[]> {
  const categories: Record<string, string[]> = {};

  // Define keyword patterns for common categories
  const categoryPatterns: Record<string, string[]> = {
    Languages: ['javascript', 'typescript', 'python', 'java', 'go', 'golang', 'rust', 'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'r ', 'sql', 'html', 'css', 'sass', 'scss'],
    Frontend: ['react', 'vue', 'angular', 'svelte', 'next', 'nuxt', 'remix', 'tailwind', 'bootstrap', 'material', 'chakra'],
    Backend: ['node', 'express', 'fastify', 'nest', 'django', 'flask', 'rails', 'spring', 'laravel', 'fastapi'],
    Database: ['postgres', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb', 'sqlite', 'mariadb', 'cassandra', 'neo4j'],
    Cloud: ['aws', 'azure', 'gcp', 'google cloud', 'heroku', 'vercel', 'netlify', 'digitalocean', 'cloudflare'],
    DevOps: ['docker', 'kubernetes', 'k8s', 'terraform', 'ansible', 'jenkins', 'github actions', 'ci/cd', 'prometheus', 'grafana'],
    'Data & ML': ['tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit', 'spark', 'hadoop', 'kafka', 'airflow', 'dbt'],
    Testing: ['jest', 'mocha', 'pytest', 'cypress', 'playwright', 'selenium', 'vitest', 'junit'],
  };

  // Initialize categories
  for (const cat of Object.keys(categoryPatterns)) {
    categories[cat] = [];
  }
  categories['Other'] = [];

  // Categorize each skill
  for (const skill of skills) {
    const lowerSkill = skill.toLowerCase();
    let matched = false;

    for (const [category, patterns] of Object.entries(categoryPatterns)) {
      if (patterns.some((p) => lowerSkill.includes(p.trim()))) {
        categories[category].push(skill);
        matched = true;
        break;
      }
    }

    if (!matched) {
      categories['Other'].push(skill);
    }
  }

  // Remove empty categories
  for (const cat of Object.keys(categories)) {
    if (categories[cat].length === 0) {
      delete categories[cat];
    }
  }

  // If no categories matched, return all skills as flat list
  if (Object.keys(categories).length === 0 || (Object.keys(categories).length === 1 && categories['Other'])) {
    return { 'Technical Skills': skills };
  }

  return categories;
}

/**
 * Builds the experience section LaTeX
 */
function buildExperienceSection(
  resumeExperience: ResumeContent['experience'],
  profileExperiences: ProfileSummary['experiences']
): string {
  if (!resumeExperience || resumeExperience.length === 0) return '';

  let latex = `\\section*{Professional Experience}\n\n`;

  for (const entry of resumeExperience) {
    // Find the full experience from profile
    const fullExperience = profileExperiences.find(
      (e) => e.id === entry.experienceId
    );

    if (!fullExperience) continue;

    const title = escapeLatex(fullExperience.title);
    const company = escapeLatex(fullExperience.company);
    const location = escapeLatex(fullExperience.location);
    const dateRange = buildDateRange(
      fullExperience.startDate,
      fullExperience.endDate,
      fullExperience.isCurrent
    );

    latex += `\\textbf{${title}} \\hfill ${escapeLatex(dateRange)} \\\\\n`;
    latex += `\\textit{${company}} \\hfill \\textit{${location}} \\\\\n`;

    if (entry.tailoredBullets && entry.tailoredBullets.length > 0) {
      latex += `\\begin{itemize}[leftmargin=*, nosep, topsep=2pt]\n`;
      for (const bullet of entry.tailoredBullets) {
        if (!validateLatexInput(bullet)) continue;
        latex += `  \\item ${escapeLatex(bullet)}\n`;
      }
      latex += `\\end{itemize}\n`;
    }

    latex += `\n`;
  }

  return latex.trimEnd();
}

/**
 * Builds the projects section LaTeX
 */
function buildProjectsSection(
  resumeProjects: ResumeContent['projects'],
  profileProjects: ProfileSummary['projects']
): string {
  if (!resumeProjects || resumeProjects.length === 0) return '';

  let latex = `\\section*{Projects}\n\n`;

  for (const entry of resumeProjects) {
    const fullProject = profileProjects.find(
      (p) => p.id === entry.projectId
    );

    if (!fullProject) continue;

    const name = escapeLatex(fullProject.name);
    const url = fullProject.url
      ? ` (\\href{${escapeUrlForLatex(fullProject.url)}}{\\underline{Link}})`
      : '';

    latex += `\\textbf{${name}}${url} \\\\\n`;

    if (fullProject.description) {
      latex += `${escapeLatex(fullProject.description)} \\\\\n`;
    }

    if (fullProject.technologies && fullProject.technologies.length > 0) {
      const techs = fullProject.technologies.map((t) => escapeLatex(t)).join(', ');
      latex += `\\textit{Technologies:} ${techs} \\\\\n`;
    }

    if (entry.tailoredBullets && entry.tailoredBullets.length > 0) {
      latex += `\\begin{itemize}[leftmargin=*, nosep, topsep=2pt]\n`;
      for (const bullet of entry.tailoredBullets) {
        if (!validateLatexInput(bullet)) continue;
        latex += `  \\item ${escapeLatex(bullet)}\n`;
      }
      latex += `\\end{itemize}\n`;
    }

    latex += `\n`;
  }

  return latex.trimEnd();
}

/**
 * Builds the education section LaTeX
 */
function buildEducationSection(
  educationIds: string[],
  profileEducation: ProfileSummary['education']
): string {
  if (!educationIds || educationIds.length === 0) return '';

  let latex = `\\section*{Education}\n\n`;

  for (const id of educationIds) {
    const edu = profileEducation.find((e) => e.id === id);
    if (!edu) continue;

    const degree = escapeLatex(edu.degree);
    const field = escapeLatex(edu.fieldOfStudy);
    const institution = escapeLatex(edu.institution);
    const dateRange = buildDateRange(edu.startDate, edu.endDate, false);

    latex += `\\textbf{${degree}} in ${field} \\hfill ${escapeLatex(dateRange)} \\\\\n`;
    latex += `\\textit{${institution}}\n\n`;
  }

  return latex.trimEnd();
}

/**
 * Builds the certifications section LaTeX
 */
function buildCertificationsSection(
  certIds: string[],
  profileCerts: ProfileSummary['certifications']
): string {
  if (!certIds || certIds.length === 0) return '';

  let latex = `\\section*{Certifications}\n\n`;

  for (const id of certIds) {
    const cert = profileCerts.find((c) => c.id === id);
    if (!cert) continue;

    const name = escapeLatex(cert.name);
    const issuer = escapeLatex(cert.issuer);
    const date = escapeLatex(cert.issueDate);

    latex += `${name} --- ${issuer} (${date}) \\\\\n`;
  }

  return latex.trimEnd();
}

/**
 * Builds the languages section LaTeX
 */
function buildLanguagesSection(
  langIds: string[],
  profileLanguages: ProfileSummary['languages']
): string {
  if (!langIds || langIds.length === 0) return '';

  let latex = `\\section*{Languages}\n\n`;

  const langParts: string[] = [];
  for (const id of langIds) {
    const lang = profileLanguages.find((l) => l.id === id);
    if (!lang) continue;

    const name = escapeLatex(lang.name);
    const proficiency = escapeLatex(lang.proficiency);
    langParts.push(`${name} (${proficiency})`);
  }

  latex += langParts.join(', ');

  return latex;
}

/**
 * Builds a formatted date range string
 */
function buildDateRange(
  startDate: string,
  endDate: string | undefined,
  isCurrent: boolean
): string {
  const start = formatDate(startDate);
  if (isCurrent) return `${start} -- Present`;
  if (endDate) return `${start} -- ${formatDate(endDate)}`;
  return start;
}

/**
 * Formats a date string for display
 */
function formatDate(dateStr: string): string {
  if (!dateStr) return '';

  // Handle various date formats
  try {
    // Try to parse as ISO date
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const month = date.toLocaleString('en-US', { month: 'short' });
      const year = date.getFullYear();
      return `${month} ${year}`;
    }
  } catch {
    // Fall through to return raw string
  }

  // If it's already a formatted string (like "2024" or "May 2024"), return as-is
  return dateStr;
}

/**
 * Escapes a URL for safe use in LaTeX \href commands
 */
function escapeUrlForLatex(url: string): string {
  return url.replace(/#/g, '\\#').replace(/%/g, '\\%');
}
