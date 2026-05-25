// TASK-066 · Approved Offer Dashboard Module
// Shows the user's best generated offer output with quick-copy and edit links.

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";
import { Package, ArrowRight, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  orgId: string;
}

async function fetchLatestOffer(orgId: string) {
  const { data } = await supabase
    .from("generated_assets")
    .select("id, title, content, created_at")
    .eq("organization_id", orgId)
    .eq("category", "offer")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export function ApprovedOfferCard({ orgId }: Props) {
  const [copied, setCopied] = React.useState(false);
  const { data: offer, isLoading } = useQuery({
    queryKey: ["latest-offer", orgId],
    queryFn: () => fetchLatestOffer(orgId),
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
          minHeight: 140,
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

  if (!offer) {
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
        <Package
          style={{ width: 24, height: 24, color: "var(--muted-foreground)", margin: "0 auto 10px" }}
        />
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", marginBottom: 4 }}>
          No offer built yet
        </div>
        <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 14 }}>
          Build your core offer to see it here.
        </div>
        <Link to="/app/launchpad/offer">
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
            Build Offer <ArrowRight style={{ width: 12, height: 12 }} />
          </button>
        </Link>
      </div>
    );
  }

  const content = offer.content as Record<string, unknown>;
  const headline = (content?.headline || content?.offer_name || offer.title) as string;
  const promise = (content?.promise || content?.outcome || content?.value_prop || "") as string;

  const handleCopy = () => {
    const text = [headline, promise].filter(Boolean).join("\n\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      style={{
        borderRadius: 18,
        border: "1px solid rgba(59,130,246,0.2)",
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
          width: 150,
          height: 150,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(59,130,246,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#3b82f6",
            background: "rgba(59,130,246,0.12)",
            padding: "3px 8px",
            borderRadius: 5,
          }}
        >
          Approved Offer
        </div>
        <button
          onClick={handleCopy}
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 10px",
            borderRadius: 6,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--muted-foreground)",
            fontSize: 11,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {copied ? (
            <Check style={{ width: 11, height: 11, color: "#22c55e" }} />
          ) : (
            <Copy style={{ width: 11, height: 11 }} />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 800,
          color: "var(--foreground)",
          letterSpacing: "-0.02em",
          marginBottom: 6,
        }}
      >
        {headline}
      </div>
      {promise && (
        <div
          style={{
            fontSize: 12.5,
            color: "var(--muted-foreground)",
            lineHeight: 1.55,
            marginBottom: 12,
          }}
        >
          {promise}
        </div>
      )}
      <Link
        to="/app/launchpad/offer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 11.5,
          color: "#3b82f6",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        Edit offer <ArrowRight style={{ width: 11, height: 11 }} />
      </Link>
    </div>
  );
}
