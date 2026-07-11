import { describe, it, expect, beforeEach } from "vitest";
import { resolveStepForRun, buildRunMomentum, type MissionLoopStep } from "@/lib/mission-loop";
import { extractAndSaveProfileFromFields } from "@/lib/workspaceProfile";

const steps: MissionLoopStep[] = [
  {
    id: "s1",
    title: "Build a GTM plan",
    tool_key: "gtm-strategy",
    status: "completed",
    sort_order: 0,
  },
  {
    id: "s2",
    title: "Create your pitch",
    tool_key: "pitch-generator",
    status: "pending",
    sort_order: 1,
  },
  { id: "s3", title: "Write your ICP", tool_key: null, status: "pending", sort_order: 2 },
];

describe("resolveStepForRun", () => {
  it("resolves an explicit stepId when the step is still open", () => {
    expect(resolveStepForRun(steps, { stepId: "s2", toolKeys: [] })?.id).toBe("s2");
  });

  it("refuses an explicit stepId that is already completed (no double-complete)", () => {
    expect(resolveStepForRun(steps, { stepId: "s1", toolKeys: ["gtm-strategy"] })).toBeNull();
  });

  it("falls back to matching the first open step by tool key", () => {
    const hit = resolveStepForRun(steps, { toolKeys: ["pitch-generator", "generate-pitch"] });
    expect(hit?.id).toBe("s2");
  });

  it("matches either the catalog slug or the edge tool key", () => {
    const bySlug = resolveStepForRun(steps, { toolKeys: ["pitch-generator"] });
    expect(bySlug?.id).toBe("s2");
  });

  it("returns null when the run's tool matches no open step", () => {
    expect(resolveStepForRun(steps, { toolKeys: ["seo-audit"] })).toBeNull();
    // gtm-strategy step exists but is already completed
    expect(resolveStepForRun(steps, { toolKeys: ["gtm-strategy"] })).toBeNull();
  });

  it("never matches manual steps (tool_key null) by tool key", () => {
    expect(resolveStepForRun(steps, { toolKeys: [""] })).toBeNull();
  });

  it("treats 'done' and 'skipped' as closed statuses", () => {
    const s: MissionLoopStep[] = [
      { id: "a", title: "A", tool_key: "followup", status: "done", sort_order: 0 },
      { id: "b", title: "B", tool_key: "followup", status: "skipped", sort_order: 1 },
      { id: "c", title: "C", tool_key: "followup", status: "in_progress", sort_order: 2 },
    ];
    expect(resolveStepForRun(s, { toolKeys: ["followup"] })?.id).toBe("c");
  });
});

describe("buildRunMomentum", () => {
  it("counts the just-completed step and surfaces the next open step", () => {
    const m = buildRunMomentum("Go to Market", steps, "s2");
    expect(m.stepTitle).toBe("Create your pitch");
    expect(m.completedCount).toBe(2);
    expect(m.totalSteps).toBe(3);
    expect(m.missionCompleted).toBe(false);
    expect(m.nextStep?.id).toBe("s3");
  });

  it("maps the next step's tool_key to its tool route", () => {
    const s: MissionLoopStep[] = [
      { id: "s1", title: "First", tool_key: "gtm-strategy", status: "pending", sort_order: 0 },
      { id: "s2", title: "Second", tool_key: "pitch-generator", status: "pending", sort_order: 1 },
    ];
    const m = buildRunMomentum("Mission", s, "s1");
    expect(m.nextStep?.toolRoute).toBe("/app/launchpad/pitch-generator");
  });

  it("gives a null toolRoute for manual next steps", () => {
    const m = buildRunMomentum("Go to Market", steps, "s2");
    expect(m.nextStep?.toolRoute).toBeNull();
  });

  it("flags the mission complete when the last open step finishes", () => {
    const s: MissionLoopStep[] = [
      { id: "s1", title: "First", tool_key: "gtm-strategy", status: "completed", sort_order: 0 },
      { id: "s2", title: "Last", tool_key: "pitch-generator", status: "pending", sort_order: 1 },
    ];
    const m = buildRunMomentum("Mission", s, "s2");
    expect(m.missionCompleted).toBe(true);
    expect(m.nextStep).toBeNull();
    expect(m.completedCount).toBe(2);
  });
});

describe("extractAndSaveProfileFromFields — learned facts", () => {
  beforeEach(() => localStorage.clear());

  it("returns the facts a run taught Nova", () => {
    const facts = extractAndSaveProfileFromFields({
      startupName: "Acme",
      targetCustomer: "dentists in Texas",
    });
    expect(facts).toContainEqual({ label: "Business name", value: "Acme" });
    expect(facts).toContainEqual({ label: "Target market", value: "dentists in Texas" });
  });

  it("only reports facts that are new or changed", () => {
    extractAndSaveProfileFromFields({ startupName: "Acme" });
    const again = extractAndSaveProfileFromFields({ startupName: "Acme" });
    expect(again).toEqual([]);
    const changed = extractAndSaveProfileFromFields({ startupName: "Acme Corp" });
    expect(changed).toEqual([{ label: "Business name", value: "Acme Corp" }]);
  });
});
