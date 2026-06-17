// A deterministic stand-in for a real wearable (Oura/Whoop) so Ember runs and
// feels alive fully locally. Swappable for OuraSource/WhoopSource behind the
// same PassiveSource interface — the engine never knows the difference.

import type { DailySummary, Dimension } from "../types";
import type { PassiveSource } from "./SignalSource";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY = 86_400_000;

export class SimulatedSource implements PassiveSource {
  id = "simulated";
  label = "Simulated wearable";
  kind = "passive" as const;
  constructor(private seed = 7) {}

  available() {
    return true;
  }

  describe() {
    return "A gentle stand-in for a worn device — recovery, rest, and movement, generated so Ember works without hardware.";
  }

  today(now: number): DailySummary {
    const dayIndex = Math.floor(now / DAY);
    return this.day(dayIndex, now);
  }

  history(days: number, now: number): DailySummary[] {
    const out: DailySummary[] = [];
    const todayIndex = Math.floor(now / DAY);
    for (let i = days - 1; i >= 0; i--) {
      const idx = todayIndex - i;
      out.push(this.day(idx, now - i * DAY));
    }
    return out;
  }

  private day(dayIndex: number, at: number): DailySummary {
    const rnd = mulberry32(this.seed + dayIndex * 2654435761);
    // a slow weekly rhythm + daily noise, so the country breathes over time
    const base = 0.45 + 0.25 * Math.sin((dayIndex / 7) * Math.PI * 2);
    const v = (jitter: number): number =>
      Math.max(0, Math.min(1, base + (rnd() - 0.5) * jitter));
    const values: Partial<Record<Dimension, number>> = {
      rest: v(0.4),
      movement: v(0.6),
      breath: v(0.35),
      attention: v(0.5),
    };
    return {
      day: new Date(at).toISOString().slice(0, 10),
      source: this.id,
      values,
      confidence: 0.9,
      at,
    };
  }
}
