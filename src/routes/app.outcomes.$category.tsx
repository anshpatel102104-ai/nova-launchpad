// Outcome Engines page — outcome-first replacement for tool-marketplace
// browsing. Styled as the Founder's Logbook: ruled notebook pages with
// mission-control telemetry stamps. Users pick what to ACHIEVE; tools are
// sequenced behind the scenes.

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ChevronDown, Clock, CheckCircle2, Sparkles } from "lucide-react";
import {
  OUTCOME_CATEGORIES,
  getOutcomesByCategory,
  isValidCategory,
  type OutcomeEngine,
} from "@/lib/outcome-engines";
import { useBusinessGraph } from "@/hooks/use-business-graph";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/outcomes/$category")({
  component: OutcomeEnginePage,
});

function OutcomeEnginePage() {
  const { category } = Route.useParams();
  const navigate = useNavigate();
  const graph = useBusinessGraph();

  if (!isValidCategory(category)) {
    void navigate({ to: "/app/mission-control" });
    return null;
  }

  const meta = OUTCOME_CATEGORIES[category];
  const outcomes = getOutcomesByCategory(category);

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-2">
      {/* ── Logbook header: starfield + tab ── */}
      <div>
        <div className="logbook-tab" style={{ color: "var(--primary)" }}>
          <Sparkles className="h-3 w-3" />
          {meta.label}
        </div>
        <div
          className="logbook-starfield rounded-tr-2xl rounded-b-2xl p-6 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in oklab, var(--primary) 8%, var(--surface)) 0%, var(--surface) 100%)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="logbook-stamp mb-1">
            Mission Log · {graph.businessName} · Stage: {graph.stage}
          </div>
          <h1
            className="font-display text-[24px] font-bold"
            style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}
          >
            What do you want to achieve?
          </h1>
          <p className="text-[13.5px] mt-1" style={{ color: "var(--muted-foreground)" }}>
            {meta.tagline}. Pick an outcome — Nova sequences the steps and tools for you.
          </p>
        </div>
      </div>

      {/* ── Outcome entries — notebook pages ── */}
      <div className="space-y-5">
        {outcomes.map((outcome, idx) => (
          <OutcomeLogEntry key={outcome.id} outcome={outcome} entryNumber={idx + 1} />
        ))}
      </div>

      {/* ── Footer note ── */}
      <div className="flex items-center justify-between px-2 pb-4">
        <span className="logbook-stamp">End of section</span>
        <Link
          to="/app/mission-control"
          className="text-[12.5px] font-medium inline-flex items-center gap-1"
          style={{ color: "var(--primary)" }}
        >
          Back to Mission Control <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

/* ─── A single outcome rendered as a logbook page entry ─────── */

function OutcomeLogEntry({
  outcome,
  entryNumber,
}: {
  outcome: OutcomeEngine;
  entryNumber: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = outcome.icon;
  const firstStep = outcome.steps[0];

  return (
    <div className="logbook-page logbook-torn overflow-hidden">
      {/* Entry content sits right of the margin rule */}
      <div className="pl-[60px] pr-5 py-5 relative">
        {/* Entry number in the margin — like a notebook index */}
        <div
          className="absolute left-0 top-5 w-[44px] text-center font-mono text-[11px] font-bold"
          style={{ color: "color-mix(in oklab, var(--ignition, #f97316) 70%, transparent)" }}
        >
          {String(entryNumber).padStart(2, "0")}
        </div>

        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="h-4 w-4 shrink-0" style={{ color: "var(--primary)" }} />
              <h2
                className="font-display text-[17px] font-bold truncate"
                style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}
              >
                {outcome.name}
              </h2>
            </div>
            <p className="text-[13px] leading-[1.6]" style={{ color: "var(--foreground)" }}>
              <span style={{ color: "var(--muted-foreground)" }}>You get: </span>
              {outcome.outcome}
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              {outcome.impact}
            </p>
          </div>

          {/* Margin note — handwritten */}
          {outcome.marginNote && (
            <div
              className="logbook-hand shrink-0 max-w-[140px] text-right hidden sm:block"
              style={{ color: "color-mix(in oklab, var(--warning) 85%, var(--foreground))" }}
            >
              {outcome.marginNote}
            </div>
          )}
        </div>

        {/* Telemetry row */}
        <div className="flex items-center gap-4 mt-3">
          <span className="logbook-stamp inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> ~{outcome.estimatedMinutes} min
          </span>
          <span className="logbook-stamp">
            {outcome.steps.length} step{outcome.steps.length === 1 ? "" : "s"}
          </span>
        </div>

        {/* Step checklist (collapsed → expanded) */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: "var(--muted-foreground)" }}
        >
          Flight plan
          <ChevronDown
            className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")}
          />
        </button>

        {expanded && (
          <div className="mt-2 space-y-2.5">
            {outcome.steps.map((step, i) => (
              <div key={i} className="logbook-check">
                <div className="logbook-check-box" />
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>
                    {step.title}
                    <span
                      className="ml-2 font-mono text-[10px] font-normal"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      ~{step.estimatedMinutes}m
                    </span>
                  </div>
                  <div
                    className="text-[12px] leading-[1.55] mt-0.5"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {step.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Primary action */}
        <div className="mt-4 flex items-center gap-3">
          <Link
            to={firstStep.to}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[12.5px] font-bold text-white transition hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, var(--primary), var(--orbit-accent))",
            }}
          >
            Begin <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          {outcome.leadsTo.length > 0 && (
            <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
              <CheckCircle2 className="inline h-3 w-3 mr-1" />
              Unlocks: {outcome.leadsTo.length} follow-on outcome
              {outcome.leadsTo.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
