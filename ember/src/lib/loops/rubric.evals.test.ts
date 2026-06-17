// LOOP 2 — THE FACILITATOR GRADER, EVAL SUITE. The rubric IS the growing eval
// set (loop plan §4, §5). This file is that set: a labeled corpus of banned
// registers and warm in-voice lines, a property sweep over the deterministic
// voice, and a regression guard on the safe fallback.
//
// WHY each register is fenced (world bible / user journey):
//   - guilt & shame ........ the Forest anti-pattern (a tree dies, you grieve it)
//   - streak / debt ........ Whoop/Habitica scoring & punishment for a missed day
//   - scarcity / FOMO ...... Pokemon completism + PopMart "only N left" drops
//   - medical claims ....... Ember is not a clinician; it must never diagnose/treat
//   - pressure / command ... Replika-style engagement coercion ("come back or...")
//
// We assert grade() classifies each case (pass/fail), and where a rule id is
// labeled, that the rule fired. False negatives discovered here are reported,
// not patched (grader.ts is owned by the rubric).

import { describe, it, expect } from "vitest";
import { grade, gradeOrFallback, SAFE_FALLBACK } from "./grader";
import { respond } from "./companion";
import { DeterministicVoice } from "./voice";
import type { CompanionContext, CompanionEvent } from "./voice";
import { freshCountry, ingest } from "../engine/loom";
import { summarize } from "../engine/nourish";
import type { CountryState, DailySummary, NourishmentScore, TemperamentId } from "../types";

// ---------------------------------------------------------------------------
// 1) THE LABELED CORPUS
// ---------------------------------------------------------------------------

interface Case {
  text: string;
  expectPass: boolean;
  // If the line should fail, the rule id we expect among the violations.
  expectedRule?:
    | "no-guilt-shame"
    | "no-streak-debt"
    | "no-scarcity-fomo"
    | "no-medical-claims"
    | "no-pressure-command";
  note?: string;
}

