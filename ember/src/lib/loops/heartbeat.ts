// LOOP 3 — THE HEARTBEAT (event-driven). What makes Ember ambient: the passage
// of time and the rollover of days drive world-updates (overnight dream-harvest,
// the Hush deepening, the Return becoming due). The Indistractable guardrail is
// load-bearing: the Heartbeat updates the WORLD, it never sends a notification.
//
// This is the pure decision; the store applies it (overnight passes + tick) on
// boot, on a gentle in-session interval, and on dev time-travel.

import type { CountryState } from "../types";

const DAY = 86_400_000;
const RETURN_THRESHOLD_DAYS = 1.5;
const MAX_OVERNIGHT_CATCHUP = 7; // bound the catch-up so a long absence is calm

export interface HeartbeatDecision {
  /** How many overnight passes are due (bounded) — each may harvest a dream. */
  overnightDays: number;
  /** Has enough time passed that re-entry should be the Return (D2)? */
  lapsed: boolean;
  lapseDays: number;
}

export function decideHeartbeat(country: CountryState, now: number): HeartbeatDecision {
  const lapseDays = Math.max(0, (now - country.lastTickAt) / DAY);
  return {
    overnightDays: Math.min(MAX_OVERNIGHT_CATCHUP, Math.floor(lapseDays)),
    lapsed: lapseDays >= RETURN_THRESHOLD_DAYS,
    lapseDays,
  };
}
