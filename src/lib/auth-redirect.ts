/** Full-page redirect to login — used outside React components (e.g. apiFetch). */
export function redirectToLogin(nextPath?: string) {
  if (typeof window === "undefined") return;

  const next = encodeURIComponent(
    nextPath ?? `${window.location.pathname}${window.location.search}`,
  );

  // Full reload ensures auth cookies/session state stay in sync after 401.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(`/login?next=${next}`);
}
