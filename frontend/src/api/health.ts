const base = () => (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

/** True if `/health` responds OK; false if URL missing or request fails. */
export async function pingApiHealth(): Promise<boolean> {
  const b = base();
  if (!b) return false;
  try {
    const res = await fetch(`${b}/health`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}

export function isApiUrlConfigured(): boolean {
  return Boolean(base());
}
