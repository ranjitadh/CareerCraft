import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { experienceSchema } from "@/lib/validators";
import {
  successResponse,
  unauthorizedResponse,
  errorResponse,
} from "@/lib/api-utils";

export async function GET() {
  try {
    const { userId } = await requireAuth();

    const experiences = await prisma.experience.findMany({
      where: { userId },
      orderBy: { sortOrder: "asc" },
    });

    return successResponse(experiences);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    console.error("Get experiences error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const parsed = experienceSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 422);
    }

    const data = parsed.data;

    const experience = await prisma.experience.create({
      data: {
        userId,
        company: data.company,
        title: data.title,
        location: data.location,
        startDate: data.startDate,
        endDate: data.endDate ?? null,
        isCurrent: data.isCurrent,
        originalDescription: data.originalDescription,
        achievements: data.achievements,
        sortOrder: data.sortOrder,
      },
    });

    return successResponse(experience, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    console.error("Create experience error:", error);
    return errorResponse("Internal server error", 500);
  }
}
