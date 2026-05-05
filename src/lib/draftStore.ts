// Lightweight draft autosave for tool inputs. Uses localStorage scoped per
// (orgId, toolKey). No backend changes — purely a UX improvement.
import { useEffect, useRef, useState } from "react";

type Draft = { title?: string; context?: string; updatedAt: number };

const KEY = (orgId: string, toolKey: string) => `lpn-draft:${orgId}:${toolKey}`;

export function loadDraft(orgId: string | null, toolKey: string): Draft | null {
  if (!orgId || typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY(orgId, toolKey));
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

export function saveDraft(orgId: string | null, toolKey: string, draft: Omit<Draft, "updatedAt">) {
  if (!orgId || typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY(orgId, toolKey), JSON.stringify({ ...draft, updatedAt: Date.now() }));
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearDraft(orgId: string | null, toolKey: string) {
  if (!orgId || typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY(orgId, toolKey));
  } catch {
    /* ignore */
  }
}

/** Debounced autosave with "Saved just now" indicator. */
export function useDraftAutosave(
  orgId: string | null,
  toolKey: string,
  value: { title: string; context: string },
) {
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!orgId) return;
    if (!value.title && !value.context) return;
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => {
      saveDraft(orgId, toolKey, value);
      setSavedAt(Date.now());
    }, 700);
    return () => {
      if (t.current) clearTimeout(t.current);
    };
  }, [orgId, toolKey, value.title, value.context]);

  return savedAt;
}

export function formatSavedAgo(ts: number | null): string | null {
  if (!ts) return null;
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5) return "Saved just now";
  if (s < 60) return `Saved ${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `Saved ${m}m ago`;
  return "Draft saved";
}
