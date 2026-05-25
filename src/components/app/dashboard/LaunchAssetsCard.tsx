// TASK-067 · Launch Assets Dashboard Module
// Shows a summary of the user's generated assets by category with quick-access links.

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";
import {
  FileText,
  Megaphone,
  Target,
  Sparkles,
  Skull,
  Trophy,
  UserPlus,
  ArrowRight,
  Loader2,
  FolderOpen,
} from "lucide-react";

interface Props {
  orgId: string;
}

const ASSET_CATEGORIES = [
  { key: "pitch", label: "Pitch", icon: Megaphone, to: "/app/launchpad/pitch-generator" },
  { key: "gtm", label: "GTM Strategy", icon: Target, to: "/app/launchpad/gtm-strategy" },
  { key: "offer", label: "Offer", icon: Sparkles, to: "/app/launchpad/offer" },
  {
    key: "business-plan",
    label: "Business Plan",
    icon: FileText,
    to: "/app/launchpad/business-plan",
  },
  { key: "kill-idea", label: "Kill My Idea", icon: Skull, to: "/app/launchpad/kill-my-idea" },
  { key: "funding", label: "Funding Score", icon: Trophy, to: "/app/launchpad/funding-score" },
  {
    key: "customers",
    label: "First Customers",
    icon: UserPlus,
    to: "/app/launchpad/first-10-customers",
  },
] as const;

type AssetRow = { id: string; category: string | null; title: string; created_at: string };

async function fetchAssetSummary(orgId: string) {
  const { data } = await supabase
    .from("generated_assets")
    .select("id, category, title, created_at")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as AssetRow[];
}

export function LaunchAssetsCard({ orgId }: Props) {
  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["launch-assets-summary", orgId],
    queryFn: () => fetchAssetSummary(orgId),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div
        style={{
          borderRadius: 18,
          border: "1px solid var(--border)",
          background: "var(--surface)",
          padding: 24,
          minHeight: 160,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader2
          style={{
            width: 18,
            height: 18,
            color: "var(--muted-foreground)",
            animation: "spin 1s linear infinite",
          }}
        />
      </div>
    );
  }

  const byCategory = new Map<string, AssetRow[]>();
  for (const a of assets) {
    const cat = a.category ?? "other";
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(a);
  }

  const totalAssets = assets.length;
  const categoriesWithAssets = ASSET_CATEGORIES.filter((c) => byCategory.has(c.key));

  if (totalAssets === 0) {
    return (
      <div
        style={{
          borderRadius: 18,
          border: "1px solid var(--border)",
          background: "var(--surface)",
          padding: 24,
          textAlign: "center",
        }}
      >
        <FolderOpen
          style={{ width: 24, height: 24, color: "var(--muted-foreground)", margin: "0 auto 10px" }}
        />
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", marginBottom: 4 }}>
          No assets yet
        </div>
        <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 14 }}>
          Run a Launchpad tool to generate your first asset.
        </div>
        <Link to="/app/launchpad">
          <button
            style={{
              padding: "7px 16px",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            Open Launchpad <ArrowRight style={{ width: 12, height: 12 }} />
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        borderRadius: 18,
        border: "1px solid rgba(99,102,241,0.2)",
        background: "var(--surface)",
        padding: 20,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#6366f1",
              background: "rgba(99,102,241,0.12)",
              padding: "3px 8px",
              borderRadius: 5,
            }}
          >
            Launch Assets
          </div>
          <span style={{ fontSize: 11, color: "var(--muted-foreground)", fontWeight: 600 }}>
            {totalAssets} total
          </span>
        </div>
        <Link
          to="/app/launchpad/history"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            fontSize: 11,
            color: "#6366f1",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          View all <ArrowRight style={{ width: 10, height: 10 }} />
        </Link>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: 8,
        }}
      >
        {ASSET_CATEGORIES.map((cat) => {
          const count = byCategory.get(cat.key)?.length ?? 0;
          const hasAssets = count > 0;
          const Icon = cat.icon;
          return (
            <Link key={cat.key} to={cat.to} style={{ textDecoration: "none" }}>
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: hasAssets
                    ? "1px solid rgba(99,102,241,0.25)"
                    : "1px solid rgba(255,255,255,0.06)",
                  background: hasAssets ? "rgba(99,102,241,0.07)" : "var(--surface-2)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.4)";
                  (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.12)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = hasAssets
                    ? "rgba(99,102,241,0.25)"
                    : "rgba(255,255,255,0.06)";
                  (e.currentTarget as HTMLElement).style.background = hasAssets
                    ? "rgba(99,102,241,0.07)"
                    : "var(--surface-2)";
                }}
              >
                <Icon
                  style={{
                    width: 16,
                    height: 16,
                    color: hasAssets ? "#6366f1" : "var(--muted-foreground)",
                    marginBottom: 6,
                  }}
                />
                <div
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: hasAssets ? "var(--foreground)" : "var(--muted-foreground)",
                    marginBottom: 2,
                    lineHeight: 1.3,
                  }}
                >
                  {cat.label}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: hasAssets ? "#6366f1" : "var(--muted-foreground)",
                    fontWeight: 600,
                  }}
                >
                  {hasAssets ? `${count} generated` : "Not started"}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {categoriesWithAssets.length > 0 && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(99,102,241,0.1)" }}>
          <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginBottom: 6 }}>
            Most recent
          </div>
          {assets.slice(0, 2).map((a) => (
            <div
              key={a.id}
              style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#6366f1",
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  fontSize: 12,
                  color: "var(--foreground)",
                  fontWeight: 500,
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {a.title}
              </div>
              <div style={{ fontSize: 10, color: "var(--muted-foreground)", flexShrink: 0 }}>
                {new Date(a.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
