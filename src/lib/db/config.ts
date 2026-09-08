/** Normalizes Turso/libSQL env vars (trim whitespace, fix common paste mistakes). */

export function getDatabaseConfig(): { url: string; authToken?: string } {
  const rawUrl = process.env.DATABASE_URL?.trim();
  const authToken = process.env.DATABASE_AUTH_TOKEN?.trim() || undefined;

  let url = rawUrl || "file:local.db";

  // Turso dashboard sometimes shows https:// — libSQL client needs libsql://
  if (url.startsWith("https://") && url.includes(".turso.io")) {
    url = `libsql://${url.slice("https://".length)}`;
  }

  return { url, authToken };
}
