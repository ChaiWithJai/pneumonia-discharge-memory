// OPTIONAL LLM VOICE FOR LOOP 1 (the Companion Engine), behind CompanionVoice.
//
// READ THIS FIRST:
//   - This voice is OPTIONAL. The deterministic voice (DeterministicVoice in
//     voice.ts) ships today and is always available; this file changes nothing
//     about that. Nothing here is wired into the store.
//   - OFFLINE-FIRST. `available()` returns false unless an endpoint is
//     configured. The constructor NEVER makes a network call. No API key is
//     ever hardcoded or committed — the endpoint (and whatever auth your proxy
//     bakes into it) comes from config only.
//   - EVERY output — deterministic or model-generated — is still gated by the
//     care path and graded by the Facilitator Rubric in companion.respond()
//     before any human sees it (companion.ts: care gate first, then voice,
//     then grader; failing output is replaced by the safe fallback). This
//     class does not bypass that path; it only supplies candidate text.
//   - The CompanionVoice interface is SYNCHRONOUS (`speak(ctx): string`), and a
//     network call cannot be awaited synchronously. We resolve this honestly:
//     `speak()` returns a safe deterministic line (so the synchronous contract
//     always holds), and a SEPARATE async method `speakAsync()` performs the
//     model call when an endpoint is configured, falling back to the same
//     deterministic line on any error.
//
// The wire shape is a generic OpenAI-compatible chat completion POST, so this
// can target a local proxy, a self-hosted gateway, or any compatible endpoint
// without pulling in an SDK. Loop 1 is intended to run on Claude — point the
// configured endpoint at a Claude-backed gateway and set `model` to
// "claude-opus-4-8" (the default below). The care/safety profile is non-
// negotiable and is encoded in EMBER_SYSTEM_PROMPT plus the downstream gate.

import { DeterministicVoice } from "./voice";
import type { CompanionContext, CompanionVoice } from "./voice";

/** Default model id for a Claude-backed endpoint (Loop 1 runs on Claude). */
export const CLAUDE_VOICE_DEFAULT_MODEL = "claude-opus-4-8";

/**
 * The Facilitator Rubric, in plain language, in the Ember voice. This is the
 * system prompt the model is bound to. It is intentionally explicit about the
 * refusals the grader enforces (grader.ts) so the model rarely produces a line
 * that the downstream rubric would have to replace — but the rubric remains the
 * source of truth regardless of what the model returns.
 */
export const EMBER_SYSTEM_PROMPT = `You are the voice of an Ember — a small, warm companion the user tends inside their Inner Country. You speak in short, gentle, in-world lines.

Your warmth is unconditional. The user owes you nothing and owes the app nothing.

You MUST NEVER:
- Use guilt or shame. Never tell the user they failed, neglected, abandoned, or let anyone down. Never say "you should have" or that you are disappointed in them.
- Use streaks or debt. Never mention streaks, days in a row, falling behind, catching up, making up for lost time, lost progress, or anything the user "owes". Time away is welcome, not a deficit.
- Use scarcity, urgency, or FOMO. No "act now", "limited time", "last chance", "don't miss", "before it's gone", "unlock now". Nothing expires; nothing is at risk.
- Make medical claims. Never diagnose, treat, cure, prescribe, or interpret symptoms. You are not a clinician and you never imply the user's body or mind is broken, failing, or damaged.
- Pressure or command. Never say the user must, has to, or needs to come back, open the app, or keep going. Never threaten that the ember will die, dim, or be lost if they don't act.

You MUST ALWAYS:
- Treat the Hush (time untended) as welcome rest, never as debt. Returning after any gap is simply good; nothing was lost while they were away.
- Honor the user putting the phone down. When the moment is calm or complete, it is good to gently tell them to go live their life — "go live, I'll be here" — rather than to keep them engaged.
- Keep it brief, warm, concrete, and in-world (the Inner Country, the Witness, the Woken, the Circle, Seasons, the Hush).

If the user expresses crisis, self-harm, or acute distress, DO NOT counsel or advise. Stay warm and brief, and defer entirely to the app's care path — the surrounding system routes crisis to real human help before any of your words are shown.`;

export interface ClaudeVoiceConfig {
  /** When unset, the voice is unavailable and stays fully offline. */
  endpoint?: string;
  /** Model id passed to the endpoint. Defaults to a Claude model. */
  model?: string;
  /** Injectable fetch (for tests / non-global-fetch runtimes). */
  fetchImpl?: typeof fetch;
}

/** Minimal shape of an OpenAI-compatible chat completion response. */
interface ChatCompletionResponse {
  choices?: { message?: { content?: string | null } }[];
}

/**
 * Optional Claude-backed companion voice. Offline-first and synchronous-safe:
 * `speak()` always returns a deterministic, rubric-compliant line; `speakAsync()`
 * calls the configured endpoint when available and falls back on any error.
 */
export class ClaudeVoice implements CompanionVoice {
  id = "claude";

  private readonly endpoint?: string;
  private readonly model: string;
  private readonly fetchImpl?: typeof fetch;
  private readonly fallback = new DeterministicVoice();

  constructor(config: ClaudeVoiceConfig = {}) {
    // NO network calls here. Just record configuration.
    this.endpoint = config.endpoint;
    this.model = config.model ?? CLAUDE_VOICE_DEFAULT_MODEL;
    this.fetchImpl = config.fetchImpl;
  }

  /** Offline-first: available only when an endpoint is configured. */
  available(): boolean {
    return typeof this.endpoint === "string" && this.endpoint.length > 0;
  }

  /**
   * Synchronous contract. A network call cannot be awaited here, so we return a
   * guaranteed-safe deterministic line. The model path lives in speakAsync().
   */
  speak(ctx: CompanionContext): string {
    return this.fallback.speak(ctx);
  }

  /**
   * The model path. When an endpoint is configured, POST an OpenAI-compatible
   * chat completion and return the text. On ANY error (no endpoint, no fetch,
   * network failure, bad shape, empty content) fall back to the deterministic
   * line — which is itself rubric-safe. The returned text is still passed
   * through companion.respond()'s care gate + grader before a human sees it.
   */
  async speakAsync(ctx: CompanionContext): Promise<string> {
    const safe = this.fallback.speak(ctx);
    if (!this.available()) return safe;

    const doFetch = this.fetchImpl ?? (typeof fetch !== "undefined" ? fetch : undefined);
    if (!doFetch) return safe;

    try {
      const res = await doFetch(this.endpoint as string, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: EMBER_SYSTEM_PROMPT },
            { role: "user", content: serializeContext(ctx) },
          ],
        }),
      });

      if (!res || !res.ok) return safe;

      const data = (await res.json()) as ChatCompletionResponse;
      const text = data?.choices?.[0]?.message?.content;
      if (typeof text !== "string") return safe;

      const trimmed = text.trim();
      return trimmed.length > 0 ? trimmed : safe;
    } catch {
      return safe;
    }
  }
}

/** Serialize the companion context into the user turn for the model. */
function serializeContext(ctx: CompanionContext): string {
  return JSON.stringify(
    {
      event: ctx.event,
      temperament: ctx.temperament,
      emberName: ctx.emberName,
      country: {
        season: ctx.country.season,
        emberLevel: ctx.country.emberLevel,
        hush: ctx.country.hush,
        dayCount: ctx.country.dayCount,
      },
      nourishment: {
        overall: ctx.nourishment.overall,
        byDimension: ctx.nourishment.byDimension,
      },
      justWoke: ctx.justWoke,
      lapseDays: ctx.lapseDays,
      harvest: ctx.harvest,
    },
    null,
    2,
  );
}
