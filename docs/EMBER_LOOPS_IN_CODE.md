# Ember — the four loops, in code

How [`EMBER_LOOP_ENGINEERING.md`](./EMBER_LOOP_ENGINEERING.md)'s model is instantiated in `ember/`. The companion's intelligence is not a prompt; it's a stack of loops we engineer, grade, and improve.

| Loop | Plan | In code | Status |
|---|---|---|---|
| **1 — Companion Engine** | context in → in-voice response out | `ember/src/lib/loops/voice.ts` (`DeterministicVoice`, offline-first) + `claudeVoice.ts` (optional LLM, same `CompanionVoice` interface); orchestrated by `companion.ts` `respond()` | **Shipped** (deterministic). Claude voice present but unwired; offline-first. |
| **2 — The Grader** | every output scored vs the Facilitator Rubric before a human sees it; safety gate non-negotiable | `grader.ts` (rubric enforced in code → `SAFE_FALLBACK` on fail) + `carepath.ts` (deterministic crisis gate, runs **first**) + review mode/labeling in the store + Studio | **Shipped + enforced in tests.** Human-in-the-loop = review mode + trace labeling. |
| **3 — The Heartbeat** | events/cron drive runs that update the world (never spam) | `heartbeat.ts` (`decideHeartbeat`) applied by the store on boot, a 60s pulse, tab-focus, and dev time-travel | **Shipped.** Updates the world only — the Indistractable guardrail. |
| **4 — The Studio** | every interaction logs a trace; read 100%, error-analyze, improve the rubric | `studio.ts` (`Trace`, `studioStats`, `toEvalCases`, `evalJSONL`) + the Studio screen (stats, labeling, JSONL export) | **Shipped.** The rubric is the growing eval set; `rubric.evals.test.ts` is its regression suite. |

## The sacred order (every utterance)
`companion.respond()` enforces: **care gate → voice → rubric → trace.** The care path is deterministic and first; the voice is gated by the rubric (failing output is replaced, never shown); every result is traced for the Studio.

## The maturity ladder (loop plan §5) — where we are
- **TODAY (Loops 1+2, humans in):** ✅ deterministic voice + rubric + care gate + human review mode + trace labeling. The Studio's check-in box exercises the care gate; "operator bench" time-travel demonstrates the Hush/Return.
- **THIS WEEK (thin real Witness + traces):** ✅ manual check-in screen (`checkin.svelte`) and the `ember ingest` CLI (ADR-0002) provide the cheapest real signal; every output is traced and exportable as evals. Real Oura/Whoop swap in behind `PassiveSource` (see the integration-feasibility spec) — the next real-signal step.
- **EVERY DAY (the Studio, Loop 4):** ✅ read 100% of traces in the Studio, label them, export the eval set; tighten `grader.ts`. (Two rubric gaps found this way were already closed.)

## Non-negotiables (loop plan §6) — status
1. **Safety/care path live before any customer:** ✅ always reachable; deterministic gate. ⚠️ resources in `carepath.ts` are a US-default placeholder needing a professional partner before a real pilot (the one launch gate).
2. **Human in the loop the entire pilot:** ✅ review mode holds outputs as pending for an operator; labeling feeds the eval set.
3. **Informed consent + data dignity:** ✅ the trust gate (A5) + the Ledger (F2) export/delete; local-only by default.
4. **Facilitator Rubric enforced in code, not vibes:** ✅ `grader.ts` + `rubric.evals.test.ts`.
5. **Heartbeats update the world, never spam:** ✅ `heartbeat.ts` is world-only by construction.

## Deferred (honest edges)
- Wiring `ClaudeVoice` to a live endpoint (still gated by care + rubric regardless).
- Real `OuraSource`/`WhoopSource` + the Cloudflare broker (designed; see the integration-feasibility spec and ADRs).
- LangSmith-style automated trace analysis (we read by hand — higher signal at 1–2 users).
- The Commons social backend; a localized, professionally-reviewed care path.
