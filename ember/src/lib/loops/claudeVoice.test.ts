import { describe, it, expect } from "vitest";
import { ClaudeVoice, EMBER_SYSTEM_PROMPT } from "./claudeVoice";
import { grade } from "./grader";
import type { CompanionContext } from "./voice";
import type { CountryState, NourishmentScore } from "../types";

function ctx(): CompanionContext {
  const country: CountryState = {
    warmth: { breath: 0.5, rest: 0.5, movement: 0.5, attention: 0.5, connection: 0.5 },
    emberLevel: 0.6,
    season: "bright",
    hush: 0.1,
    dayCount: 3,
    lastNourishedAt: 0,
    lastTickAt: 0,
    lifetimeLight: 1.2,
  };
  const nourishment: NourishmentScore = {
    byDimension: { breath: 0.6, rest: 0.5, movement: 0.4, attention: 0.7, connection: 0.5 },
    overall: 0.54,
    confidence: 0.8,
  };
  return {
    event: "return",
    temperament: "root",
    emberName: "Cinder",
    country,
    nourishment,
    justWoke: [],
    lapseDays: 2,
  };
}

describe("ClaudeVoice — optional, offline-first LLM voice", () => {
  it("has id 'claude'", () => {
    expect(new ClaudeVoice().id).toBe("claude");
  });

  it("available() is false with no endpoint configured", () => {
    expect(new ClaudeVoice().available()).toBe(false);
    expect(new ClaudeVoice({ endpoint: "" }).available()).toBe(false);
  });

  it("available() is true when an endpoint is configured", () => {
    expect(new ClaudeVoice({ endpoint: "https://example.test/v1/chat" }).available()).toBe(true);
  });

  it("the constructor makes no network call", () => {
    let called = false;
    const fetchImpl = (async () => {
      called = true;
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;
    // eslint-disable-next-line no-new
    new ClaudeVoice({ endpoint: "https://example.test/v1/chat", fetchImpl });
    expect(called).toBe(false);
  });

  it("speak() (sync) returns a rubric-passing deterministic line", () => {
    const voice = new ClaudeVoice({ endpoint: "https://example.test/v1/chat" });
    const line = voice.speak(ctx());
    expect(typeof line).toBe("string");
    expect(line.length).toBeGreaterThan(0);
    expect(grade(line).pass).toBe(true);
  });

  it("speakAsync() returns the mocked model text when fetch succeeds", async () => {
    const canned = "Welcome back. Cinder kept the smallest light, glad of your return.";
    const fetchImpl = (async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: canned } }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })) as unknown as typeof fetch;

    const voice = new ClaudeVoice({ endpoint: "https://example.test/v1/chat", fetchImpl });
    const text = await voice.speakAsync(ctx());
    expect(text).toBe(canned);
  });

  it("speakAsync() falls back to a deterministic, rubric-passing line when fetch throws", async () => {
    const fetchImpl = (async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;

    const voice = new ClaudeVoice({ endpoint: "https://example.test/v1/chat", fetchImpl });
    const text = await voice.speakAsync(ctx());
    expect(text).toBe(voice.speak(ctx())); // identical to the deterministic line
    expect(grade(text).pass).toBe(true);
  });

  it("speakAsync() falls back when no endpoint is configured (offline-first)", async () => {
    const fetchImpl = (async () => {
      throw new Error("should not be called");
    }) as unknown as typeof fetch;
    const voice = new ClaudeVoice({ fetchImpl });
    const text = await voice.speakAsync(ctx());
    expect(grade(text).pass).toBe(true);
  });

  it("EMBER_SYSTEM_PROMPT encodes the key refusals", () => {
    const p = EMBER_SYSTEM_PROMPT.toLowerCase();
    expect(p).toContain("guilt");
    expect(p).toContain("shame");
    expect(p).toContain("streak");
    expect(p).toContain("scarcity");
    expect(p).toMatch(/diagnos|medical/);
    expect(p).toContain("pressure");
    expect(p).toContain("hush");
    expect(p).toContain("go live");
    expect(p).toContain("care path");
  });
});
