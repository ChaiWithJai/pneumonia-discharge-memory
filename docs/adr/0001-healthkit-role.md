# ADR-0001 — Apple HealthKit is an ambient, trailing witness, not a live signal

- **Date:** 2026-06-17
- **Status:** Accepted
- **Context docs:** [`EMBER_WORLD_BIBLE.md`](../EMBER_WORLD_BIBLE.md), [integration feasibility §0/§2](../superpowers/specs/2026-06-17-integration-feasibility.md), [product spec](../superpowers/specs/2026-06-17-biometric-companion-design.md).

## Context

- Ember v1 is **passive-only**: there is no live in-session signal (no camera-PPG, BLE strap, or watchOS app).
- Research established that **HealthKit is not real-time**: Watch→iPhone sync is seconds-to-minutes, system-controlled, with no API to accelerate, and the watchOS 26 / iOS 26 background-delivery regression pushes intervals to 20–60+ minutes (Apple acknowledged, unresolved as of Jan 2026).
- The locked lead sources are **Oura (first) and Whoop (parallel)**. Apple Health is secondary.
- The world's sensing layer — **the Witness** — *notices how you lived; it never scores or judges.* That fiction tolerates latency: it describes a slow, trailing awareness, not a heartbeat.

## Decision

**Use Apple HealthKit (when present) only as an *ambient, low-frequency, trailing* source of recovery / sleep / movement context — secondary to Oura/Whoop, and deferred to v2.** Its latency is acceptable *because* nourishment is computed daily and the loop is reflective ("open it and see how your Inner Country answered"), not live.

Specifically:
- HealthKit feeds the same normalized `DailySummary` the engine consumes — never a real-time stream.
- It is **never** used for live in-session feedback. If a live tier is ever added, it comes from a BLE strap or a dedicated watchOS target (a separate future decision), **not** from HealthKit.
- **In-world framing (kept relevant to character):** HealthKit reads appear as *slow weather and seasonal drift* in the Inner Country — the quiet edge-of-the-country witness — informing the *gentleness of the Hush* and the warmth of a valley, never a pulse, never a number. This keeps the latency a feature of the fiction, not a bug to apologize for.

## Consequences

- **No UX may depend on tight HealthKit cadence**; treat updates as "sometime today."
- **No watchOS app and no live HealthKit path in v1.**
- Handle the **read-permission ambiguity** (denied is indistinguishable from "no data"): design empty-state UX, never gate logic on read-auth status.
- Requires the HealthKit entitlement + `NSHealthShareUsageDescription`; **must be tested on a physical iPhone + paired Watch** (Simulator has no Health data).
- Plan a thin custom Swift Capacitor plugin for `HKObserverQuery` + `enableBackgroundDelivery` (community plugins don't cover background delivery); use `capacitor-health` for foreground reads. *(v2 work.)*
- HRV (`heartRateVariabilitySDNN`) and resting HR are **sparse** (sporadic / ~daily) — model them as daily nourishment, not signals.

## Alternatives considered

- **HealthKit as a primary, near-live source** — rejected: not real-time, Watch-dependent for HR/HRV/sleep to even exist, and degraded on watchOS 26.
- **Live HR via watchOS app or BLE strap in v1** — rejected by the locked passive-only decision; revisit only if a live "Tending" tier is later prioritized.
- **Excluding Apple Health entirely** — rejected: it is a useful *secondary* aggregator for users who route wearables through it; keeping it (ambient, v2) costs little behind the `SignalSource` interface.
