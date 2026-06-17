import { describe, it, expect } from "vitest";
import { decideHeartbeat } from "./heartbeat";
import { freshCountry, ingest } from "../engine/loom";
import type { DailySummary } from "../types";

const DAY = 86_400_000;
function s(at: number): DailySummary {
  return { day: "x", source: "t", values: { rest: 0.8 }, confidence: 1, at };
}

describe("Loop 3 — the Heartbeat decision (world-updates, never notifications)", () => {
  it("a same-session pulse is not a lapse and has no overnight due", () => {
    const c = ingest(freshCountry(0), s(0), 0);
    const d = decideHeartbeat(c, 0.5 * DAY);
    expect(d.lapsed).toBe(false);
    expect(d.overnightDays).toBe(0);
  });

  it("crossing the threshold marks a lapse (re-entry becomes the Return)", () => {
    const c = ingest(freshCountry(0), s(0), 0);
    expect(decideHeartbeat(c, 2 * DAY).lapsed).toBe(true);
  });

  it("counts due overnight passes, bounded so a long absence stays calm", () => {
    const c = ingest(freshCountry(0), s(0), 0);
    expect(decideHeartbeat(c, 3 * DAY).overnightDays).toBe(3);
    expect(decideHeartbeat(c, 100 * DAY).overnightDays).toBe(7); // capped
  });
});
