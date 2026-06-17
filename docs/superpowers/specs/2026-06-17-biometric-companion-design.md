# Ember — Product Direction & Architecture Spec

- **Date:** 2026-06-17 (rev. 4 — full Ember reconciliation; all open decisions locked)
- **Status:** Draft (design); ready for an implementation plan.
- **Companion docs:** narrative canon → [`docs/EMBER_WORLD_BIBLE.md`](../../EMBER_WORLD_BIBLE.md); integration research → [`2026-06-17-integration-feasibility.md`](./2026-06-17-integration-feasibility.md). This spec is the technical translation of the bible.
- **Non-clinical:** a well-being companion, not a medical device. Physiology is *witnessed* as a living world, never scored or diagnosed.

---

## 0. Locked decisions

| Decision | Choice | Consequence |
|---|---|---|
| **Name** | **Ember** | The being you tend = *your Ember*; it can dim but never die. (Clear the crowded trademark before launch.) |
| **Bond** | **Guardianship, punishment inverted** | *Tending* = you live well; the **Witness** reflects it back as light. Lapse → **the Hush** (greying, never cruel, never a villain). The ember always holds; return is relief, never debt. |
| **Collection** | **The Circle (1 + 3) + the Woken (6)** | Supersedes "one companion." A meaningful team **woken by witnessed practice** — not gacha, not completism. The local **dex of your states** persists beneath it as the record. |
| **Fiction** | **The four temperaments + the Inner Country** | Starter choice **Seer / Wright / Root / Ferry**; **MVP ships one — Root.** The Inner Country brightens, dims, and has **Seasons** (no final boss). |
| **Signal / hardware** | **Wearable required; passive-only v1** | **No live in-session signal** in v1 (no camera-PPG, no BLE strap, no watchOS app). The Witness ingests **daily recovery / sleep / movement** from a worn device. |
| **Lead sources** | **Oura first; Whoop in parallel** | Oura = lowest-friction first integration (webhooks, no gate). Whoop built to its ≤10-user cap with **approval submitted early, off the critical path**. Apple Health optional/secondary. |
| **Strava** | **Dropped from v1** | Its 2026 terms (owner-only display, AI-training ban, paid tier) removed the beachhead rationale. Movement comes from Oura/Whoop workouts. |
| **Commons (social)** | **v2** | Prove the solo soul first (the MVP test). When built, it is **Ember-native**, never on third-party data. |

**The category we're creating** (world bible): *the first interior-state companion — a being bonded to how you actually are, that grows by your living and survives by a promise.* The moat is the **pattern of refusals** (guilt, judgment-scores, completism, punishment, engagement-maxing, scarcity) — un-clonable because every incumbent's business model depends on a pressure we won't use.

## 1. The loop (what Ember does, given passive-only)

There is no "play." You **live**; your wearable records; the broker ingests overnight/by webhook; and when you open Ember, **the Inner Country has already answered how you've been living** — a valley warmed because you recovered well, a color returned because you slept, a storm that landed softer because you moved. Over time, witnessed patterns **wake the Circle**. When you lapse, **the Hush** sets in — but the ember holds, and the warmth returns when you do. The win, re-winnable every Season, is tending because the country is yours and you love it — not out of dread.

This async, "reflective" loop is *calmer by construction* than a live biofeedback toy, and it sidesteps HealthKit's non-real-time limitation entirely (see feasibility §0).

## 2. The Witness (sensing layer) — passive, v1

The Witness **notices; it never scores or judges**. It turns a worn device's daily summaries into *nourishment*, rendered as light in the Inner Country — never a 0–100 verdict (the refusal of Whoop's red).

**Sources (v1):** **Oura** (first) and **Whoop** (parallel), plus **manual UI input** and a **CLI** (§7b). Apple Health is an optional, **ambient, trailing** secondary source — not load-bearing, not real-time, deferred to v2 (**ADR-0001**). Each is one `SignalSource` adapter / producer behind a single interface; the engine cannot tell them apart.

