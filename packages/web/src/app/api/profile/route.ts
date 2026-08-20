import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, getFullUser } from "@/lib/auth";
import { userProfileSchema } from "@/lib/validators";
import {
  successResponse,
  unauthorizedResponse,
  errorResponse,
} from "@/lib/api-utils";

export async function GET() {
  try {
    const { userId } = await requireAuth();
    const user = await getFullUser(userId);

    if (!user) {
      return unauthorizedResponse();
    }

    return successResponse(user);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    console.error("Get profile error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const parsed = userProfileSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 422);
    }

    const data = parsed.data;

    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: {
        professionalHeadline: data.professionalHeadline,
        email: data.email || null,
        phone: data.phone,
        location: data.location,
        linkedinUrl: data.linkedinUrl || null,
        portfolioUrl: data.portfolioUrl || null,
        githubUrl: data.githubUrl || null,
        professionalSummary: data.professionalSummary,
      },
      create: {
        userId,
        professionalHeadline: data.professionalHeadline,
        email: data.email || null,
        phone: data.phone,
        location: data.location,
        linkedinUrl: data.linkedinUrl || null,
        portfolioUrl: data.portfolioUrl || null,
        githubUrl: data.githubUrl || null,
        professionalSummary: data.professionalSummary,
      },
    });

    return successResponse(profile);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    console.error("Update profile error:", error);
    return errorResponse("Internal server error", 500);
  }
}
