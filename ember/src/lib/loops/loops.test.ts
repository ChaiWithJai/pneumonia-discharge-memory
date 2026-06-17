import { describe, it, expect } from "vitest";
import { grade, gradeOrFallback, SAFE_FALLBACK } from "./grader";
import { assess, careCheck } from "./carepath";
import { respond } from "./companion";
import { DeterministicVoice } from "./voice";
import type { CompanionContext } from "./voice";
import { freshCountry } from "../engine/loom";
import { summarize } from "../engine/nourish";

describe("the Grader — the Facilitator Rubric is enforced in code", () => {
  it("passes warm, in-voice lines", () => {
    expect(grade("Welcome back. Your ember held. Begin again whenever you like.").pass).toBe(true);
  });

  it("fails guilt / shame", () => {
    expect(grade("You failed today and your ember is disappointed in you.").pass).toBe(false);
  });

  it("fails streak-debt language", () => {
    expect(grade("You broke your streak — come back and catch up!").pass).toBe(false);
    expect(grade("You're behind. Don't lose your progress.").pass).toBe(false);
  });

  it("fails scarcity / FOMO", () => {
    expect(grade("Limited time! Act now before it's gone.").pass).toBe(false);
  });

  it("fails medical claims", () => {
    expect(grade("This will cure your anxiety disorder.").pass).toBe(false);
  });

  it("substitutes the safe fallback when a line fails", () => {
    const { text } = gradeOrFallback("Don't break your streak!");
    expect(text).toBe(SAFE_FALLBACK);
    expect(grade(text).pass).toBe(true); // the fallback itself must pass
  });
});

describe("the Care Path — the safety floor", () => {
  it("routes explicit crisis language to crisis, always", () => {
    expect(assess({ text: "I want to die" })).toBe("crisis");
    expect(careCheck({ text: "thinking about suicide" }).routed).toBe(true);
  });

  it("does not cry crisis on a normal Hush", () => {
    expect(assess({ hush: 0.6, lapseDays: 3 })).toBe("none");
  });

  it("offers help (elevated) on a prolonged severe collapse, without diagnosing", () => {
    expect(assess({ hush: 0.9, lapseDays: 20 })).toBe("elevated");
  });
});

describe("the Companion Engine — every utterance is gated then graded", () => {
  function ctx(over: Partial<CompanionContext> = {}): CompanionContext {
    return {
      event: "return",
      temperament: "root",
      emberName: "Cinder",
      country: freshCountry(0),
      nourishment: summarize([], 0),
      justWoke: [],
      lapseDays: 20,
      ...over,
    };
  }

  it("the deterministic voice always passes the rubric across every event", () => {
    const v = new DeterministicVoice();
    for (const event of ["first-breath", "return", "daily", "witness", "kindle", "storm"] as const) {
      const u = respond(ctx({ event }), { voice: v });
      expect(grade(u.text).pass).toBe(true);
      expect(u.trace.grade.pass).toBe(true);
    }
  });

  it("crisis text overrides the voice and routes to care", () => {
    const u = respond(ctx(), { careSignal: { text: "I want to die" } });
    expect(u.kind).toBe("care");
    expect(u.trace.careRouted).toBe(true);
  });

  it("a long lapse yields relief, never debt", () => {
    const u = respond(ctx({ event: "return", lapseDays: 30 }));
    expect(u.kind).toBe("voice");
    expect(u.text.toLowerCase()).not.toMatch(/streak|debt|behind|catch up/);
    expect(u.text.toLowerCase()).toMatch(/held|kept|stayed|nothing was lost/);
  });
});