**Signals witnessed** (daily, baseline-relative — we compare to *your* trend, never a population norm):
- **Recovery** — readiness/recovery score, overnight **HRV**, resting HR. (Oura `daily_readiness` + detailed `sleep.average_hrv`; Whoop `recovery.hrv_rmssd_milli`/`resting_heart_rate`.)
- **Sleep** — duration, stages, regularity.
- **Movement** — workouts/strain, activity.

**Capability tiers** (progressive, never pay-gated — power-ups *add*, never ration):

| Tier | Requires | Adds |
|---|---|---|
| **Connected** | One worn device (Oura **or** Whoop) | The full bond: recovery + sleep + movement nourishment, the Hush/Seasons, waking the Circle. **Ember is complete here.** |
| **Stacked** | Both, or + Apple Health | Cross-signal richness, fuller dex, more Woken paths. |

## 3. Nourishment & the Inner Country (the engine)

A pure, deterministic engine (the house discipline — mirrors `runtime.py`) maps witnessed signals → the Inner Country's state. No I/O; fully unit-testable.

- **`NourishmentScore`** = `{ recovery, sleep, movement, consistency, confidence, day }`, each 0..1, baseline-relative. `confidence` honestly reflects missing/late data (no faking).
- **The Inner Country** has a continuous `warmth` (per valley/domain) that rises with nourishment and **drifts toward the Hush** without it — *rest, not death*. Growth (the Circle, the dex, Season progress) is **monotonic**; the Hush never erases it.
- **Seasons** turn on a long cycle (kindling ↔ Hush, brightening ↔ winter); returning after a lapse is rendered as relief.
- **The ember core is invariant** — it can dim to its lowest state but a floor guarantees it never goes out. This floor is the single most testable promise (world bible MVP test: *"I didn't want to let it go dark" — "but it was okay when I came back."*).

## 4. The Circle & the Woken

