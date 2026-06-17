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
