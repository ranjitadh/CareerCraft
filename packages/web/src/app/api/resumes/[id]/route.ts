import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { resumeUpdateSchema } from "@/lib/validators";
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  errorResponse,
} from "@/lib/api-utils";
import {
  deleteStorageDirectory,
  getPdfPath,
  getLatexPath,
  fileExists,
  deleteFile,
} from "@/lib/storage";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    const resume = await prisma.resume.findUnique({
      where: { id },
      include: {
        versions: { orderBy: { versionNumber: "desc" } },
        jobAnalysis: true,
      },
    });

    if (!resume || resume.userId !== userId) {
      return notFoundResponse();
    }

    return successResponse(resume);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    console.error("Get resume error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const parsed = resumeUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 422);
    }

    const existing = await prisma.resume.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return notFoundResponse();
    }

    const data = parsed.data;

    const resume = await prisma.resume.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.companyName !== undefined && { companyName: data.companyName }),
        ...(data.targetRole !== undefined && { targetRole: data.targetRole }),
        ...(data.jobDescription !== undefined && {
          jobDescription: data.jobDescription,
        }),
        ...(data.template !== undefined && { template: data.template }),
      },
    });

    return successResponse(resume);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    console.error("Update resume error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    const existing = await prisma.resume.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return notFoundResponse();
    }

    const pdfPath = getPdfPath(userId, id);
    const latexPath = getLatexPath(userId, id);

    if (await fileExists(pdfPath)) await deleteFile(pdfPath);
    if (await fileExists(latexPath)) await deleteFile(latexPath);

    await deleteStorageDirectory(userId, id);

    await prisma.resume.delete({ where: { id } });

    return successResponse({ message: "Resume deleted" });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    console.error("Delete resume error:", error);
    return errorResponse("Internal server error", 500);
  }
}
