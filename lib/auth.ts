import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { db } from "./db";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-secret",
);
const COOKIE = "rtx_session";

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  role: string;
};

export const hashPassword = (pw: string) => bcrypt.hash(pw, 10);
export const verifyPassword = (pw: string, hash: string) =>
  bcrypt.compare(pw, hash);

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE);
}

/** Lanza si no hay sesión o el rol no está permitido. */
export async function requireSession(roles?: string[]) {
  const session = await getSession();
  if (!session) throw new AuthError("No autenticado", 401);
  if (roles && !roles.includes(session.role))
    throw new AuthError("No autorizado", 403);
  return session;
}

export async function getSessionUser() {
  const session = await getSession();
  if (!session) return null;
  return db.user.findUnique({ where: { id: session.userId } });
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