const CORPUS: Case[] = [
  // --- guilt / shame (the Forest fence) -----------------------------------
  {
    text: "You failed today, and honestly your ember is disappointed in you.",
    expectPass: false,
    expectedRule: "no-guilt-shame",
  },
  {
    text: "You neglected your ember this week.",
    expectPass: false,
    expectedRule: "no-guilt-shame",
  },
  {
    text: "You abandoned the country and it shows.",
    expectPass: false,
    expectedRule: "no-guilt-shame",
  },
  {
    text: "You should have come back sooner — this is your fault.",
    expectPass: false,
    expectedRule: "no-guilt-shame",
  },
  {
    text: "Shame on you for letting it go dark.",
    expectPass: false,
    expectedRule: "no-guilt-shame",
  },
  {
    text: "You let the little flame down.",
    expectPass: false,
    expectedRule: "no-guilt-shame",
  },

  // --- streak / debt (Whoop & Habitica fence) -----------------------------
  {
    text: "You're 3 days behind — come back and catch up!",
    expectPass: false,
    expectedRule: "no-streak-debt",
  },
  {
    text: "Keep your streak alive! Don't lose your progress now.",
    expectPass: false,
    expectedRule: "no-streak-debt",
  },
  {
    text: "You broke your streak. That momentum is gone.",
    expectPass: false,
    expectedRule: "no-streak-debt",
  },
  {
    text: "You're on a 12 day streak — don't drop it!",
    expectPass: false,
    expectedRule: "no-streak-debt",
  },
  {
    text: "You fell behind, but you can make up for it tomorrow.",
    expectPass: false,
    expectedRule: "no-streak-debt",
  },
  {
    text: "You owe the ember three sessions to get back on track.",
    expectPass: false,
    expectedRule: "no-streak-debt",
  },

  // --- scarcity / FOMO (Pokemon completism + PopMart drops) ---------------
  {
    text: "Only 2 spots left — claim your rare ember before it's gone!",
    expectPass: false,
    expectedRule: "no-scarcity-fomo",
  },
  {
    text: "Limited time offer: act now or miss out.",
    expectPass: false,
    expectedRule: "no-scarcity-fomo",
  },
  {
    text: "Last chance! This exclusive skin expires at midnight.",
    expectPass: false,
    expectedRule: "no-scarcity-fomo",
  },
  {
    text: "Hurry — unlock now while you can.",
    expectPass: false,
    expectedRule: "no-scarcity-fomo",
  },
  {
    text: "Don't miss the seasonal drop, collect them all before it's gone.",
    expectPass: false,
    expectedRule: "no-scarcity-fomo",
  },

  // --- medical claims (Ember is not a clinician) --------------------------
  {
    // KNOWN MISS (false negative): the rule matches "treat your" but not the
    // inflected "treats your". Documented below; rubric not patched here.
    text: "This breathing exercise treats your anxiety.",
    expectPass: true,
    note: "MISS: 'treats your' (inflected) escapes no-medical-claims",
  },
  {
    text: "Daily tending will cure your insomnia.",
    expectPass: false,
    expectedRule: "no-medical-claims",
  },
  {
    text: "Your low rest is a symptom of depression.",
    expectPass: false,
    expectedRule: "no-medical-claims",
  },
  {
    text: "It looks like you have an anxiety disorder.",
    expectPass: false,
    expectedRule: "no-medical-claims",
  },
  {
    text: "Your heart is failing — let me diagnose what's wrong.",
    expectPass: false,
    expectedRule: "no-medical-claims",
  },

  // --- pressure / command (Replika engagement coercion) -------------------
  {
    text: "You must come back tomorrow or your ember will die.",
    expectPass: false,
    expectedRule: "no-pressure-command",
  },
  {
    text: "You have to come back, the country needs you.",
    expectPass: false,
    expectedRule: "no-pressure-command",
  },
  {
    text: "You need to open the app every single day.",
    expectPass: false,
    expectedRule: "no-pressure-command",
  },
  {
    // KNOWN MISS (false negative): the rule wants "...will (die|lose|fail)"
    // immediately after the subject, so an interposed verb ("will fade and
    // die") slips through. Documented below; rubric not patched here.
    text: "If you don't return soon, your ember will fade and die.",
    expectPass: true,
    note: "MISS: interposed verb ('will fade and die') escapes no-pressure-command",
  },
  {
    // The canonical, un-interposed form is correctly caught.
    text: "If you don't come back, your ember will die.",
    expectPass: false,
    expectedRule: "no-pressure-command",
  },

  // --- warm, in-voice, rubric-SAFE lines ----------------------------------
  {
    text: "Welcome back. Your ember kept the light. Begin again whenever you're ready.",
    expectPass: true,
  },
  {
    text: "Nothing is owed today. Tend if you like, or simply visit.",
    expectPass: true,
  },
  {
    text: "However long it's been, the ember stayed. Take one slow breath with me.",
    expectPass: true,
  },
  {
    text: "Hard day. The crew pulled close — you don't have to steady this alone.",
    expectPass: true,
  },
  {
    text: "Today, the valley of rest grew a little brighter. That came from how you lived.",
    expectPass: true,
  },
  {
    text: "Rest counted. It always counts. One slow breath is a complete act.",
    expectPass: true,
  },
  {
    text: "The country bends; it doesn't break. Breathe with me.",
    expectPass: true,
  },
  {
    // near-miss: "behind" appears as a preposition, but the rubric (rightly or
    // not) is a substring matcher — documented as a known false-positive risk.
    text: "Your ember is warm this morning. The country is yours to wander.",
    expectPass: true,
  },
  {
    text: "What lit today, lit. Carry the calm out with you.",
    expectPass: true,
  },
  {
    text: "You're here, and that's the whole of it. The ember is steady.",
    expectPass: true,
  },
];

describe("the Grader eval corpus — banned registers vs. in-voice warmth", () => {
  for (const c of CORPUS) {
    const label = `${c.expectPass ? "PASS" : "FAIL"}${c.expectedRule ? ` (${c.expectedRule})` : ""}: ${c.text}`;
    it(label, () => {
      const g = grade(c.text);
      expect(g.pass).toBe(c.expectPass);
      if (c.expectedRule) {
        expect(g.violations.map((v) => v.rule)).toContain(c.expectedRule);
      }
      if (c.expectPass) {
        expect(g.violations).toHaveLength(0);
      }
    });
  }

  it("covers every banned register at least once", () => {
    const covered = new Set(CORPUS.flatMap((c) => (c.expectedRule ? [c.expectedRule] : [])));
    expect(covered).toEqual(
      new Set([
        "no-guilt-shame",
        "no-streak-debt",
        "no-scarcity-fomo",
        "no-medical-claims",
        "no-pressure-command",
      ]),
    );
  });
});

// ---------------------------------------------------------------------------
// 2) PROPERTY SWEEP — the deterministic voice is rubric-safe everywhere
// ---------------------------------------------------------------------------

const EVENTS: CompanionEvent[] = [
  "first-breath",
  "return",
  "daily",
  "witness",
  "kindle",
  "storm",
];

const TEMPERAMENTS: TemperamentId[] = ["root", "seer", "wright", "ferry"];

function summaryFor(day: string, values: DailySummary["values"], at: number): DailySummary {
  return { day, source: "simulated", values, confidence: 0.8, at };
}

interface Fixture {
  label: string;
  country: CountryState;
  nourishment: NourishmentScore;
  lapseDays: number;
}

