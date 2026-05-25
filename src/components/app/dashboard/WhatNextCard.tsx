// TASK-065 · What Next Dashboard Card
// Shows a prioritized recommendation for the user's most impactful next action, personalised to their lane and progress.

import React from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Lightbulb,
  Target,
  Sparkles,
  UserPlus,
  Zap,
  Trophy,
  FileText,
  Megaphone,
  TrendingUp,
} from "lucide-react";

interface Props {
  lane: string;
  hasValidatedIdea: boolean;
  hasPitch: boolean;
  hasOffer: boolean;
  hasGtm: boolean;
  hasLeads: boolean;
  hasAutomation: boolean;
  hasWonLead: boolean;
}

type Recommendation = {
  title: string;
  desc: string;
  cta: string;
  to: string;
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  urgency: "high" | "medium" | "low";
};

function pickRecommendation(props: Props): Recommendation {
  const { lane, hasValidatedIdea, hasPitch, hasOffer, hasGtm, hasLeads, hasAutomation, hasWonLead } = props;

  if (lane === "Idea" || (!hasValidatedIdea && !hasOffer)) {
    if (!hasValidatedIdea) {
      return {
        title: "Validate your idea first",
        desc: "Get a market-signal score before you spend a dollar building.",
        cta: "Run validation",
        to: "/app/launchpad/idea-validator",
        icon: Lightbulb,
        urgency: "high",
      };
    }
    if (!hasPitch) {
      return {
        title: "Craft your investor pitch",
        desc: "Turn your validated idea into a deck you can send today.",
        cta: "Generate pitch",
        to: "/app/launchpad/pitch-generator",
        icon: Megaphone,
        urgency: "high",
      };
    }
  }

  if (lane === "Offer" || (hasValidatedIdea && !hasOffer)) {
    if (!hasOffer) {
      return {
        title: "Build your core offer",
        desc: "Lock in your headline, price, and promise before going to market.",
        cta: "Build offer",
        to: "/app/launchpad/offer",
        icon: Sparkles,
        urgency: "high",
      };
    }
    if (!hasGtm) {
      return {
        title: "Map your go-to-market",
        desc: "Channels, ICP, and positioning in one structured plan.",
        cta: "Plan GTM",
        to: "/app/launchpad/gtm-strategy",
        icon: Target,
        urgency: "high",
      };
    }
  }

  if (lane === "Customer" || (hasOffer && !hasLeads)) {
    if (!hasLeads) {
      return {
        title: "Capture your first lead",
        desc: "Every customer starts somewhere. Add the first one manually.",
        cta: "Add a lead",
        to: "/app/nova/leads",
        icon: UserPlus,
        urgency: "high",
      };
    }
    if (!hasWonLead) {
      return {
        title: "Close your first deal",
        desc: "Move a lead to Won to see your funnel come alive.",
        cta: "Open pipeline",
        to: "/app/nova/crm",
        icon: Trophy,
        urgency: "medium",
      };
    }
  }

  if (!hasAutomation) {
    return {
      title: "Automate your follow-ups",
      desc: "Wire a sequence so no prospect goes cold while you're building.",
      cta: "Open workflows",
      to: "/app/nova/workflows",
      icon: Zap,
      urgency: "medium",
    };
  }

  return {
    title: "Generate a business plan",
    desc: "Turn everything you've built into a structured, shareable document.",
    cta: "Generate plan",
    to: "/app/launchpad/business-plan",
    icon: FileText,
    urgency: "low",
  };
}

const URGENCY_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#6366f1",
};

export function WhatNextCard(props: Props) {
  const rec = pickRecommendation(props);
  const Icon = rec.icon;
  const urgencyColor = URGENCY_COLORS[rec.urgency];

  return (
    <div
      style={{
        borderRadius: 18,
        border: "1px solid rgba(249,115,22,0.2)",
        background: "var(--surface)",
        padding: 20,
        position: "relative",
        overflow: "hidden",
        height: "100%",
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
          background: "radial-gradient(ellipse, rgba(249,115,22,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: "linear-gradient(90deg, transparent, rgba(249,115,22,0.5), transparent)",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#f97316",
          }}
        >
          What Next
        </div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 9,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: urgencyColor,
            background: `${urgencyColor}14`,
            border: `1px solid ${urgencyColor}25`,
            padding: "2px 7px",
            borderRadius: 4,
          }}
        >
          <TrendingUp style={{ width: 8, height: 8 }} />
          {rec.urgency} priority
        </span>
      </div>

      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: "linear-gradient(135deg, #f97316, #ef4444)",
          boxShadow: "0 4px 16px rgba(249,115,22,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <Icon style={{ width: 22, height: 22, color: "#fff" } as React.CSSProperties} />
      </div>

      <div
        style={{
          fontSize: 16,
          fontWeight: 800,
          color: "var(--foreground)",
          letterSpacing: "-0.025em",
          lineHeight: 1.25,
          marginBottom: 8,
        }}
      >
        {rec.title}
      </div>
      <p
        style={{
          fontSize: 12.5,
          color: "var(--muted-foreground)",
          lineHeight: 1.55,
          marginBottom: 16,
        }}
      >
        {rec.desc}
      </p>

      <Link to={rec.to} style={{ textDecoration: "none" }}>
        <button
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(135deg, #f97316, #ef4444)",
            color: "#fff",
            fontSize: 12.5,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            boxShadow: "0 4px 14px rgba(249,115,22,0.35)",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 22px rgba(249,115,22,0.5)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "none";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(249,115,22,0.35)";
          }}
        >
          {rec.cta} <ArrowRight style={{ width: 12, height: 12 }} />
        </button>
      </Link>
    </div>
  );
}
