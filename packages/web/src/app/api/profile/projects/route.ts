import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { projectSchema } from "@/lib/validators";
import {
  successResponse,
  unauthorizedResponse,
  errorResponse,
} from "@/lib/api-utils";

export async function GET() {
  try {
    const { userId } = await requireAuth();

    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { sortOrder: "asc" },
    });

    return successResponse(projects);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    console.error("Get projects error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const parsed = projectSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 422);
    }

    const data = parsed.data;

    const project = await prisma.project.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        url: data.url || null,
        technologies: data.technologies,
        startDate: data.startDate,
        endDate: data.endDate ?? null,
        sortOrder: data.sortOrder,
      },
    });

    return successResponse(project, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    console.error("Create project error:", error);
    return errorResponse("Internal server error", 500);
  }
}
