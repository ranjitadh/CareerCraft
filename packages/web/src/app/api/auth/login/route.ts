import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { loginSchema, type LoginInput } from "@/lib/validators";
import {
  verifyPassword,
  createSession,
  checkRateLimit,
  recordLoginAttempt,
} from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 422);
    }

    const { email, password } = parsed.data as LoginInput;

    const rateLimit = checkRateLimit(email);
    if (!rateLimit.allowed) {
      const retryAfterMin = Math.ceil(rateLimit.retryAfterMs / 60000);
      return errorResponse(
        `Too many login attempts. Try again in ${retryAfterMin} minute(s).`,
        429
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      recordLoginAttempt(email, true);
      return errorResponse("Invalid email or password", 401);
    }

    const validPassword = await verifyPassword(password, user.passwordHash);
    if (!validPassword) {
      recordLoginAttempt(email, true);
      return errorResponse("Invalid email or password", 401);
    }

    recordLoginAttempt(email, false);

    await createSession(user.id, user.email);

    return successResponse({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse("Internal server error", 500);
  }
}
