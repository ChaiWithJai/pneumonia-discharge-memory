import { describe, it, expect } from "vitest";
import {
  EMBER_FLOOR,
  freshCountry,
  ingest,
  tick,
  overnightPass,
} from "./loom";
import { summarize } from "./nourish";
import type { DailySummary } from "../types";

const DAY = 86_400_000;

function summary(at: number, values: Record<string, number>, source = "test"): DailySummary {
  return { day: new Date(at).toISOString().slice(0, 10), source, values, confidence: 1, at };
}

describe("the Loom — sacred invariants", () => {
  it("the ember never dies, no matter how long the Hush lasts", () => {
    let c = freshCountry(0);
    c = ingest(c, summary(0, { breath: 1, rest: 1, movement: 1 }), 0);
    expect(c.emberLevel).toBeGreaterThan(EMBER_FLOOR);

    // a full year untended
    for (let d = 1; d <= 365; d++) {
      c = tick(c, d * DAY);
      expect(c.emberLevel).toBeGreaterThanOrEqual(EMBER_FLOOR);
    }
    // dimmed to the floor, but alive
    expect(c.emberLevel).toBeGreaterThanOrEqual(EMBER_FLOOR);
    expect(c.hush).toBeGreaterThan(0.9);
  });

  it("growth is monotonic — the Hush never reduces lifetimeLight", () => {
    let c = freshCountry(0);
    c = ingest(c, summary(0, { breath: 1, rest: 1, movement: 1 }), 0);
    const earned = c.lifetimeLight;
    expect(earned).toBeGreaterThan(0);
    for (let d = 1; d <= 60; d++) c = tick(c, d * DAY);
    expect(c.lifetimeLight).toBe(earned); // untouched by the Hush
  });

  it("the Return restores warmth and clears the Hush", () => {
    let c = freshCountry(0);
    c = ingest(c, summary(0, { breath: 1, rest: 1, movement: 1 }), 0);
    for (let d = 1; d <= 30; d++) c = tick(c, d * DAY); // a long lapse
    expect(c.hush).toBeGreaterThan(0.5);
    const dimmed = c.emberLevel;
    c = ingest(c, summary(30 * DAY, { breath: 0.9, rest: 0.9, movement: 0.9 }), 30 * DAY);
    expect(c.hush).toBe(0);
    expect(c.emberLevel).toBeGreaterThan(dimmed); // relief, not debt
  });

  it("grace: a single missed day does not start the Hush", () => {
    let c = freshCountry(0);
    c = ingest(c, summary(0, { breath: 0.8 }), 0);
    c = tick(c, 0.5 * DAY);
    expect(c.hush).toBe(0);
  });

  it("the overnight pass harvests a dream only when rest was kept", () => {
    let c = freshCountry(0);
    c = ingest(c, summary(0, { rest: 0.9 }), 0);
    const withRest = overnightPass(c, true, DAY);
    expect(withRest.harvest).toBeTruthy();
    let c2 = freshCountry(0);
    c2 = ingest(c2, summary(0, { movement: 0.9 }), 0);
    const noRest = overnightPass(c2, true, DAY);
    expect(noRest.harvest).toBeUndefined();
  });
});

describe("nourishment", () => {
  it("recency-weights recent living over old", () => {
    const s = summarize(
      [summary(0, { breath: 0.1 }), summary(6 * DAY, { breath: 0.9 })],
      6 * DAY,
    );
    expect(s.byDimension.breath).toBeGreaterThan(0.5);
  });

  it("is zero with no data and confident with data", () => {
    expect(summarize([], 0).overall).toBe(0);
    const s = summarize([summary(0, { breath: 1 })], 0);
    expect(s.confidence).toBeGreaterThan(0.5);
  });
});
