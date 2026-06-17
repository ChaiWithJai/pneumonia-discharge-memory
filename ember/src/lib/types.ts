// Ember domain types. The engine is pure and deterministic; these are its
// contracts. Vocabulary is locked to the world bible: the Inner Country, the
// Witness, the Loom, the Circle, the Woken, the Hush, Seasons.

/** The five ways living shows up — each is a region/valley of the Inner Country. */
export type Dimension = "breath" | "rest" | "movement" | "attention" | "connection";

export const DIMENSIONS: Dimension[] = [
  "breath",
  "rest",
  "movement",
  "attention",
  "connection",
];

export type TemperamentId = "seer" | "wright" | "root" | "ferry";
export type WokenId =
  | "bellows"
  | "hearthkeeper"
  | "strider"
  | "lamplighter"
  | "kin"
  | "wisp";

export type Season = "kindling" | "bright" | "waning" | "winter";

/**
 * The normalized ingestion unit (ADR-0002). Every producer — provider OAuth,
 * manual UI, CLI, admin batch — converges on this shape. `values` are
 * baseline-relative 0..1 ("how well this dimension was lived"); a producer may
 * supply a partial set.
 */
export interface DailySummary {
  day: string; // ISO date (YYYY-MM-DD)
  source: string; // "simulated" | "oura" | "whoop" | "manual" | "cli" | ...
  values: Partial<Record<Dimension, number>>;
  confidence: number; // 0..1
  at: number; // epoch ms the summary entered the Witness
}

/** What the Witness made of recent living — never a verdict, just recognition. */
export interface NourishmentScore {
  byDimension: Record<Dimension, number>;
  overall: number;
  confidence: number;
}

/** The living world state, woven by the Loom. */
export interface CountryState {
  warmth: Record<Dimension, number>; // 0..1 brightness per region
  emberLevel: number; // 0..1, floored — the ember can dim but never die
  season: Season;
  hush: number; // 0..1 derived greyness from time untended
  dayCount: number; // days since the ember was kindled
  lastNourishedAt: number; // epoch ms
  lastTickAt: number; // epoch ms
  lifetimeLight: number; // monotonic; the Hush never reduces this
}

/** Your Ember — the being you tend. */
export interface Ember {
  id: string;
  name: string;
  temperament: TemperamentId;
  seed: number; // locks visual identity
  bornAt: number;
}

export interface WokenState {
  id: WokenId;
  awake: boolean;
  progress: number; // 0..1 toward waking
  wakedAt?: number;
}

export interface Circle {
  triad: WokenId[]; // up to 3 awake companions standing with the Ember
}

export interface DexEntry {
  day: string;
  source: string;
  values: Partial<Record<Dimension, number>>;
  lightDelta: number; // how much the country brightened that day
  note?: string;
}

/** A practice from the Kindling library — fuel that wakes the Woken. */
export interface Practice {
  id: string;
  name: string;
  dimension: Dimension;
  wakes: WokenId;
  durationSec: number;
  blurb: string;
}

/** Persisted shape of an Ember save (the local dex + state). */
export interface EmberSave {
  version: 1;
  ember: Ember;
  country: CountryState;
  woken: Record<WokenId, WokenState>;
  circle: Circle;
  dex: DexEntry[];
  summaries: DailySummary[];
  lastHarvest?: string;
  settings: Settings;
}

export interface Settings {
  sensing: Record<Dimension, boolean>; // the Witness toggles (the Ledger)
  nudgesEnabled: boolean; // user-scheduled traction prompts only
}
