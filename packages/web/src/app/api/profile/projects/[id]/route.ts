import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { projectSchema } from "@/lib/validators";
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  errorResponse,
} from "@/lib/api-utils";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const parsed = projectSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 422);
    }

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return notFoundResponse();
    }

    const data = parsed.data;

    const project = await prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        url: data.url || null,
        technologies: data.technologies,
        startDate: data.startDate,
        endDate: data.endDate ?? null,
        sortOrder: data.sortOrder,
      },
    });

    return successResponse(project);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    console.error("Update project error:", error);
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

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return notFoundResponse();
    }

    await prisma.project.delete({ where: { id } });

    return successResponse({ message: "Project deleted" });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    console.error("Delete project error:", error);
    return errorResponse("Internal server error", 500);
  }
}
