import { requireAuth, getFullUser } from "@/lib/auth";
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

    const hasProfile = !!user.profile;
    const hasExperiences = user.experiences.length > 0;
    const hasEducation = user.education.length > 0;
    const hasSkills = user.skills.length > 0;

    const completeness = [
      hasProfile,
      hasExperiences,
      hasEducation,
      hasSkills,
    ].filter(Boolean).length;
    const profileCompleteness = Math.round((completeness / 4) * 100);

    return successResponse({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      profileCompleteness,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    console.error("Get current user error:", error);
    return errorResponse("Internal server error", 500);
  }
}
