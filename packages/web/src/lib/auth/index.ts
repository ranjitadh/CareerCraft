import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "../db";

const SESSION_COOKIE = "rf_session";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "resumeforge-dev-secret-change-in-production"
);
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds
const SALT_ROUNDS = 12;

// ─── Rate Limiting ───────────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const loginAttempts = new Map<string, RateLimitEntry>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function cleanupRateLimit() {
  const now = Date.now();
  for (const [key, entry] of loginAttempts) {
    if (now > entry.resetAt) {
      loginAttempts.delete(key);
    }
  }
}

export function checkRateLimit(identifier: string): {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterMs: number;
} {
  cleanupRateLimit();

  const now = Date.now();
  const entry = loginAttempts.get(identifier);

  if (!entry || now > entry.resetAt) {
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS, retryAfterMs: 0 };
  }

  if (entry.count >= MAX_LOGIN_ATTEMPTS) {
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterMs: entry.resetAt - now,
    };
  }

  return {
    allowed: true,
    remainingAttempts: MAX_LOGIN_ATTEMPTS - entry.count,
    retryAfterMs: 0,
  };
}

export function recordLoginAttempt(identifier: string, failed: boolean) {
  const now = Date.now();
  const entry = loginAttempts.get(identifier);

  if (!failed) {
    loginAttempts.delete(identifier);
    return;
  }

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(identifier, {
      count: 1,
      resetAt: now + LOCKOUT_DURATION_MS,
    });
    return;
  }

  entry.count += 1;
}

// ─── Password Hashing ────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── JWT / Session ───────────────────────────────────────────────────────────

interface SessionPayload {
  userId: string;
  email: string;
}

async function createToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .setSubject(payload.userId)
    .sign(JWT_SECRET);
}

async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.sub as string,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

export async function createSession(
  userId: string,
  email: string
): Promise<string> {
  const token = await createToken({ userId, email });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  return token;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

export async function getCurrentUser(): Promise<{
  userId: string;
  email: string;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth(): Promise<{
  userId: string;
  email: string;
}> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

// ─── Full User Lookup ────────────────────────────────────────────────────────

export async function getFullUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      experiences: { orderBy: { sortOrder: "asc" } },
      education: { orderBy: { sortOrder: "asc" } },
      skills: { orderBy: { sortOrder: "asc" } },
      projects: { orderBy: { sortOrder: "asc" } },
      certifications: true,
      languages: { orderBy: { sortOrder: "asc" } },
    },
  });
}
