import { describe, it, expect } from "vitest";
import { PLAYBOOKS, ALL_PLAYBOOKS, selectPlaybook, computePlaybookProgress } from "@/lib/playbooks";

describe("selectPlaybook", () => {
  it("picks the playbook for a known lane", () => {
    expect(selectPlaybook({ lane: "Customer" }).id).toBe("first-customers");
    expect(selectPlaybook({ lane: "Offer" }).id).toBe("build-offer");
    expect(selectPlaybook({ lane: "Systems" }).id).toBe("growth-system");
    expect(selectPlaybook({ lane: "Idea" }).id).toBe("validate-idea");
  });

  it("falls back to a lane via stage when lane is missing", () => {
    expect(selectPlaybook({ stage: "Launch" }).id).toBe("first-customers");
    expect(selectPlaybook({ stage: "Operate" }).id).toBe("growth-system");
    expect(selectPlaybook({ stage: "Validate" }).id).toBe("validate-idea");
  });

  it("defaults to the Idea playbook when nothing is known", () => {
    expect(selectPlaybook({}).id).toBe("validate-idea");
    expect(selectPlaybook({ lane: "nonsense", stage: "nonsense" }).id).toBe("validate-idea");
  });
});

describe("computePlaybookProgress", () => {
  const pb = PLAYBOOKS.Idea;

  it("makes step 1 current with nothing completed", () => {
    const p = computePlaybookProgress(pb, new Set());
    expect(p.completedCount).toBe(0);
    expect(p.percent).toBe(0);
    expect(p.isComplete).toBe(false);
    expect(p.currentStepIndex).toBe(0);
    expect(p.currentStep?.id).toBe(pb.steps[0].id);
    expect(p.steps[0].current).toBe(true);
  });

  it("advances the current step as tools are completed (accepting alias keys)", () => {
    // 'validate-idea' is an alias run-key for the first step ('idea-validator').
    const p = computePlaybookProgress(pb, new Set(["validate-idea"]));
    expect(p.completedCount).toBe(1);
    expect(p.steps[0].done).toBe(true);
    expect(p.currentStep?.id).toBe(pb.steps[1].id);
    expect(p.steps[1].current).toBe(true);
  });

  it("reports completion when every step has a matching run", () => {
    const allKeys = new Set(pb.steps.map((s) => s.toolKeys[0]));
    const p = computePlaybookProgress(pb, allKeys);
    expect(p.isComplete).toBe(true);
    expect(p.percent).toBe(100);
    expect(p.currentStep).toBeNull();
  });
});

describe("playbook data integrity", () => {
  it("every step is well-formed", () => {
    for (const pb of ALL_PLAYBOOKS) {
      expect(pb.steps.length).toBeGreaterThan(0);
      for (const step of pb.steps) {
        expect(step.title.length).toBeGreaterThan(0);
        expect(step.novaQuestion.length).toBeGreaterThan(0);
        expect(step.why.length).toBeGreaterThan(0);
        expect(step.researchFocus.length).toBeGreaterThan(0);
        expect(step.doneWhen.length).toBeGreaterThan(0);
        expect(step.toolKeys.length).toBeGreaterThan(0);
        expect(step.estimatedMinutes).toBeGreaterThan(0);
      }
    }
  });

  it("exposes exactly one playbook per lane", () => {
    expect(Object.keys(PLAYBOOKS).sort()).toEqual(["Customer", "Idea", "Offer", "Systems"]);
    expect(ALL_PLAYBOOKS).toHaveLength(4);
  });
});
