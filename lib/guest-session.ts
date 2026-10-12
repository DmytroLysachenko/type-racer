import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export type GuestSession = { id: string; name: string };
export const GUEST_COOKIE = "typearena_guest";
const MAX_AGE = 60 * 60 * 24 * 30;
const MAX_COOKIE_LENGTH = 512;
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function secret() {
  return process.env.SESSION_SECRET || process.env.PUSHER_SECRET;
}

function sign(payload: string, key: string) {
  return createHmac("sha256", key)
    .update(`typearena-guest-v1:${payload}`)
    .digest("base64url");
}

export function readGuestSession(req: NextRequest): GuestSession | null {
  const key = secret();
  const cookie = req.cookies.get(GUEST_COOKIE)?.value;
  if (!key || !cookie || cookie.length > MAX_COOKIE_LENGTH) return null;
  const separator = cookie.lastIndexOf(".");
  if (separator < 0) return null;
  const payload = cookie.slice(0, separator);
  const supplied = Buffer.from(cookie.slice(separator + 1), "base64url");
  const expected = Buffer.from(sign(payload, key), "base64url");
  if (
    supplied.length !== expected.length ||
    !timingSafeEqual(supplied, expected)
  )
    return null;
  try {
    const value: unknown = JSON.parse(
      Buffer.from(payload, "base64url").toString(),
    );
    if (!value || typeof value !== "object") return null;
    const session = value as Partial<GuestSession> & { expiresAt?: unknown };
    if (
      typeof session.id !== "string" ||
      !UUID.test(session.id) ||
      typeof session.name !== "string" ||
      !session.name.trim() ||
      session.name.length > 32 ||
      typeof session.expiresAt !== "number" ||
      !Number.isSafeInteger(session.expiresAt) ||
      session.expiresAt <= Date.now() ||
      session.expiresAt > Date.now() + MAX_AGE * 1000
    )
      return null;
    return { id: session.id, name: session.name };
  } catch {
    return null;
  }
}

export function issueGuestSession(
  name: string,
  existing?: GuestSession | null,
) {
  const session = { id: existing?.id ?? randomUUID(), name };
  const key = secret();
  if (!key) return { session, cookie: null };
  const payload = Buffer.from(
    JSON.stringify({ ...session, expiresAt: Date.now() + MAX_AGE * 1000 }),
  ).toString("base64url");
  return {
    session,
    cookie: {
      name: GUEST_COOKIE,
      value: `${payload}.${sign(payload, key)}`,
      maxAge: MAX_AGE,
      httpOnly: true,
      sameSite: "lax" as const,
      path: "/",
    },
  };
}
