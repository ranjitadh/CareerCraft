import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { skillSchema } from "@/lib/validators";
import {
  successResponse,
  unauthorizedResponse,
  errorResponse,
} from "@/lib/api-utils";

export async function GET() {
  try {
    const { userId } = await requireAuth();

    const skills = await prisma.skill.findMany({
      where: { userId },
      orderBy: { sortOrder: "asc" },
    });

    return successResponse(skills);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    console.error("Get skills error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const parsed = skillSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 422);
    }

    const data = parsed.data;

    const skill = await prisma.skill.create({
      data: {
        userId,
        name: data.name,
        category: data.category,
        level: data.level,
        sortOrder: data.sortOrder,
      },
    });

    return successResponse(skill, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    console.error("Create skill error:", error);
    return errorResponse("Internal server error", 500);
  }
}
