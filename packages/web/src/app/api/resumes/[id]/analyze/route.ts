import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, getFullUser } from "@/lib/auth";
import { getAIProvider, type ProfileSummary } from "@/lib/ai";
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  errorResponse,
} from "@/lib/api-utils";

function buildProfileSummary(user: NonNullable<Awaited<ReturnType<typeof getFullUser>>>): ProfileSummary {
  return {
    profile: {
      professionalHeadline: user.profile?.professionalHeadline || "",
      email: user.profile?.email || user.email,
      phone: user.profile?.phone || "",
      location: user.profile?.location || "",
      professionalSummary: user.profile?.professionalSummary || "",
      linkedinUrl: user.profile?.linkedinUrl || undefined,
      portfolioUrl: user.profile?.portfolioUrl || undefined,
      githubUrl: user.profile?.githubUrl || undefined,
    },
    experiences: user.experiences.map((e) => ({
      id: e.id,
      company: e.company,
      title: e.title,
      location: e.location || "",
      startDate: e.startDate.toISOString(),
      endDate: e.endDate?.toISOString(),
      isCurrent: e.isCurrent,
      originalDescription: e.originalDescription,
      achievements: (e.achievements as string[]) || [],
    })),
    education: user.education.map((e) => ({
      id: e.id,
      institution: e.institution,
      degree: e.degree,
      fieldOfStudy: e.fieldOfStudy,
      startDate: e.startDate.toISOString(),
      endDate: e.endDate?.toISOString(),
    })),
    skills: user.skills.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      level: s.level || undefined,
    })),
    projects: user.projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      url: p.url || undefined,
      technologies: (p.technologies as string[]) || [],
    })),
    certifications: user.certifications.map((c) => ({
      id: c.id,
      name: c.name,
      issuer: c.issuer,
      issueDate: c.issueDate.toISOString(),
    })),
    languages: user.languages.map((l) => ({
      id: l.id,
      name: l.name,
      proficiency: l.proficiency,
    })),
  };
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    const resume = await prisma.resume.findUnique({ where: { id } });
    if (!resume || resume.userId !== userId) {
      return notFoundResponse();
    }

    const user = await getFullUser(userId);
    if (!user || !user.profile) {
      return errorResponse(
        "Please complete your profile before analyzing a job description",
        422
      );
    }

    const profileSummary = buildProfileSummary(user);
    const ai = getAIProvider();

    const analysisResult = await ai.analyzeJobDescription(
      resume.jobDescription,
      profileSummary
    );

    const jobAnalysis = await prisma.jobAnalysis.upsert({
      where: { resumeId: id },
      update: {
        targetRole: analysisResult.targetRole,
        seniority: analysisResult.seniority,
        industry: analysisResult.industry,
        requiredSkills: analysisResult.requiredSkills,
        preferredSkills: analysisResult.preferredSkills,
        keywords: analysisResult.keywords,
        responsibilities: analysisResult.responsibilities,
        actionVerbs: analysisResult.actionVerbs,
        supportedKeywords: analysisResult.supportedKeywords,
        unsupportedKeywords: analysisResult.unsupportedKeywords,
      },
      create: {
        resumeId: id,
        targetRole: analysisResult.targetRole,
        seniority: analysisResult.seniority,
        industry: analysisResult.industry,
        requiredSkills: analysisResult.requiredSkills,
        preferredSkills: analysisResult.preferredSkills,
        keywords: analysisResult.keywords,
        responsibilities: analysisResult.responsibilities,
        actionVerbs: analysisResult.actionVerbs,
        supportedKeywords: analysisResult.supportedKeywords,
        unsupportedKeywords: analysisResult.unsupportedKeywords,
      },
    });

    await prisma.resume.update({
      where: { id },
      data: {
        status: "analyzed",
        ...(analysisResult.targetRole && { targetRole: analysisResult.targetRole }),
      },
    });

    return successResponse({ jobAnalysis });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    console.error("Analyze resume error:", error);
    return errorResponse("Internal server error", 500);
  }
}
