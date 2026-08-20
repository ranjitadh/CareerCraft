import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { languageSchema } from "@/lib/validators";
import {
  successResponse,
  unauthorizedResponse,
  errorResponse,
} from "@/lib/api-utils";

export async function GET() {
  try {
    const { userId } = await requireAuth();

    const languages = await prisma.language.findMany({
      where: { userId },
      orderBy: { sortOrder: "asc" },
    });

    return successResponse(languages);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    console.error("Get languages error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const parsed = languageSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 422);
    }

    const data = parsed.data;

    const language = await prisma.language.create({
      data: {
        userId,
        name: data.name,
        proficiency: data.proficiency,
        sortOrder: data.sortOrder,
      },
    });

    return successResponse(language, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    console.error("Create language error:", error);
    return errorResponse("Internal server error", 500);
  }
}
