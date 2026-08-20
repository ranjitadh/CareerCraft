import { z } from "zod";

// ─── Auth ────────────────────────────────────────────────────────────────────

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      passwordRegex,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ─── User Profile ────────────────────────────────────────────────────────────

export const userProfileSchema = z.object({
  professionalHeadline: z.string().max(200).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(30).optional(),
  location: z.string().max(200).optional(),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
  githubUrl: z.string().url().optional().or(z.literal("")),
  professionalSummary: z.string().max(2000).optional(),
});

// ─── Experience ──────────────────────────────────────────────────────────────

export const experienceSchema = z.object({
  company: z.string().min(1, "Company is required").max(200),
  title: z.string().min(1, "Title is required").max(200),
  location: z.string().max(200).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  isCurrent: z.boolean().default(false),
  originalDescription: z.string().min(1, "Description is required"),
  achievements: z.array(z.string()).default([]),
  sortOrder: z.number().int().default(0),
});

// ─── Education ───────────────────────────────────────────────────────────────

export const educationSchema = z.object({
  institution: z.string().min(1, "Institution is required").max(200),
  degree: z.string().min(1, "Degree is required").max(200),
  fieldOfStudy: z.string().min(1, "Field of study is required").max(200),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  description: z.string().max(1000).optional(),
  sortOrder: z.number().int().default(0),
});

// ─── Skills ──────────────────────────────────────────────────────────────────

export const skillSchema = z.object({
  name: z.string().min(1, "Skill name is required").max(100),
  category: z.string().min(1, "Category is required").max(100),
  level: z
    .enum(["beginner", "intermediate", "advanced", "expert"])
    .optional(),
  sortOrder: z.number().int().default(0),
});

// ─── Projects ────────────────────────────────────────────────────────────────

export const projectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(200),
  description: z.string().min(1, "Description is required").max(2000),
  url: z.string().url().optional().or(z.literal("")),
  technologies: z.array(z.string()).default([]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  sortOrder: z.number().int().default(0),
});

// ─── Certifications ──────────────────────────────────────────────────────────

export const certificationSchema = z.object({
  name: z.string().min(1, "Certification name is required").max(200),
  issuer: z.string().min(1, "Issuer is required").max(200),
  issueDate: z.coerce.date(),
  credentialUrl: z.string().url().optional().or(z.literal("")),
  expiryDate: z.coerce.date().nullable().optional(),
});

// ─── Languages ───────────────────────────────────────────────────────────────

export const languageSchema = z.object({
  name: z.string().min(1, "Language name is required").max(100),
  proficiency: z.enum([
    "elementary",
    "limited",
    "professional",
    "full",
    "native",
  ]),
  sortOrder: z.number().int().default(0),
});

// ─── Resume ──────────────────────────────────────────────────────────────────

export const resumeCreateSchema = z.object({
  name: z.string().min(1, "Resume name is required").max(200),
  companyName: z.string().max(200).optional(),
  targetRole: z.string().max(200).optional(),
  jobDescription: z
    .string()
    .min(50, "Job description must be at least 50 characters"),
  template: z.string().default("classic-professional"),
});

export const resumeUpdateSchema = resumeCreateSchema.partial();

// ─── AI Stage 1: Job Analysis Result ────────────────────────────────────────

export const jobAnalysisResultSchema = z.object({
  targetRole: z.string(),
  seniority: z.string().optional(),
  industry: z.string().optional(),
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  keywords: z.array(z.string()),
  responsibilities: z.array(z.string()),
  actionVerbs: z.array(z.string()),
  supportedKeywords: z.array(z.string()),
  unsupportedKeywords: z.array(z.string()),
  profileMatchScore: z.number().min(0).max(1).optional(),
});

// ─── AI Stage 2: Resume Content ─────────────────────────────────────────────

export const resumeContentSchema = z.object({
  personalInfo: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    location: z.string().optional(),
    linkedinUrl: z.string().url().optional(),
    portfolioUrl: z.string().url().optional(),
    githubUrl: z.string().url().optional(),
    professionalSummary: z.string(),
  }),
  experience: z.array(
    z.object({
      company: z.string(),
      title: z.string(),
      location: z.string().optional(),
      startDate: z.string(),
      endDate: z.string().nullable().optional(),
      isCurrent: z.boolean().optional(),
      achievements: z.array(z.string()),
    })
  ),
  education: z.array(
    z.object({
      institution: z.string(),
      degree: z.string(),
      fieldOfStudy: z.string(),
      startDate: z.string(),
      endDate: z.string().nullable().optional(),
      description: z.string().optional(),
    })
  ),
  skills: z.array(
    z.object({
      name: z.string(),
      category: z.string(),
      level: z.string().optional(),
    })
  ),
  projects: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        url: z.string().url().optional(),
        technologies: z.array(z.string()),
        startDate: z.string(),
        endDate: z.string().nullable().optional(),
      })
    )
    .optional(),
  certifications: z
    .array(
      z.object({
        name: z.string(),
        issuer: z.string(),
        issueDate: z.string(),
        credentialUrl: z.string().url().optional(),
        expiryDate: z.string().nullable().optional(),
      })
    )
    .optional(),
  languages: z
    .array(
      z.object({
        name: z.string(),
        proficiency: z.string(),
      })
    )
    .optional(),
});

// ─── AI Stage 3: Quality Check Result ───────────────────────────────────────

export const qualityCheckResultSchema = z.object({
  overallScore: z.number().min(0).max(100),
  keywordAlignment: z.number().min(0).max(100),
  formattingScore: z.number().min(0).max(100),
  contentScore: z.number().min(0).max(100),
  atsCompatibility: z.number().min(0).max(100),
  sections: z.object({
    summary: z.object({
      score: z.number().min(0).max(100),
      feedback: z.array(z.string()),
    }),
    experience: z.object({
      score: z.number().min(0).max(100),
      feedback: z.array(z.string()),
    }),
    skills: z.object({
      score: z.number().min(0).max(100),
      feedback: z.array(z.string()),
    }),
    education: z.object({
      score: z.number().min(0).max(100),
      feedback: z.array(z.string()),
    }),
  }),
  suggestions: z.array(
    z.object({
      section: z.string(),
      priority: z.enum(["high", "medium", "low"]),
      message: z.string(),
    })
  ),
  missingKeywords: z.array(z.string()),
  addedKeywords: z.array(z.string()),
});

// ─── Inferred types ─────────────────────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UserProfileInput = z.infer<typeof userProfileSchema>;
export type ExperienceInput = z.infer<typeof experienceSchema>;
export type EducationInput = z.infer<typeof educationSchema>;
export type SkillInput = z.infer<typeof skillSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type CertificationInput = z.infer<typeof certificationSchema>;
export type LanguageInput = z.infer<typeof languageSchema>;
export type ResumeCreateInput = z.infer<typeof resumeCreateSchema>;
export type ResumeUpdateInput = z.infer<typeof resumeUpdateSchema>;
export type JobAnalysisResult = z.infer<typeof jobAnalysisResultSchema>;
export type ResumeContent = z.infer<typeof resumeContentSchema>;
export type QualityCheckResult = z.infer<typeof qualityCheckResultSchema>;
