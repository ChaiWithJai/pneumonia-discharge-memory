// THE COMPANION ENGINE (Loop 1) wired through the safety gate (care path) and
// the Facilitator Grader (Loop 2), emitting a trace for the Studio (Loop 4).
// This is the one path every companion utterance takes before a human sees it.

import { careCheck } from "./carepath";
import type { CareSignal } from "./carepath";
import { gradeOrFallback } from "./grader";
import { newTraceId } from "./studio";
import type { Trace } from "./studio";
import { DeterministicVoice } from "./voice";
import type { CompanionContext, CompanionVoice } from "./voice";

export type UtteranceKind = "voice" | "care";

export interface Utterance {
  kind: UtteranceKind;
  text: string;
  trace: Trace;
}

const CARE_INTRO =
  "Before anything else: what you're carrying sounds heavy, and it matters more than any of this. " +
  "Here are people who can help right now.";

/**
 * Produce a graded, care-safe companion utterance for the given context.
 * The order is sacred: care gate first, then voice, then rubric.
 */
export function respond(
  ctx: CompanionContext,
  opts: { voice?: CompanionVoice; careSignal?: CareSignal } = {},
): Utterance {
  const voice = opts.voice ?? new DeterministicVoice();

  const snapshot = {
    emberLevel: ctx.country.emberLevel,
    hush: ctx.country.hush,
    overall: ctx.nourishment.overall,
    season: ctx.country.season,
  };

  // 1) The safety gate — deterministic, first, non-negotiable.
  const care = careCheck({
    text: opts.careSignal?.text,
    hush: ctx.country.hush,
    rest: ctx.country.warmth.rest,
    lapseDays: ctx.lapseDays,
  });
  if (care.routed) {
    const trace: Trace = {
      id: newTraceId(),
      at: Date.now(),
      event: "care",
      snapshot,
      output: CARE_INTRO,
      grade: { pass: true, violations: [] },
      careRouted: true,
    };
    return { kind: "care", text: CARE_INTRO, trace };
  }

  // 2) The voice. 3) The rubric. Failing output never reaches a human.
  const raw = voice.speak(ctx);
  const { text, grade } = gradeOrFallback(raw);
  const trace: Trace = {
    id: newTraceId(),
    at: Date.now(),
    event: ctx.event,
    snapshot,
    output: text,
    grade,
    careRouted: false,
  };
  return { kind: "voice", text, trace };
}
