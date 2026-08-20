import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { queueLatexCompile } from "@/lib/queue";
import { getLatexPath, fileExists, readFileAsString } from "@/lib/storage";
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  errorResponse,
} from "@/lib/api-utils";

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
    if (!latestVersion) {
      return errorResponse("No resume version found", 422);
    }

    if (!latestVersion.latexSourcePath) {
      return errorResponse(
        "LaTeX source not found. Generate LaTeX first.",
        422
      );
    }

    const latexPath = getLatexPath(userId, id);
    if (!(await fileExists(latexPath))) {
      return errorResponse("LaTeX file not found on disk", 422);
    }

    const latexSource = await readFileAsString(latexPath);

    const job = await queueLatexCompile({
      resumeId: id,
      versionId: latestVersion.id,
      userId,
      latexSource,
      template: resume.template,
    });

    await prisma.resume.update({
      where: { id },
      data: { status: "compiling" },
    });

    return successResponse({
      jobId: job.id,
      status: "queued",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    console.error("Compile resume error:", error);
    return errorResponse("Internal server error", 500);
  }
}
