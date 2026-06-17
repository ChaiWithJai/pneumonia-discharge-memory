// Pure: recent living -> a NourishmentScore. Recency-weighted, never a verdict.

import { DIMENSIONS } from "../types";
import type { DailySummary, Dimension, NourishmentScore } from "../types";

export function zeroDimensions(): Record<Dimension, number> {
  return { breath: 0, rest: 0, movement: 0, attention: 0, connection: 0 };
}

const WINDOW_DAYS = 7;
const HALF_LIFE_DAYS = 2.5; // recent days weigh more

/**
 * Summarize recent summaries into per-dimension nourishment in [0,1].
 * Deterministic: depends only on the summaries and `now`.
 */
export function summarize(summaries: DailySummary[], now: number): NourishmentScore {
  const cutoff = now - WINDOW_DAYS * 86_400_000;
  const recent = summaries.filter((s) => s.at >= cutoff);

  const sum = zeroDimensions();
  const weight = zeroDimensions();
  let confNum = 0;
  let confDen = 0;

  for (const s of recent) {
    const ageDays = Math.max(0, (now - s.at) / 86_400_000);
    const w = Math.pow(0.5, ageDays / HALF_LIFE_DAYS) * clamp01(s.confidence);
    for (const d of DIMENSIONS) {
      const v = s.values[d];
      if (v === undefined) continue;
      sum[d] += clamp01(v) * w;
      weight[d] += w;
    }
    confNum += clamp01(s.confidence) * Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
    confDen += Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
  }

  const byDimension = zeroDimensions();
  let overallNum = 0;
  let overallDen = 0;
  for (const d of DIMENSIONS) {
    byDimension[d] = weight[d] > 0 ? sum[d] / weight[d] : 0;
    if (weight[d] > 0) {
      overallNum += byDimension[d];
      overallDen += 1;
    }
  }

  return {
    byDimension,
    overall: overallDen > 0 ? overallNum / overallDen : 0,
    confidence: confDen > 0 ? confNum / confDen : 0,
  };
}

export function clamp01(x: number): number {
  if (Number.isNaN(x)) return 0;
  return x < 0 ? 0 : x > 1 ? 1 : x;
}
