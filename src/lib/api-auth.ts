import { timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

export const STUDIO_AUTH_COOKIE = "studio_auth";

const PUBLIC_API_PREFIXES = [
  "/api/webhooks/",
  "/api/track/",
  "/api/auth/login",
  "/api/auth/logout",
] as const;

export function getStudioAccessToken(): string | undefined {
  const token = process.env.STUDIO_ACCESS_TOKEN?.trim();
  return token || undefined;
}

export function isStudioAuthRequired(): boolean {
  return !!getStudioAccessToken();
}

export function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function tokensMatch(provided: string, expected: string): boolean {
  if (provided.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function verifyStudioToken(provided: string): boolean {
  const expected = getStudioAccessToken();
  if (!expected) return true;
  return tokensMatch(provided, expected);
}

export function verifyApiAccess(
  request: NextRequest,
): { ok: true } | { ok: false; error: string } {
  if (!isStudioAuthRequired()) {
    return { ok: true };
  }

  const token = getStudioAccessToken()!;

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const bearer = authHeader.slice(7).trim();
    if (tokensMatch(bearer, token)) {
      return { ok: true };
    }
  }

  const cookie = request.cookies.get(STUDIO_AUTH_COOKIE)?.value;
  if (cookie && tokensMatch(cookie, token)) {
    return { ok: true };
  }

  return { ok: false, error: "Unauthorized" };
}
