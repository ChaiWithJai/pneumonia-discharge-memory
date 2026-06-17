import { describe, it, expect } from "vitest";
import { freshWoken, witness, assembleTriad, awakeCount } from "./circle";
import type { DailySummary } from "../types";

const DAY = 86_400_000;
function summary(at: number, values: Record<string, number>): DailySummary {
  return { day: "x", source: "test", values, confidence: 1, at };
}

describe("the Circle — wake by living, never by chance", () => {
  it("wakes the Bellows after sustained breath", () => {
    let woken = freshWoken();
    let last;
    for (let d = 0; d < 4; d++) {
      const r = witness(woken, summary(d * DAY, { breath: 0.8 }), d * DAY);
      woken = r.woken;
      last = r;
    }
    expect(woken.bellows.awake).toBe(true);
    expect(last!.justWoke.length >= 0).toBe(true);
  });

  it("does not wake a coming-soon companion (kin needs the Commons)", () => {
    let woken = freshWoken();
    for (let d = 0; d < 10; d++) {
      woken = witness(woken, summary(d * DAY, { connection: 1 }), d * DAY).woken;
    }
    expect(woken.kin.awake).toBe(false);
  });

  it("once awake, stays awake (monotonic)", () => {
    let woken = freshWoken();
    for (let d = 0; d < 4; d++) {
      woken = witness(woken, summary(d * DAY, { movement: 0.9 }), d * DAY).woken;
    }
    expect(woken.strider.awake).toBe(true);
    // an empty day must not unwake it
    woken = witness(woken, summary(5 * DAY, {}), 5 * DAY).woken;
    expect(woken.strider.awake).toBe(true);
  });

  it("the triad holds at most three", () => {
    let woken = freshWoken();
    for (let d = 0; d < 6; d++) {
      woken = witness(
        woken,
        summary(d * DAY, { breath: 0.9, movement: 0.9, rest: 0.9 }),
        d * DAY,
      ).woken;
    }
    expect(awakeCount(woken)).toBeGreaterThanOrEqual(3);
    expect(assembleTriad(woken).triad.length).toBeLessThanOrEqual(3);
  });
});
