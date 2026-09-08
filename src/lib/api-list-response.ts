import { NextResponse } from "next/server";

/** Short private cache — helps repeat navigations; auth still required. */
export function jsonList<T>(data: T, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "private, max-age=10, s-maxage=30, stale-while-revalidate=60",
    },
  });
}
