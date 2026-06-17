// The Loom — turns sensed living into the Inner Country's brightness, season,
// and Hush. Pure and deterministic. Two invariants are sacred:
//   1. The ember can dim but NEVER dies (emberLevel >= EMBER_FLOOR, always).
//   2. Growth is monotonic — the Hush never reduces lifetimeLight or unwakes.

import { DIMENSIONS } from "../types";
import type { CountryState, DailySummary, Dimension, Season } from "../types";
import { clamp01, zeroDimensions } from "./nourish";

export const EMBER_FLOOR = 0.08; // the vow, in a number
const INGEST_GAIN = 0.4; // how fast a day's living warms its region
const GRACE_HOURS = 20; // a full day of grace before any Hush
const HUSH_SPAN_HOURS = 14 * 24; // greys over ~two weeks, then steady
const DECAY_PER_DAY = 0.12; // gentle warmth drift while untended
const HUSH_FLOOR = 0.06; // regions rest this low, never to zero
const SEASON_LEN_DAYS = 7;
const SEASON_ORDER: Season[] = ["kindling", "bright", "waning", "winter"];

export function freshCountry(now: number): CountryState {
  return {
    warmth: zeroDimensions(),
    emberLevel: EMBER_FLOOR,
    season: "kindling",
    hush: 0,
    dayCount: 0,
    lastNourishedAt: now,
    lastTickAt: now,
    lifetimeLight: 0,
  };
}

function meanWarmth(warmth: Record<Dimension, number>): number {
  let s = 0;
  for (const d of DIMENSIONS) s += warmth[d];
  return s / DIMENSIONS.length;
}

function seasonFor(dayCount: number): Season {
  return SEASON_ORDER[Math.floor(dayCount / SEASON_LEN_DAYS) % SEASON_ORDER.length];
}

/** A day's living arrives. Warms the lived regions and resets the Hush clock. */
export function ingest(country: CountryState, summary: DailySummary, now: number): CountryState {
  const warmth = { ...country.warmth };
  let gained = 0;
  for (const d of DIMENSIONS) {
    const v = summary.values[d];
    if (v === undefined) continue;
    const target = clamp01(v) * clamp01(summary.confidence) + warmth[d] * (1 - clamp01(summary.confidence));
    const before = warmth[d];
    warmth[d] = clamp01(before + (clamp01(target) - before) * INGEST_GAIN);
    gained += Math.max(0, warmth[d] - before);
  }
  const emberLevel = Math.max(EMBER_FLOOR, meanWarmth(warmth));
  return {
    ...country,
    warmth,
    emberLevel,
    hush: 0,
    lastNourishedAt: now,
    lastTickAt: now,
    lifetimeLight: country.lifetimeLight + gained, // monotonic
  };
}

/**
 * Time passes. If untended past the grace window, regions gently drift toward
 * rest and the Hush rises — but the ember is always floored, and lifetimeLight
 * is never touched.
 */
export function tick(country: CountryState, now: number): CountryState {
  const dtHours = Math.max(0, (now - country.lastTickAt) / 3_600_000);
  const idleHours = Math.max(0, (now - country.lastNourishedAt) / 3_600_000);

  let warmth = country.warmth;
  if (idleHours > GRACE_HOURS && dtHours > 0) {
    const decayDays = (dtHours / 24);
    const factor = Math.exp(-DECAY_PER_DAY * decayDays);
    const next = { ...warmth };
    for (const d of DIMENSIONS) {
      next[d] = HUSH_FLOOR + (next[d] - HUSH_FLOOR) * factor;
      if (next[d] < HUSH_FLOOR) next[d] = HUSH_FLOOR;
    }
    warmth = next;
  }

  const hush = clamp01((idleHours - GRACE_HOURS) / HUSH_SPAN_HOURS);
  const emberLevel = Math.max(EMBER_FLOOR, meanWarmth(warmth));

  return {
    ...country,
    warmth,
    emberLevel,
    hush,
    season: seasonFor(country.dayCount),
    lastTickAt: now,
  };
}

export interface OvernightResult {
  country: CountryState;
  harvest?: string; // the Hearthkeeper's dawn idea, if rest was kept
}

const HARVEST_LINES = [
  "What if the thing you've been avoiding is smaller than the avoiding?",
  "You don't have to carry tomorrow today.",
  "The walk you keep postponing is the one your country is asking for.",
  "Rest counted. It always counts.",
  "Notice who you reached for this week. Reach again.",
  "The ember was never the thing at risk. You knew that.",
  "Steadiness is a skill, and you practiced it.",
  "One slow breath is a complete act. Nothing more is owed.",
];

/** The overnight pass: a new day, a turned season, and maybe a harvested idea. */
export function overnightPass(
  country: CountryState,
  hearthkeeperAwake: boolean,
  now: number,
): OvernightResult {
  const dayCount = country.dayCount + 1;
  const next: CountryState = {
    ...country,
    dayCount,
    season: seasonFor(dayCount),
    lastTickAt: now,
  };
  let harvest: string | undefined;
  if (hearthkeeperAwake && country.warmth.rest > 0.3) {
    const idx = (country.dayCount + Math.round(country.warmth.rest * 7)) % HARVEST_LINES.length;
    harvest = HARVEST_LINES[idx];
  }
  return { country: next, harvest };
}
