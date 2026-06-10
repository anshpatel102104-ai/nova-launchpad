import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, ArrowUpRight } from "lucide-react";
import { LAUNCHPAD_TOOLS } from "@/lib/catalog";

type Item = { id: string; label: string; path: string; tag: "page" | "tool" };

const NAV_ITEMS: Item[] = [
  { id: "home", label: "Home", path: "/app/dashboard", tag: "page" },
  { id: "path", label: "Journey / Path", path: "/app/launchpad-path", tag: "page" },
  { id: "missions", label: "Missions", path: "/app/mission-control", tag: "page" },
  { id: "workbench", label: "Workbench (Tools)", path: "/app/launchpad/", tag: "page" },
  { id: "contacts", label: "Customers · Contacts", path: "/app/contacts", tag: "page" },
  { id: "pipeline", label: "Customers · Pipeline", path: "/app/nova/crm", tag: "page" },
  { id: "automations", label: "Automations", path: "/app/automations", tag: "page" },
  { id: "builder", label: "Automation Builder", path: "/app/builder", tag: "page" },
  { id: "integrations", label: "Integrations", path: "/app/integrations", tag: "page" },
  { id: "ai-dashboard", label: "Insights · AI Dashboard", path: "/app/ai-dashboard", tag: "page" },
  { id: "reports", label: "Insights · Reports", path: "/app/nova/reports", tag: "page" },
  { id: "assets", label: "Library · Assets", path: "/app/assets", tag: "page" },
  { id: "memory", label: "Library · Memory", path: "/app/memory", tag: "page" },
  { id: "settings", label: "Settings", path: "/app/settings", tag: "page" },
  { id: "billing", label: "Billing", path: "/app/billing", tag: "page" },
];

const TOOL_ITEMS: Item[] = LAUNCHPAD_TOOLS.map((t) => ({
  id: t.slug,
  label: t.name,
  path: `/app/launchpad/${t.slug}`,
  tag: "tool" as const,
}));

const ALL_ITEMS = [...NAV_ITEMS, ...TOOL_ITEMS];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? ALL_ITEMS.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
    : ALL_ITEMS.slice(0, 12);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  const handleSelect = useCallback(
    (path: string) => {
      navigate({ to: path as never });
      onClose();
    },
    [navigate, onClose],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((s) => Math.min(s + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((s) => Math.max(s - 1, 0));
      } else if (e.key === "Enter" && filtered[selected]) {
        handleSelect(filtered[selected].path);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, selected, handleSelect, onClose]);

  if (!open) return null;

  const pages = filtered.filter((i) => i.tag === "page");
  const tools = filtered.filter((i) => i.tag === "tool");

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center"
      style={{ paddingTop: "12vh", background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[520px] mx-4 rounded-2xl border overflow-hidden"
        style={{
          background: "var(--popover)",
          borderColor: "var(--border)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div
          className="flex items-center gap-3 px-4 py-3.5 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <Search className="h-4 w-4 shrink-0" style={{ color: "var(--muted-foreground)" }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages and tools..."
            className="flex-1 bg-transparent text-[14px] outline-none"
            style={{ color: "var(--foreground)" }}
          />
          <kbd
            className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-mono"
            style={{ background: "var(--surface-2)", color: "var(--muted-foreground)" }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="overflow-y-auto" style={{ maxHeight: 360 }}>
          {filtered.length === 0 ? (
            <div
              className="py-10 text-center text-[12px]"
              style={{ color: "var(--muted-foreground)" }}
            >
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="p-1.5 space-y-3">
              {pages.length > 0 && (
                <div>
                  {query === "" && (
                    <div
                      className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Navigation
                    </div>
                  )}
                  {pages.map((item) => {
                    const globalIdx = filtered.indexOf(item);
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item.path)}
                        onMouseEnter={() => setSelected(globalIdx)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-left transition-colors"
                        style={{
                          background: globalIdx === selected ? "var(--surface-2)" : "transparent",
                          color: "var(--foreground)",
                        }}
                      >
                        <span
                          className="text-[10px] font-mono w-8 shrink-0"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          page
                        </span>
                        <span className="flex-1">{item.label}</span>
                        {globalIdx === selected && (
                          <ArrowUpRight
                            className="h-3.5 w-3.5 shrink-0"
                            style={{ color: "var(--muted-foreground)" }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {tools.length > 0 && (
                <div>
                  {query === "" && (
                    <div
                      className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      AI Tools
                    </div>
                  )}
                  {tools.map((item) => {
                    const globalIdx = filtered.indexOf(item);
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item.path)}
                        onMouseEnter={() => setSelected(globalIdx)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-left transition-colors"
                        style={{
                          background: globalIdx === selected ? "var(--surface-2)" : "transparent",
                          color: "var(--foreground)",
                        }}
                      >
                        <span
                          className="text-[10px] font-mono w-8 shrink-0"
                          style={{ color: "var(--primary)" }}
                        >
                          tool
                        </span>
                        <span className="flex-1">{item.label}</span>
                        {globalIdx === selected && (
                          <ArrowUpRight
                            className="h-3.5 w-3.5 shrink-0"
                            style={{ color: "var(--muted-foreground)" }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center gap-4 px-4 py-2.5 border-t text-[10px]"
          style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
        >
          <span>
            <kbd className="font-mono">↑↓</kbd> navigate
          </span>
          <span>
            <kbd className="font-mono">↵</kbd> open
          </span>
          <span>
            <kbd className="font-mono">esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
