import { useState, useEffect } from "react";

const STORAGE_KEY = "nova-owner-mode";
const EVENT = "nova:owner-mode-change";

export function getOwnerMode(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function setOwnerMode(next: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  } catch (_) {
    // ignore storage errors
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
}

export function toggleOwnerMode() {
  setOwnerMode(!getOwnerMode());
}

/** React hook — re-renders whenever owner mode changes in any tab/component. */
export function useOwnerMode(): boolean {
  const [active, setActive] = useState(getOwnerMode);

  useEffect(() => {
    const onEvent = (e: Event) => setActive((e as CustomEvent<boolean>).detail);
    window.addEventListener(EVENT, onEvent);
    return () => window.removeEventListener(EVENT, onEvent);
  }, []);

  return active;
}

/** Register the Ctrl+Shift+O keyboard shortcut. Call once at the app root (AppTopbar). */
export function useOwnerModeShortcut() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "O") {
        e.preventDefault();
        toggleOwnerMode();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
