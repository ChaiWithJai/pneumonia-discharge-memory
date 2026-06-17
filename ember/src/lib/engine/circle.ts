// Circle logic — the Woken wake by witnessed practice, never by chance.
// Waking is monotonic: once awake, always awake (the Hush dims their gift, it
// does not unwake them).

import { WOKEN, wokenSpec } from "./blueprint";
import { clamp01 } from "./nourish";
import type { Circle, DailySummary, WokenId, WokenState } from "../types";

const WAKE_THRESHOLD = 1; // ~a few well-lived days in a dimension
const WITNESS_GATE = 0.45; // a dimension must be genuinely lived to count

export function freshWoken(): Record<WokenId, WokenState> {
  const out = {} as Record<WokenId, WokenState>;
  for (const w of WOKEN) out[w.id] = { id: w.id, awake: false, progress: 0 };
  return out;
}

export function freshCircle(): Circle {
  return { triad: [] };
}

export interface WitnessResult {
  woken: Record<WokenId, WokenState>;
  justWoke: WokenId[];
}

/** A day's living stirs the Woken whose dimension was genuinely lived. */
export function witness(
  woken: Record<WokenId, WokenState>,
  summary: DailySummary,
  now: number,
): WitnessResult {
  const next = structuredCloneWoken(woken);
  const justWoke: WokenId[] = [];

  for (const spec of WOKEN) {
    if (!spec.wakeable) continue;
    const v = summary.values[spec.dimension];
    if (v === undefined) continue;
    const lived = clamp01(v) * clamp01(summary.confidence);
    if (lived < WITNESS_GATE) continue;

    const state = next[spec.id];
    if (state.awake) continue;
    state.progress = clamp01(state.progress + lived / 3); // ~3 good days to wake
    if (state.progress >= WAKE_THRESHOLD - 1e-9) {
      state.awake = true;
      state.progress = 1;
      state.wakedAt = now;
      justWoke.push(spec.id);
    }
  }

  return { woken: next, justWoke };
}

/** Up to three awake companions stand with the Ember. */
export function assembleTriad(woken: Record<WokenId, WokenState>): Circle {
  const awake = WOKEN.filter((w) => woken[w.id].awake).map((w) => w.id);
  return { triad: awake.slice(0, 3) };
}

export function awakeCount(woken: Record<WokenId, WokenState>): number {
  return WOKEN.filter((w) => woken[w.id].awake).length;
}

export function wokenName(id: WokenId): string {
  return wokenSpec(id).name;
}

function structuredCloneWoken(
  woken: Record<WokenId, WokenState>,
): Record<WokenId, WokenState> {
  const out = {} as Record<WokenId, WokenState>;
  for (const w of WOKEN) out[w.id] = { ...woken[w.id] };
  return out;
}
