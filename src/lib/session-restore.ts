// TASK-051 · Session restore — persists and retrieves the user's last meaningful app path.

const STORAGE_KEY = "nova:last-app-path";

const EXCLUDED_PREFIXES = [
  "/app/dashboard",
  "/onboarding",
  "/auth",
];

export function saveLastAppPath(path: string): void {
  if (!path.startsWith("/app/")) return;
  if (EXCLUDED_PREFIXES.some((p) => path.startsWith(p))) return;
  try {
    localStorage.setItem(STORAGE_KEY, path);
  } catch {}
}

export function getLastAppPath(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearLastAppPath(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
