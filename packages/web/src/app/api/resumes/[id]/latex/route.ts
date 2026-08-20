import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, getFullUser } from "@/lib/auth";
import { generateLatex } from "@/lib/latex";
import type { ProfileSummary, ResumeContent } from "@/lib/ai";
import {
  saveFile,
  getLatexPath,
  createStorageDirectories,
} from "@/lib/storage";
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

    const resume = await prisma.resume.findUnique({
      where: { id },
      include: {
        versions: { orderBy: { versionNumber: "desc" }, take: 1 },
      },
    });
    if (!resume || resume.userId !== userId) {
      return notFoundResponse();
    }

    const latestVersion = resume.versions[0];
    if (!latestVersion || !latestVersion.resumeContent) {
      return errorResponse("No resume content found. Run generate first.", 422);
    }

    const user = await getFullUser(userId);
    if (!user || !user.profile) {
      return errorResponse("Profile not found", 422);
    }

    const profileSummary = buildProfileSummary(user);
    const resumeContent = latestVersion.resumeContent as unknown as ResumeContent;

    const latexSource = generateLatex(resumeContent, profileSummary, resume.template);

    await createStorageDirectories(userId, id);
    const latexPath = getLatexPath(userId, id);
    await saveFile(latexPath, latexSource);

    await prisma.resumeVersion.update({
      where: { id: latestVersion.id },
      data: {
        latexSourcePath: latexPath,
        compileStatus: "pending",
      },
    });

    await prisma.resume.update({
      where: { id },
      data: { status: "latex_generated" },
    });

    return successResponse({
      versionId: latestVersion.id,
      latexSource,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    console.error("Generate LaTeX error:", error);
    return errorResponse("Internal server error", 500);
  }
}
