import "server-only";
import { cookies } from "next/headers";
import { randomBytes, createHash } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const SESSION_COOKIE_NAME = "qf_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const TWO_FACTOR_COOKIE_NAME = "qf_2fa_challenge";
const TWO_FACTOR_CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/** Issues a password-reset token and returns the raw (unhashed) token to embed in the email link. */
export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: { userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
  });
  return token;
}

/** Validates a reset token (unused, unexpired) and returns the associated user id, or null. */
export async function consumePasswordResetToken(token: string): Promise<string | null> {
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) return null;

  await prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  return record.userId;
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: { userId, tokenHash, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    const tokenHash = hashToken(token);
    await prisma.session.deleteMany({ where: { tokenHash } }).catch(() => {});
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Issues a short-lived, single-use challenge for an account with 2FA enabled.
 * No session cookie is set here — the visitor must also present a valid TOTP
 * code (see consumeTwoFactorChallenge) before createSession() ever runs.
 */
export async function createTwoFactorChallenge(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  await prisma.twoFactorChallenge.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + TWO_FACTOR_CHALLENGE_TTL_MS),
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(TWO_FACTOR_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TWO_FACTOR_CHALLENGE_TTL_MS / 1000,
  });
}

/** Resolves the pending 2FA challenge cookie to a user id, or null if missing/expired. */
export async function getTwoFactorChallengeUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TWO_FACTOR_COOKIE_NAME)?.value;
  if (!token) return null;

  const record = await prisma.twoFactorChallenge.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.expiresAt < new Date()) return null;

  return record.userId;
}

/** Deletes the pending challenge (server-side and cookie) after a successful or abandoned 2FA step. */
export async function consumeTwoFactorChallenge(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TWO_FACTOR_COOKIE_NAME)?.value;
  if (token) {
    await prisma.twoFactorChallenge.deleteMany({ where: { tokenHash: hashToken(token) } }).catch(() => {});
  }
  cookieStore.delete(TWO_FACTOR_COOKIE_NAME);
}

export type AuthedUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
};

/** Resolves the current session to a user. Never trusts anything from the client but the opaque cookie token. */
export async function getCurrentUser(): Promise<AuthedUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    }
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    organizationId: session.user.organizationId,
  };
}

/** Throws-free guard for use in Server Components / Route Handlers that must redirect on failure. */
export async function requireUser(): Promise<AuthedUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("UNAUTHENTICATED");
  }
  return user;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
