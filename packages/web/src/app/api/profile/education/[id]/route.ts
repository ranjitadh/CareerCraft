import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { educationSchema } from "@/lib/validators";
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
    const parsed = educationSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 422);
    }

    const existing = await prisma.education.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return notFoundResponse();
    }

    const data = parsed.data;

    const education = await prisma.education.update({
      where: { id },
      data: {
        institution: data.institution,
        degree: data.degree,
        fieldOfStudy: data.fieldOfStudy,
        startDate: data.startDate,
        endDate: data.endDate ?? null,
        description: data.description,
        sortOrder: data.sortOrder,
      },
    });

    return successResponse(education);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    console.error("Update education error:", error);
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

    const existing = await prisma.education.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return notFoundResponse();
    }

    await prisma.education.delete({ where: { id } });

    return successResponse({ message: "Education deleted" });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    console.error("Delete education error:", error);
    return errorResponse("Internal server error", 500);
  }
}
