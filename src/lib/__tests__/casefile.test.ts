import { describe, it, expect } from "vitest";
import { formatLabel, verdictCategory, pickScore } from "@/lib/casefile";

describe("formatLabel", () => {
  it("maps validation/kill/funding tools to Investment Assessment", () => {
    expect(formatLabel("validate-idea")).toBe("Investment Assessment");
    expect(formatLabel("kill-my-idea")).toBe("Investment Assessment");
    expect(formatLabel("funding-readiness-score")).toBe("Investment Assessment");
  });
  it("maps offer/positioning tools to Founder Review", () => {
    expect(formatLabel("generate-offer")).toBe("Founder Review");
  });
  it("maps GTM/research tools to Viability Brief", () => {
    expect(formatLabel("generate-gtm-strategy")).toBe("Viability Brief");
    expect(formatLabel("competitor-scanner")).toBe("Viability Brief");
  });
  it("maps pricing/decision tools to Decision Memo", () => {
    expect(formatLabel("pricing-calculator")).toBe("Decision Memo");
  });
  it("falls back to Founder Casefile for unknown tools", () => {
    expect(formatLabel("some-new-tool")).toBe("Founder Casefile");
  });
});

describe("verdictCategory", () => {
  it("classifies negative verdicts as danger", () => {
    expect(verdictCategory("KILL")).toBe("danger");
    expect(verdictCategory("Lost")).toBe("danger");
    expect(verdictCategory("no-go")).toBe("danger");
  });
  it("classifies positive verdicts as success", () => {
    expect(verdictCategory("GO")).toBe("success");
    expect(verdictCategory("Fundable")).toBe("success");
    expect(verdictCategory("strong")).toBe("success");
  });
  it("classifies hedged verdicts as warning", () => {
    expect(verdictCategory("CONDITIONAL")).toBe("warning");
    expect(verdictCategory("pivot")).toBe("warning");
  });
  it("defaults unknown/empty verdicts to neutral", () => {
    expect(verdictCategory("")).toBe("neutral");
    expect(verdictCategory("review pending")).toBe("neutral");
  });
});

describe("pickScore", () => {
  it("prefers total_score", () => {
    expect(pickScore({ total_score: 28, viabilityScore: 40 })).toBe(28);
  });
  it("falls back to viabilityScore then score", () => {
    expect(pickScore({ viabilityScore: 40 })).toBe(40);
    expect(pickScore({ score: 71 })).toBe(71);
  });
  it("coerces numeric strings", () => {
    expect(pickScore({ total_score: "55" })).toBe(55);
  });
  it("returns null when there is no score", () => {
    expect(pickScore({})).toBeNull();
    expect(pickScore({ total_score: "n/a" })).toBeNull();
  });
});
