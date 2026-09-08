import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isPublicApiRoute, isStudioAuthRequired, verifyApiAccess } from "@/lib/api-auth";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (isPublicApiRoute(pathname)) {
    return NextResponse.next();
  }

  const auth = verifyApiAccess(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const response = NextResponse.next();

  if (isStudioAuthRequired()) {
    response.headers.set("Cache-Control", "no-store");
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
