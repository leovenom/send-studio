import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  STUDIO_AUTH_COOKIE,
  getStudioAccessToken,
  isStudioAuthRequired,
  verifyStudioToken,
} from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  if (!isStudioAuthRequired()) {
    return NextResponse.json({ ok: true, authRequired: false });
  }

  const body = z.object({ token: z.string().min(1) }).parse(await req.json());

  if (!verifyStudioToken(body.token)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const expected = getStudioAccessToken()!;
  const response = NextResponse.json({ ok: true, authRequired: true });
  response.cookies.set(STUDIO_AUTH_COOKIE, expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
