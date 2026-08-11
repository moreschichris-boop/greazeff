// Client-side PIN gate for the admin panel — same lightweight pattern used
// on the other league sites (no real user accounts, just a shared PIN whose
// SHA-256 hash lives in the app_settings table).

export async function sha256(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const SESSION_KEY = "greaze_admin_ok";

export function markAdminSession() {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(SESSION_KEY, "1");
  }
}

export function hasAdminSession(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(SESSION_KEY) === "1";
}

export function clearAdminSession() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(SESSION_KEY);
  }
}
