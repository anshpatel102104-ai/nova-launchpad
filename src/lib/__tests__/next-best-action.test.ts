import { describe, it, expect } from "vitest";
import {
  nextBestAction,
  nextBestActionForLead,
  compareByNextAction,
  urgencyRank,
} from "@/lib/next-best-action";

const NOW = new Date("2026-06-15T12:00:00Z");
const reachable = { email: "a@b.com" };

describe("nextBestAction", () => {
  it("tells you to find contact info when unreachable", () => {
    const a = nextBestAction({ status: "new" }, NOW);
    expect(a.label).toMatch(/find their email/i);
    // unreachable + plain new lead is not yet a fire — soon, not now
    expect(a.urgency).toBe("soon");
  });

  it("escalates unreachable to now when the lead is hot", () => {
    expect(nextBestAction({ status: "qualified", tags: ["hot"] }, NOW).urgency).toBe("now");
  });

  it("pushes first contact for a new, reachable lead", () => {
    const a = nextBestAction({ ...reachable, status: "new" }, NOW);
    expect(a.label).toMatch(/send the intro/i);
    expect(a.urgency).toBe("now");
  });

  it("prioritizes buying signals over status", () => {
    const a = nextBestAction({ ...reachable, status: "nurture", tags: ["demo"] }, NOW);
    expect(a.label).toMatch(/today/i);
    expect(a.urgency).toBe("now");
  });

  it("does not nag a hot lead you just spoke to", () => {
    const a = nextBestAction(
      { ...reachable, status: "contacted", tags: ["hot"], last_contacted_at: NOW.toISOString() },
      NOW,
    );
    expect(a.urgency).not.toBe("now");
  });

  it("moves qualified/engaged leads toward a yes", () => {
    expect(nextBestAction({ ...reachable, status: "qualified" }, NOW).label).toMatch(
      /book the call/i,
    );
    expect(nextBestAction({ ...reachable, status: "engaged" }, NOW).label).toMatch(/proposal/i);
  });

  it("keeps momentum when a warm lead was contacted recently", () => {
    const a = nextBestAction(
      { ...reachable, status: "qualified", last_contacted_at: "2026-06-14T12:00:00Z" },
      NOW,
    );
    expect(a.label).toMatch(/momentum/i);
    expect(a.urgency).toBe("soon");
  });

  it("follows up on contacted leads by how long they've gone quiet", () => {
    const old = nextBestAction(
      { ...reachable, status: "contacted", last_contacted_at: "2026-06-01T12:00:00Z" },
      NOW,
    );
    expect(old.label).toMatch(/follow-up/i);
    expect(old.urgency).toBe("now");

    const mid = nextBestAction(
      { ...reachable, status: "contacted", last_contacted_at: "2026-06-11T12:00:00Z" },
      NOW,
    );
    expect(mid.urgency).toBe("soon");

    const fresh = nextBestAction(
      { ...reachable, status: "contacted", last_contacted_at: NOW.toISOString() },
      NOW,
    );
    expect(fresh.urgency).toBe("later");
  });

  it("handles terminal states without chasing", () => {
    expect(nextBestAction({ ...reachable, status: "won" }, NOW).urgency).toBe("won");
    expect(nextBestAction({ ...reachable, status: "lost" }, NOW).urgency).toBe("none");
    expect(nextBestAction({ ...reachable, status: "archived" }, NOW).urgency).toBe("none");
  });

  it("ranks 'now' ahead of everything for sorting", () => {
    const now = { ...reachable, status: "new" };
    const later = { ...reachable, status: "nurture" };
    expect(compareByNextAction(now, later, NOW)).toBeLessThan(0);
    expect([now, later].sort((a, b) => compareByNextAction(a, b, NOW))[0]).toBe(now);
  });

  it("exposes a monotonic urgency rank", () => {
    expect(urgencyRank("now")).toBeLessThan(urgencyRank("soon"));
    expect(urgencyRank("soon")).toBeLessThan(urgencyRank("later"));
    expect(urgencyRank("later")).toBeLessThan(urgencyRank("none"));
  });
});

describe("nextBestActionForLead", () => {
  it("pushes the intro for a brand-new lead", () => {
    const a = nextBestActionForLead({ stage: "new" }, NOW);
    expect(a.label).toMatch(/intro/i);
    expect(a.urgency).toBe("now");
  });

  it("books the call for qualified/interested leads", () => {
    expect(nextBestActionForLead({ stage: "qualified" }, NOW).label).toMatch(/book the call/i);
    expect(nextBestActionForLead({ stage: "interested" }, NOW).urgency).toBe("now");
  });

  it("checks in (not a cold intro) at proposal/negotiation", () => {
    const a = nextBestActionForLead({ stage: "proposal" }, NOW);
    expect(a.label).toMatch(/check in/i);
    expect(a.urgency).toBe("soon");
    expect(nextBestActionForLead({ stage: "negotiating" }, NOW).label).toMatch(/check in/i);
  });

  it("follows up on contacted leads by age", () => {
    const stale = nextBestActionForLead(
      { stage: "contacted", created_at: "2026-06-01T12:00:00Z" },
      NOW,
    );
    expect(stale.label).toMatch(/follow-up/i);
    expect(stale.urgency).toBe("now");

    const fresh = nextBestActionForLead({ stage: "contacted", created_at: NOW.toISOString() }, NOW);
    expect(fresh.urgency).toBe("later");
  });

  it("handles terminal stages", () => {
    expect(nextBestActionForLead({ stage: "won" }, NOW).urgency).toBe("won");
    expect(nextBestActionForLead({ stage: "closed won" }, NOW).urgency).toBe("won");
    expect(nextBestActionForLead({ stage: "lost" }, NOW).urgency).toBe("none");
  });

  it("defaults unknown stages to first contact", () => {
    expect(nextBestActionForLead({ stage: "" }, NOW).label).toMatch(/intro/i);
    expect(nextBestActionForLead({}, NOW).urgency).toBe("now");
  });
});