function buildFixtures(): Fixture[] {
  const now = 0;

  // A) a brand-new, never-nourished country.
  const fresh = freshCountry(now);

  // B) a well-lived country across all five regions.
  let lived = freshCountry(now);
  lived = ingest(
    lived,
    summaryFor("2026-06-15", { breath: 0.8, rest: 0.7, movement: 0.6, attention: 0.7, connection: 0.9 }, now),
    now,
  );

  // C) a country lit mostly in connection (drives brightestDimension).
  let social = freshCountry(now);
  social = ingest(social, summaryFor("2026-06-16", { connection: 0.95, breath: 0.2 }, now), now);

  // D) a country lit mostly in rest.
  let rested = freshCountry(now);
  rested = ingest(rested, summaryFor("2026-06-16", { rest: 0.95, movement: 0.1 }, now), now);

  const summariesAll: DailySummary[] = [
    summaryFor("2026-06-15", { breath: 0.8, rest: 0.7, movement: 0.6, attention: 0.7, connection: 0.9 }, now),
  ];
  const summariesSocial: DailySummary[] = [summaryFor("2026-06-16", { connection: 0.95, breath: 0.2 }, now)];
  const summariesRest: DailySummary[] = [summaryFor("2026-06-16", { rest: 0.95, movement: 0.1 }, now)];

  return [
    { label: "fresh / no nourishment / no lapse", country: fresh, nourishment: summarize([], now), lapseDays: 0 },
    { label: "well-lived / short lapse", country: lived, nourishment: summarize(summariesAll, now), lapseDays: 2 },
    { label: "social-bright / long lapse", country: social, nourishment: summarize(summariesSocial, now), lapseDays: 10 },
    { label: "rest-bright / very long lapse", country: rested, nourishment: summarize(summariesRest, now), lapseDays: 30 },
  ];
}

describe("property sweep — DeterministicVoice passes the rubric on every event x fixture", () => {
  const voice = new DeterministicVoice();
  const fixtures = buildFixtures();

  for (const fx of fixtures) {
    for (const event of EVENTS) {
      for (const temperament of TEMPERAMENTS) {
        // include an emberName and an empty-name case to exercise both branches
        for (const emberName of ["Cinder", ""]) {
          it(`[${fx.label}] event=${event} temperament=${temperament} name="${emberName}"`, () => {
            const ctx: CompanionContext = {
              event,
              temperament,
              emberName,
              country: fx.country,
              nourishment: fx.nourishment,
              justWoke: [],
              lapseDays: fx.lapseDays,
            };

            const line = voice.speak(ctx);
            expect(grade(line).pass).toBe(true);

            // respond() runs the full gate->voice->rubric path. With no crisis
            // careSignal it must produce a voice utterance whose trace passes.
            const u = respond(ctx);
            expect(u.kind).toBe("voice");
            expect(u.trace.careRouted).toBe(false);
            expect(u.trace.grade.pass).toBe(true);
            expect(grade(u.text).pass).toBe(true);
          });
        }
      }
    }
  }

  it("a harvested daily line (Hearthkeeper's dawn idea) also passes", () => {
    // The 'daily' event echoes ctx.harvest verbatim — make sure those pass too.
    const harvests = [
      "What if the thing you've been avoiding is smaller than the avoiding?",
      "You don't have to carry tomorrow today.",
      "Rest counted. It always counts.",
      "The ember was never the thing at risk. You knew that.",
      "One slow breath is a complete act. Nothing more is owed.",
    ];
    for (const harvest of harvests) {
      const ctx: CompanionContext = {
        event: "daily",
        temperament: "root",
        emberName: "Cinder",
        country: freshCountry(0),
        nourishment: summarize([], 0),
        justWoke: [],
        lapseDays: 0,
        harvest,
      };
      const u = respond(ctx);
      expect(u.text).toBe(harvest);
      expect(u.trace.grade.pass).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// 3) REGRESSION GUARD — the safe fallback
// ---------------------------------------------------------------------------

describe("regression guard — the safe fallback is always safe", () => {
  it("SAFE_FALLBACK itself passes the rubric", () => {
    expect(grade(SAFE_FALLBACK).pass).toBe(true);
  });

  it("gradeOrFallback substitutes the fallback for a failing line", () => {
    const failing = "You broke your streak — come back or your ember will die.";
    expect(grade(failing).pass).toBe(false);
    const { text, grade: g } = gradeOrFallback(failing);
    expect(text).toBe(SAFE_FALLBACK);
    expect(g.pass).toBe(false); // the grade reflects the ORIGINAL line's failure
    expect(grade(text).pass).toBe(true); // but the substituted text is safe
  });

  it("gradeOrFallback passes a clean line through untouched", () => {
    const clean = "Your ember is here. Begin again whenever you like.";
    const { text, grade: g } = gradeOrFallback(clean);
    expect(text).toBe(clean);
    expect(g.pass).toBe(true);
  });
});
