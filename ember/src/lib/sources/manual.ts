// The manual / CLI producer (ADR-0002): a person tells the Witness directly.
// Deliberately lower-confidence than a sensed signal, and never the mainstream.

import type { DailySummary, Dimension } from "../types";

export function manualSummary(
  values: Partial<Record<Dimension, number>>,
  now: number,
  source = "manual",
): DailySummary {
  return {
    day: new Date(now).toISOString().slice(0, 10),
    source,
    values,
    confidence: 0.6,
    at: now,
  };
}

/** A practice the user actually did (the Kindling fuel) — high confidence. */
export function practiceSummary(dimension: Dimension, now: number): DailySummary {
  return {
    day: new Date(now).toISOString().slice(0, 10),
    source: "practice",
    values: { [dimension]: 0.85 },
    confidence: 0.95,
    at: now,
  };
}
