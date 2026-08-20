import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  registerSchema,
  type RegisterInput,
} from "@/lib/validators";
import { hashPassword, createSession } from "@/lib/auth";
import {
  successResponse,
  errorResponse,
} from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 422);
    }

    const { name, email, password } = parsed.data as RegisterInput;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return errorResponse("Email already in use", 409);
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: { name, email, passwordHash },
    });

    await createSession(user.id, user.email);

    return successResponse(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      201
    );
  } catch (error) {
    console.error("Register error:", error);
    return errorResponse("Internal server error", 500);
  }
}
