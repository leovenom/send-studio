import { NextResponse } from "next/server";
import { STUDIO_AUTH_COOKIE } from "@/lib/api-auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(STUDIO_AUTH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
