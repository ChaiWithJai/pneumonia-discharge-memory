// The Companion Engine's voice (Loop 1, agent loop). Offline-first: a
// deterministic, rubric-compliant voice ships today; an LLM voice (Claude) can
// be swapped behind the same interface later without touching the loops.

import type { CountryState, NourishmentScore, TemperamentId, WokenId } from "../types";
import { DIMENSION_META, wokenSpec } from "../engine/blueprint";

export type CompanionEvent =
  | "first-breath"
  | "return"
  | "daily"
  | "witness"
  | "kindle"
  | "storm";

export interface CompanionContext {
  event: CompanionEvent;
  temperament: TemperamentId;
  emberName: string;
  country: CountryState;
  nourishment: NourishmentScore;
  justWoke: WokenId[];
  lapseDays: number;
  harvest?: string;
}

export interface CompanionVoice {
  id: string;
  available(): boolean;
  speak(ctx: CompanionContext): string;
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(Math.floor(seed)) % arr.length];
}

function brightestDimension(n: NourishmentScore): string {
  let best: keyof NourishmentScore["byDimension"] | null = null;
  let bestV = -1;
  for (const d of Object.keys(n.byDimension) as (keyof NourishmentScore["byDimension"])[]) {
    if (n.byDimension[d] > bestV) {
      bestV = n.byDimension[d];
      best = d;
    }
  }
  return best ? DIMENSION_META[best].region : "the country";
}

const TEMPERAMENT_TONE: Record<TemperamentId, string> = {
  root: "steady",
  seer: "watchful",
  wright: "making",
  ferry: "carrying",
};

/** The always-available deterministic voice. Every line is rubric-safe by design. */
export class DeterministicVoice implements CompanionVoice {
  id = "deterministic";
  available() {
    return true;
  }

  speak(ctx: CompanionContext): string {
    const seed =
      ctx.country.dayCount + Math.round(ctx.country.emberLevel * 100) + ctx.justWoke.length;
    const name = ctx.emberName || "your ember";

    switch (ctx.event) {
      case "first-breath":
        return pick(
          [
            `There. ${name} caught. One breath was enough to begin.`,
            `Feel that? The first valley warmed. ${name} is alight.`,
            `That breath landed. ${name} is here now, and so are you.`,
          ],
          seed,
        );

      case "return": {
        const long = ctx.lapseDays >= 7;
        if (long)
          return pick(
            [
              `Welcome back. ${name} held the whole time — it was always going to. Sit a moment; the warmth returns on its own.`,
              `You're here. Nothing was lost while you were away. ${name} kept the smallest light, and it's glad you came.`,
              `However long it's been, the ember stayed. Take one slow breath with me, and the country remembers.`,
            ],
            seed,
          );
        return pick(
          [
            `Welcome back. ${name} kept the light. Begin again whenever you're ready.`,
            `Good to see you. Nothing to make up — just this breath, just now.`,
            `You returned, and that's the whole of it. ${name} is steady.`,
          ],
          seed,
        );
      }

      case "witness": {
        const region = brightestDimension(ctx.nourishment);
        return pick(
          [
            `Today, ${region} grew a little brighter. That came from how you lived — not from anything you tapped.`,
            `The Witness noticed ${region} warming. ${name} feels it.`,
            `${region} answered to your living today. Nothing more was asked.`,
          ],
          seed,
        );
      }

      case "kindle":
        return pick(
          [
            `That's enough for now. ${name} is warm; the rest can wait. Go live — I'll be here.`,
            `What lit today, lit. Carry the calm out with you.`,
            `A good place to close. ${name} holds the warmth until you return.`,
          ],
          seed,
        );

      case "storm":
        return pick(
          [
            `Hard day. ${name} pulled the crew close — you don't have to steady this alone.`,
            `The weather is heavy, and that's allowed. The country bends; it doesn't break. Breathe with me.`,
            `When it's like this, the only task is to stay. ${name} is staying with you.`,
          ],
          seed,
        );

      case "daily":
      default: {
        if (ctx.harvest) return ctx.harvest;
        const tone = TEMPERAMENT_TONE[ctx.temperament];
        return pick(
          [
            `${name} is ${tone} this morning. The country is yours to wander.`,
            `A quiet day in the country. ${name} is here when you want it.`,
            `Nothing is owed today. Tend if you like, or simply visit.`,
          ],
          seed,
        );
      }
    }
  }
}
