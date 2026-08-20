import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { resumeCreateSchema } from "@/lib/validators";
import {
  successResponse,
  unauthorizedResponse,
  errorResponse,
} from "@/lib/api-utils";

export async function GET() {
  try {
    const { userId } = await requireAuth();

    const resumes = await prisma.resume.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
        jobAnalysis: true,
      },
    });

    return successResponse(resumes);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    console.error("Get resumes error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const parsed = resumeCreateSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 422);
    }

    const data = parsed.data;

    const resume = await prisma.resume.create({
      data: {
        userId,
        name: data.name,
        companyName: data.companyName,
        targetRole: data.targetRole,
        jobDescription: data.jobDescription,
        template: data.template,
      },
    });

    return successResponse(resume, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    console.error("Create resume error:", error);
    return errorResponse("Internal server error", 500);
  }
}
