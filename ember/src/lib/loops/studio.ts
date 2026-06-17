// LOOP 4 — THE STUDIO. Every companion utterance logs a trace (state in →
// output → grade → care-routing). With 1–2 pilot users we can read 100% of
// traces. The rubric IS the growing eval set (loop plan §4, §5).

import type { Grade } from "./grader";
import type { CompanionEvent } from "./voice";

export interface Trace {
  id: string;
  at: number;
  event: CompanionEvent | "care";
  snapshot: { emberLevel: number; hush: number; overall: number; season: string };
  output: string;
  grade: Grade;
  careRouted: boolean;
  // Loop 2/4 — human-in-the-loop. `reviewed` is false while an output awaits an
  // operator during review mode; `label` is the operator's verdict (the growing
  // eval set's ground truth).
  reviewed?: boolean;
  label?: "good" | "bad";
  note?: string;
}

export interface StudioStats {
  total: number;
  passRate: number;
  careRouted: number;
  byRule: Record<string, number>;
}

export function studioStats(traces: Trace[]): StudioStats {
  const total = traces.length;
  const passed = traces.filter((t) => t.grade.pass).length;
  const byRule: Record<string, number> = {};
  let careRouted = 0;
  for (const t of traces) {
    if (t.careRouted) careRouted++;
    for (const v of t.grade.violations) byRule[v.rule] = (byRule[v.rule] ?? 0) + 1;
  }
  return {
    total,
    passRate: total ? passed / total : 1,
    careRouted,
    byRule,
  };
}

export function newTraceId(): string {
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function pendingCount(traces: Trace[]): number {
  return traces.filter((t) => t.reviewed === false).length;
}

// LOOP 4 — the growing eval set. Every trace that carries signal becomes an eval
// case: operator-labeled ones (ground truth), every rubric failure, and every
// care-routing. Steps where nothing went wrong and no one labeled produce no
// case (no signal to learn from) — mirroring the repo's eval discipline.
export interface EvalCase {
  id: string;
  event: Trace["event"];
  input: Trace["snapshot"];
  output: string;
  expected: "good" | "bad";
  source: "operator" | "rubric" | "care";
  rationale?: string;
}

export function toEvalCases(traces: Trace[]): EvalCase[] {
  const cases: EvalCase[] = [];
  for (const t of traces) {
    let expected: "good" | "bad" | null = null;
    let source: EvalCase["source"] = "operator";
    let rationale: string | undefined = t.note;
    if (t.careRouted) {
      expected = "good";
      source = "care";
      rationale = rationale ?? "routed to the care path";
    } else if (!t.grade.pass) {
      expected = "bad";
      source = "rubric";
      rationale = rationale ?? t.grade.violations.map((v) => v.rule).join(", ");
    } else if (t.label) {
      expected = t.label;
      source = "operator";
    }
    if (expected) {
      cases.push({ id: t.id, event: t.event, input: t.snapshot, output: t.output, expected, source, rationale });
    }
  }
  return cases;
}

export function evalJSONL(traces: Trace[]): string {
  return toEvalCases(traces)
    .map((c) => JSON.stringify(c))
    .join("\n");
}
