// The canon as data — the blueprint seam (mirrors factory.blueprint_specs()).
// Add temperaments / Woken / practices here; the engine never changes.

import type {
  Dimension,
  Practice,
  Season,
  TemperamentId,
  WokenId,
} from "../types";

export interface TemperamentSpec {
  id: TemperamentId;
  name: string;
  selfPortrait: string; // "this is how you already meet the world"
  genius: string;
  blindSpot: string;
  accent: string; // hex, tints the Inner Country
  available: boolean; // MVP ships Root + Seer
}

export const TEMPERAMENTS: TemperamentSpec[] = [
  {
    id: "root",
    name: "Root",
    selfPortrait: "You meet the world by staying. Steady, grounded, present.",
    genius: "Resilience — you hold when others scatter.",
    blindSpot: "You can mistake stillness for safety and root too long.",
    accent: "#e0894a",
    available: true,
  },
  {
    id: "seer",
    name: "Seer",
    selfPortrait: "You meet the world by noticing. Aware, attentive, awake.",
    genius: "Insight — you see the weather before it lands.",
    blindSpot: "You can watch your life instead of living it.",
    accent: "#6fb2c9",
    available: true,
  },
  {
    id: "wright",
    name: "Wright",
    selfPortrait: "You meet the world by making. Builder, shaper, doer.",
    genius: "Momentum — you turn intention into form.",
    blindSpot: "You can build past your own need for rest.",
    accent: "#c98fb0",
    available: false,
  },
  {
    id: "ferry",
    name: "Ferry",
    selfPortrait: "You meet the world by carrying others across.",
    genius: "Connection — you hold the bonds that hold people.",
    blindSpot: "You can ferry everyone but yourself.",
    accent: "#8fae6a",
    available: false,
  },
];

export interface WokenSpec {
  id: WokenId;
  name: string;
  dimension: Dimension; // the living that wakes it
  wakes: string; // the practice that wakes it (plain language)
  gift: string; // the tool it lends your Ember
  shadow: string; // what sleeps when it dims
  wakeable: boolean; // MVP: bellows, strider, hearthkeeper
  comingSoon?: string; // why it isn't wakeable yet
}

export const WOKEN: WokenSpec[] = [
  {
    id: "bellows",
    name: "the Bellows",
    dimension: "breath",
    wakes: "a true, slow breath",
    gift: "It feeds the ember air — your Ember steadies under pressure.",
    shadow: "Without it, storms knock the wind out of the country.",
    wakeable: true,
  },
  {
    id: "strider",
    name: "the Strider",
    dimension: "movement",
    wakes: "real movement — a walk, a run, a lift",
    gift: "It carries your Ember further; the country opens new ground.",
    shadow: "Without it, the far valleys stay unwalked.",
    wakeable: true,
  },
  {
    id: "hearthkeeper",
    name: "the Hearthkeeper",
    dimension: "rest",
    wakes: "real rest — a night well slept",
    gift: "It harvests dreams — a new idea waits for you at dawn.",
    shadow: "Without it, mornings arrive empty.",
    wakeable: true,
  },
  {
    id: "lamplighter",
    name: "the Lamplighter",
    dimension: "attention",
    wakes: "a held moment of stillness",
    gift: "It lights the lamps — you see your country clearly.",
    shadow: "Without it, the edges blur.",
    wakeable: false,
    comingSoon: "Wakes with the stillness signal — arriving soon.",
  },
  {
    id: "kin",
    name: "the Kin",
    dimension: "connection",
    wakes: "reaching for someone who matters",
    gift: "It binds Hearths — warmth flows both ways.",
    shadow: "Without it, the country tends alone.",
    wakeable: false,
    comingSoon: "Wakes in the Commons — arriving in a later season.",
  },
  {
    id: "wisp",
    name: "the Wisp",
    dimension: "attention",
    wakes: "tending across many parts of your life",
    gift: "It wanders ahead and finds what's next.",
    shadow: "Without it, the country forgets to wonder.",
    wakeable: false,
    comingSoon: "Wakes when the whole country is tended — arriving soon.",
  },
];

export const PRACTICES: Practice[] = [
  {
    id: "slow-breath",
    name: "One slow breath",
    dimension: "breath",
    wakes: "bellows",
    durationSec: 60,
    blurb: "A single, sensed breath. The lowest-cost way to tend.",
  },
  {
    id: "resonance",
    name: "Resonant breathing",
    dimension: "breath",
    wakes: "bellows",
    durationSec: 180,
    blurb: "Six breaths a minute — the body's own calm frequency.",
  },
  {
    id: "walk",
    name: "A walk outside",
    dimension: "movement",
    wakes: "strider",
    durationSec: 600,
    blurb: "Movement is fuel. The Strider stirs when you go.",
  },
  {
    id: "wind-down",
    name: "Wind-down",
    dimension: "rest",
    wakes: "hearthkeeper",
    durationSec: 300,
    blurb: "Let the day set. The Hearthkeeper harvests what sleep makes.",
  },
  {
    id: "stillness",
    name: "A held stillness",
    dimension: "attention",
    wakes: "lamplighter",
    durationSec: 120,
    blurb: "Hold one moment. The lamps come up.",
  },
  {
    id: "reach-out",
    name: "Reach for someone",
    dimension: "connection",
    wakes: "kin",
    durationSec: 60,
    blurb: "A message, a call. The Kin stirs on both sides.",
  },
];

export interface DimensionMeta {
  id: Dimension;
  label: string;
  region: string; // the name of its valley in the country
  color: string; // base hue when lit
  description: string;
}

export const DIMENSION_META: Record<Dimension, DimensionMeta> = {
  breath: {
    id: "breath",
    label: "Breath",
    region: "the Wind Vale",
    color: "#7fc8d6",
    description: "How your breath moved through the day.",
  },
  rest: {
    id: "rest",
    label: "Rest",
    region: "the Still Hollow",
    color: "#9a8fd0",
    description: "How the night held you.",
  },
  movement: {
    id: "movement",
    label: "Movement",
    region: "the Open Ground",
    color: "#e0a14a",
    description: "How far you carried yourself.",
  },
  attention: {
    id: "attention",
    label: "Attention",
    region: "the Lamplit Ridge",
    color: "#e6cf7a",
    description: "How present you stayed.",
  },
  connection: {
    id: "connection",
    label: "Connection",
    region: "the Kindred Shore",
    color: "#d98fa0",
    description: "How you reached for others.",
  },
};

export interface SeasonMeta {
  id: Season;
  label: string;
  mood: string;
  sky: [string, string]; // gradient top → bottom
}

export const SEASON_META: Record<Season, SeasonMeta> = {
  kindling: {
    id: "kindling",
    label: "Kindling",
    mood: "Something is beginning.",
    sky: ["#2a1d33", "#6a3b46"],
  },
  bright: {
    id: "bright",
    label: "Bright",
    mood: "The country is awake.",
    sky: ["#1e3a4a", "#3f7c8c"],
  },
  waning: {
    id: "waning",
    label: "Waning",
    mood: "The light leans low and golden.",
    sky: ["#3a2740", "#7a5a3a"],
  },
  winter: {
    id: "winter",
    label: "Winter",
    mood: "The country rests. The ember holds.",
    sky: ["#161427", "#2c3550"],
  },
};

export function temperament(id: TemperamentId): TemperamentSpec {
  return TEMPERAMENTS.find((t) => t.id === id) ?? TEMPERAMENTS[0];
}

export function wokenSpec(id: WokenId): WokenSpec {
  return WOKEN.find((w) => w.id === id) ?? WOKEN[0];
}
