import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { certificationSchema } from "@/lib/validators";
import {
  successResponse,
  unauthorizedResponse,
  errorResponse,
} from "@/lib/api-utils";

export async function GET() {
  try {
    const { userId } = await requireAuth();

    const certifications = await prisma.certification.findMany({
      where: { userId },
    });

    return successResponse(certifications);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    console.error("Get certifications error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const parsed = certificationSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 422);
    }

    const data = parsed.data;

    const certification = await prisma.certification.create({
      data: {
        userId,
        name: data.name,
        issuer: data.issuer,
        issueDate: data.issueDate,
        credentialUrl: data.credentialUrl || null,
        expiryDate: data.expiryDate ?? null,
      },
    });

    return successResponse(certification, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    console.error("Create certification error:", error);
    return errorResponse("Internal server error", 500);
  }
}
