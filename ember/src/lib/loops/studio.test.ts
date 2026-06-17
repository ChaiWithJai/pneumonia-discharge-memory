import { describe, it, expect } from "vitest";
import { pendingCount, toEvalCases, evalJSONL, studioStats } from "./studio";
import type { Trace } from "./studio";

function trace(over: Partial<Trace>): Trace {
  return {
    id: over.id ?? "t1",
    at: 0,
    event: "daily",
    snapshot: { emberLevel: 0.5, hush: 0, overall: 0.5, season: "bright" },
    output: "a warm line",
    grade: { pass: true, violations: [] },
    careRouted: false,
    ...over,
  };
}

describe("Loop 4 — the growing eval set", () => {
  it("counts pending (unreviewed) traces", () => {
    expect(pendingCount([trace({ reviewed: false }), trace({ id: "t2", reviewed: true })])).toBe(1);
  });

  it("turns labeled / rubric-failed / care-routed traces into eval cases (others have no signal)", () => {
    const cases = toEvalCases([
      trace({ id: "ok", reviewed: true }), // passes, unlabeled -> no signal, no case
      trace({ id: "good", label: "good" }),
      trace({ id: "bad-op", label: "bad" }),
      trace({ id: "fail", grade: { pass: false, violations: [{ rule: "no-streak-debt", snippet: "streak" }] } }),
      trace({ id: "care", careRouted: true, event: "care" }),
    ]);
    const byId = Object.fromEntries(cases.map((c) => [c.id, c]));
    expect(cases.length).toBe(4);
    expect(byId["ok"]).toBeUndefined();
    expect(byId["good"].expected).toBe("good");
    expect(byId["good"].source).toBe("operator");
    expect(byId["bad-op"].expected).toBe("bad");
    expect(byId["fail"]).toMatchObject({ expected: "bad", source: "rubric" });
    expect(byId["care"]).toMatchObject({ expected: "good", source: "care" });
  });

  it("emits valid JSONL", () => {
    const jsonl = evalJSONL([trace({ id: "x", label: "good" })]);
    const rows = jsonl.split("\n").filter(Boolean).map((l) => JSON.parse(l));
    expect(rows).toHaveLength(1);
    expect(rows[0].expected).toBe("good");
  });

  it("stats compute pass rate and care-routed count", () => {
    const s = studioStats([trace({}), trace({ id: "f", grade: { pass: false, violations: [] } })]);
    expect(s.total).toBe(2);
    expect(s.passRate).toBe(0.5);
  });
});
