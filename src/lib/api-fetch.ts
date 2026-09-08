"use client";

import { redirectToLogin } from "@/lib/auth-redirect";

/** Browser fetch wrapper — sends session cookie and redirects on 401 when auth is enabled. */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);

  if (init?.body && !headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(input, {
    ...init,
    credentials: "include",
    headers,
  });

  if (
    res.status === 401 &&
    typeof window !== "undefined" &&
    !window.location.pathname.startsWith("/login")
  ) {
    const url = typeof input === "string" ? input : input instanceof URL ? input.pathname : input.url;
    if (!url.includes("/api/auth/login")) {
      redirectToLogin();
    }
  }

  return res;
}
