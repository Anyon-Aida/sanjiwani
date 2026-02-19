export function apiFetch(path: string, init?: RequestInit) {
  const base =
    typeof window === "undefined"
      ? process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000"
      : "";

  return fetch(`${base}${path}`, init);
}
