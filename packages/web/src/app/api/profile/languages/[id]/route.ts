import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { languageSchema } from "@/lib/validators";
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
    const parsed = languageSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 422);
    }

    const existing = await prisma.language.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return notFoundResponse();
    }

    const data = parsed.data;

    const language = await prisma.language.update({
      where: { id },
      data: {
        name: data.name,
        proficiency: data.proficiency,
        sortOrder: data.sortOrder,
      },
    });

    return successResponse(language);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    console.error("Update language error:", error);
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

    const existing = await prisma.language.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return notFoundResponse();
    }

    await prisma.language.delete({ where: { id } });

    return successResponse({ message: "Language deleted" });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    console.error("Delete language error:", error);
    return errorResponse("Internal server error", 500);
  }
}
