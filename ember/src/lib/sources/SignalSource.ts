// The Witness's sources, behind one interface (the dependency-inversion seam
// from the spec). v1 is passive: a source yields normalized DailySummary rows.
// Providers (Oura/Whoop), manual input, and the CLI are all just producers.

import type { DailySummary } from "../types";

export interface SignalSource {
  id: string;
  label: string;
  kind: "passive" | "live" | "manual";
  /** Is this source usable right now? (Mirrors the repo's `available()` idiom.) */
  available(): boolean;
  /** A short, honest description of what it senses (shown at the trust gate). */
  describe(): string;
}

/** A source that can backfill recent history and produce "today". */
export interface PassiveSource extends SignalSource {
  kind: "passive";
  history(days: number, now: number): DailySummary[];
  today(now: number): DailySummary;
}