Your **Circle** = your Ember (1) + a triad of support (3). You assemble it by **waking the Woken** — six companions (**Bellows, Hearthkeeper, Strider, Lamplighter, Kin, Wisp**) — through *witnessed* practice, not taps and not self-report (the refusal of Finch's checklist):

- A real recovery streak wakes the **Hearthkeeper**; consistent sleep, the **Lamplighter**; real movement/workouts, the **Strider**; a witnessed breath/mindful session (appears as a session/HRV signature), the **Bellows**. **Kin** (connection) is **witnessed via the Commons in v2** — in v1 it stays dormant or wakes from a proxy we trust.
- Each wakes by *outcome-uncertain* patterns in how you actually lived (the Tamagotchi "what will it become" pull, ethically sourced). The crew you assemble is a literal portrait of your living.

**MVP:** start with **Bellows + Strider** woken-able (proves the wake-by-practice loop); the rest land as content/sources grow. "Ship the seam, grow with SKUs."

## 5. Temperaments (the starter mirror)

Four temperaments — **Seer / Wright / Root / Ferry** — each a native genius + blind spot. They are a *mirror, not a difficulty*. **MVP ships Root** (grounding/recovery-led), which maps naturally onto the recovery/sleep signals we lead with. The other three are authored as **data** (a `blueprint_temperaments()` seam, mirroring `factory.blueprint_specs()`), added without engine changes.

## 6. Abstraction (modules; dependencies point inward to the pure engine)

| Module (proposed) | New? | Single purpose | Mirrors today |
|---|---|---|---|
| `ember/nourish.ts` | new | Pure: daily summaries → `NourishmentScore`. No I/O. | `runtime.py` scoring |
| `ember/country.ts` | new | Pure reducer: `(CountryState, NourishmentScore, dt) → CountryState`; warmth, the Hush, Seasons, the ember floor. | `recursive_validation` |
| `ember/circle.ts` | new | Pure: witnessed patterns → wake/sleep the Woken; assemble the Circle. | deterministic gating |
| `ember/blueprint.ts` | new | `blueprint_temperaments()` + Woken specs as **data**; model-proposed with deterministic fallback. | `factory.blueprint_specs()` — *the seam* |
| `ember/types.ts` | new | Typed contracts. | `app/src/lib/types.ts` |
| **`SignalSource`** (iface) | new | `available()` · `fetchDaily()` · `capabilities`. Impls: `OuraSource`, `WhoopSource`, later `HealthKitSource`. **Passive only in v1.** | `local_ai` `available()` adapters |
| **`EmberStore`** (iface) | new | Append-only local persistence: dex entries, country/circle state, `exportAll`, `wipe`. Impls: `IndexedDbStore` (v1), later `RemoteStore`. | `InstitutionalMemory` JSONL |
| **`EmberImager`** (iface) | new | `render(state) → image` of the Inner Country / Ember / Woken. Impls: `CanvasImager` (offline), `BonsaiImager` (via `/illustrate`). | what-if frame + canvas fallback |
| **`IntegrationBroker`** (iface; impl = **Cloudflare Worker**) | new | OAuth (Arctic) + token vault + webhook ingest → derived daily summaries to the device. | the one backend (§7) |
| `ember/store.svelte.ts` | new | Svelte 5 `$state` FSM + composition root injecting impls. | `app/src/lib/store.svelte.ts` |
| `src/pdm/web.py` | extend | Serve the app; keep `/illustrate`; host a **fixture-backed local dev broker** for offline/CI. | stdlib server + proxy |

**No cycles.** `SignalSource → nourish → country/circle → store (UI) → Imager + EmberStore`. Integration: `broker (OAuth + webhook) → derived daily summary → SignalSource → same engine`.

## 7. The broker — Cloudflare Workers (the one backend)

The Worker is a **confidential OAuth client / BFF**; the app never holds a provider secret or refresh token.
- **Token store + refresh serialization:** **one SQLite-backed Durable Object per user** — single-threaded, so the **refresh-token rotation race** (the #1 hazard for Whoop *and* Oura) cannot happen; Alarms API for proactive refresh + Oura **subscription renewal** + webhook dedup.
- **Encrypt tokens yourself:** AES-256-GCM (WebCrypto), key in **Secrets**, fresh 12-byte IV per write, version-tagged ciphertext for rotation. (KV/D1/DO are infra-encrypted but plaintext to anyone with dashboard access.)
- **OAuth lib: Arctic** (client, polyfill-free on Workers). **Not** `@cloudflare/workers-oauth-provider` (that makes you an authorization *server*).
- **Webhooks:** verify HMAC over the **raw body** (Whoop `X-WHOOP-Signature` = base64(HMAC-SHA256(timestamp+body, secret)); Oura `x-oura-signature` + GET challenge echo) before parsing; route through the per-user DO.
- **Outbound:** Queues (retry/backoff/DLQ); never module-global state. **Workers Paid** (subrequest/CPU headroom). On device, only a short-lived session token in **Keychain/Keystore**.

## 7b. The ingestion gateway (one contract, many producers) — see ADR-0002

The Witness's sources generalize from "provider OAuth" to **one normalized ingestion contract** on the broker, `POST /v1/ingest` (batchable, idempotent, versioned). Every producer converges on it; **scoped auth decides which subjects a caller may write**, and the engine/dex never know the producer (dependency inversion, extended to *how data enters*):

| Producer | Auth scope | Use |
|---|---|---|
| **Provider OAuth** (Oura now, Whoop parallel) | broker, on user's behalf | mainstream consumer path |
| **Manual UI input** | `user` session | "tell the Witness yourself" — secondary, lower `confidence` (not the mainstream; avoids Finch's checklist shadow) |
| **CLI** (`ember ingest`, NDJSON/stdin) | `cli` personal token | devs / Claude Code / Codex users pipe exports or scripted data; **also the dogfooding + fixture path** |
| **Admin / multi-tenant batch** | `admin:tenant` | internal onboarding/backfill across `subject_id`s within a tenant; **designed-for now, built later** |

Each event is normalized (`subject_id`, `source`, `day`, metrics, `confidence`, idempotency key `source:subject:day:type`); batches return **partial-success** per item. **D1 earns its place** here (cross-subject/tenant queries + admin reconciliation) alongside the per-user DO (token vault + per-`(tenant,user)` write serializer); `tenant_id` isolation throughout. **Multi-tenancy is internal-admin-first, B2B2C-ready** (confirm if a near-term B2B2C product is intended).

## 8. Finite-state machine (UI) — the reflective loop

No live-session screen. Persistent chrome: **your Ember · the Inner Country's season · connected device(s) · the Circle.** Non-destructive Back. (Mirrors the S0–S8 conference FSM idiom: `State` union + palette map + chrome.)

| State | Frontstage | Primary action → next |
|---|---|---|
| **E0 RETURN** | Open to the Inner Country **already changed** by how you've lived since last time; the Ember greets you. | Look closer → E1 |
| **E1 WITNESS** | What the Witness noticed (recovery/sleep/movement) rendered as light/weather — *never a score*. | Tend → E2 |
| **E2 TEND** | A fitting practice offered (breath/movement/rest) — *fuel, not a checklist*; or simply dwell. | Done / dwell → E3 |
| **E3 CIRCLE** | The Circle & any newly-woken companion; the dex/timeline of your living. | Atlas → E4 · Back → E0 |
| **E4 ATLAS** | The temperament, the Woken yet-to-wake, the Seasons. Read-only canon, grows with SKUs. | Back |
| **(Hush overlay)** | When untended: greying, recent tools asleep — felt, never cruel; the ember visibly holds. | Return any time |

## 9. Imaging (reuse the Bonsai spine)

The Inner Country, your Ember, and the Woken are rendered via the same-origin `/illustrate` proxy with dignity guardrails (`local_ai.IMAGE_GUARDRAILS`): a per-Ember **seed-locked** identity across Seasons and the dex; one prompt scaffold per temperament/Woken; **`CanvasImager`** synchronous fallback so it's alive offline (no spinners). Diffusion is an upgrade, never required.

## 10. Data model (`ember/types.ts`)

`DailySummary { day, source, recovery?, hrvMs?, restingHr?, sleep?, workouts?, confidence }` · `NourishmentScore` (§3) · `CountryState { warmth: Record<valley,0..1>, season, emberLevel }` (ember floor enforced) · `Ember { id, temperamentId, seed, bornAt, level }` · `Woken { id, awake, wakedAt? }` · `Circle { ember, support: Woken[] }` · `DexEntry { day, kind: "recovery"|"sleep"|"movement"|"practice", summary, lightDelta }` (append-only) · `TemperamentSpec` / `WokenSpec` (data, the blueprint seam).

## 11. Anti-extraction (the fence is the product)

Each prior-art leader monetizes a pressure; Ember refuses each (world bible map):

- **No death / neglect-guilt** (vs Forest/Tamagotchi) → the Hush + the ember floor.
- **No 0–100 judgment** (vs Whoop's red) → signal as a living world.
- **No self-report checklist or in-app currency/accessories** (vs Finch/Habitica) → the Witness senses; the Woken wake from witnessed practice.
- **No completism / gacha / scarcity** (vs Pokémon/Pop Mart) → one Circle, woken by living.
- **No engagement-maxing chat** (vs Replika) → sometimes Ember's job is to make you put the phone down.

## 12. Safety, privacy & governance

- **Two data planes.** *Device plane* (the dex, the engine, the Inner Country) is local. *Integration plane* (the Worker) holds **only encrypted OAuth refresh tokens** and reduces provider data to **derived daily summaries**; raw provider payloads are reduced and discarded, never persisted.
- **Least-privilege scopes** (Oura `personal daily heartrate`; Whoop `read:recovery read:cycles read:sleep read:profile offline`); transparent "what we read and why"; one-tap **disconnect** (revoke + purge) and **export all / wipe** the dex.
- **Provider ToS:** honor rate limits, signature verification, and **deletion** duties; submit the **Whoop approval** early. No PHI in iCloud; privacy policy in-app + store.
- **Not a medical device**; no diagnosis/alarms/advice. Dignity guardrails on all imagery.

## 13. Scope / non-goals (v1)

**In:** Ember + the Root temperament; the Witness over **Oura** (and **Whoop** to ≤10 users, approval pending), **manual UI input**, and the **`ember ingest` CLI** (personal-token, NDJSON); the normalized `/v1/ingest` contract; the deterministic engine; the Inner Country, the Hush, Seasons, the ember floor; **Bellows + Strider** woken-able; `IndexedDbStore` local dex; the Cloudflare broker; Bonsai + canvas imaging; export/wipe.
**Out / deferred:** any **live in-session signal** (camera-PPG/BLE/watchOS); **Strava**; **the Commons / social**; **Apple Health** (ambient, v2 — ADR-0001); **admin / multi-tenant batch ingest** (designed-for, built later — ADR-0002); the other three temperaments + four Woken; a dedicated object; remote sync; monetization.

## 14. Build order & sequencing

| Phase | Capability | Gate |
|---|---|---|
| **P1** | Pure engine: `nourish` / `country` / `circle` / `blueprint` (Root, Bellows+Strider) + vitest; a `FixtureSource`. *Proves the Hush, the ember floor, waking.* | none |
| **P2** | `EmberStore` (IndexedDb) + the reflective FSM (E0–E4 + Hush) in Svelte; `CanvasImager`. *Playable on fixtures.* | none |
| **P3** | **Cloudflare broker** (per-user SQLite DO + AES-GCM + Arctic) + the normalized **`/v1/ingest`** contract + **Oura** `SignalSource` (webhooks + daily reconciliation) + **manual UI input** + **`ember ingest` CLI** (personal token, NDJSON; doubles as the fixture/dogfood path). *First real device + DIY paths.* | Oura app reg (self-serve) |
| **P4** | **Whoop** `SignalSource`; **submit Whoop approval in parallel from P3.** | ≤10 users; approval queue (slow) |
| **P5** | `BonsaiImager` seed-locked renders; the Hush/Season visuals; export/wipe. | — |
| **P6+** | (v2) the Commons (Ember-native), more temperaments/Woken, Apple Health, dedicated object. | broker hardened |

**Critical path:** P1–P2 have zero external gates. Slowest external dependency = **Whoop approval** → submit at P3.

## 15. Testing

- **Unit (vitest, deterministic):** `nourish` on fixture summaries; `country` warmth/Hush/Season transitions + **ember-floor invariant** (never zero) + **growth monotonicity** (Hush never erases); `circle` waking from witnessed patterns; `EmberStore` round-trip + export/wipe; `CanvasImager` offline frame.
- **Source contracts:** `SignalSource` lifecycle + `capabilities`; `FixtureSource` reproducible; Oura/Whoop adapters against **recorded fixtures** (no live calls in CI).
- **Broker:** PKCE/state/CSRF; **refresh-rotation serialized via DO** (the key test); AES-GCM round-trip + IV uniqueness; webhook HMAC over raw body; raw→summary reduction discards raw.
- **Integration:** scripted fixture week (recovery + sleep + workout) brightens the right valleys, wakes Bellows/Strider, and Hushes on a lapse without erasing growth.
- **Offline:** UI + canvas with no broker / Bonsai down.
- **Optional Python proof:** mirror the engine in `src/pdm/ember/`, extend `proof.py`.

## 16. Verify-before-code (from research; vendor sites block fetch)

Exact field names (`hrv_rmssd_milli`, `average_hrv`), per-provider **PKCE** requirements, Oura **webhook subscription TTL**, Whoop `expires_in`, Whoop **approval UX requirements** for a "companion" app, and Cloudflare **Secrets Store GA** status. Confirm against live docs at build time.

---

## Appendix — fit with the existing workload

- **Deterministic, testable scoring** → `nourish`/`country`/`circle` ≈ `runtime.py` + `recursive_validation`.
- **Data-as-seam generativity** → `blueprint_temperaments()` ≈ `factory.blueprint_specs()`.
- **Append-only, inspectable, DB-free device memory** → `EmberStore` ≈ `InstitutionalMemory`.
- **Offline-first adapters with `available()`** → `SignalSource` ≈ `BonsaiWriter`/`BonsaiImageStudio`.
- **Emotion-driven discrete FSM UI** → E0–E4 ≈ the S0–S8 conference.
- **Dignified on-device imaging with canvas fallback** → the Inner Country ≈ the what-if spine, same proxy and guardrails.
- **Local-data covenant** → the device/integration two-plane split preserves "your interior data stays yours."

Ember is the repo's thesis — *feeling and intelligence should compound, locally and auditably* — pointed at a personal interior practice: a being bonded to how you actually are, that grows by your living and survives by a promise.
