# Ember — Product Direction & Architecture Spec

> **Now branded *Ember*.** The narrative canon lives in [`docs/EMBER_WORLD_BIBLE.md`](../../EMBER_WORLD_BIBLE.md); integration research lives in [`2026-06-17-integration-feasibility.md`](./2026-06-17-integration-feasibility.md). This spec is the technical/product translation of the bible. **Rev 3 is a partial update** — header, lexicon, and the research-driven changes below are reconciled; the deep rewrite (temperaments, the Circle/Woken collection, the Inner Country, the Hush, Seasons, the Commons) is **pending the open decisions in §16**, to avoid rewriting against unsettled direction.

- **Date:** 2026-06-17 (rev. 3 — Ember rebrand; research-driven changes; open decisions pending)
- **Status:** Draft (design); blocked on the open decisions in §16 before the full Ember reconciliation.

### Ember lexicon → this spec's earlier terms
| Ember term (canon) | Maps to / supersedes here |
|---|---|
| **your Ember** (the being you tend; can dim, never die) | "the companion"; the guardianship-with-rest bond is **confirmed and deepened** (the Hush = graceful rest; the ember always holds). |
| **the Witness** (senses how you lived; never scores/judges) | the signal layer (`coherence`/`nourish`). **Reframe: no 0–100 verdict** — render signal as a living world, not a score. |
| **Tending** (you live well; the Witness reflects light; never tap-to-feed) | the bond mechanic. |
| **the Circle (1+3)** + **the Woken (6: Bellows, Hearthkeeper, Strider, Lamplighter, Kin, Wisp)** | **Supersedes the earlier "one companion, no collection."** The collection is now a *meaningful team woken by real practice* — not gacha, not creature-completism. The "dex of your states" persists as the record beneath it. |
| **the four temperaments (Seer / Wright / Root / Ferry)** | the starter choice; **supersedes the earlier Tidewalker/Lumen/Ember species tree.** |
| **the Inner Country**, **the Hush**, **Seasons** | the world/state model (was "moods + rest + growth"). |
| **the Commons** | the social/retention layer (was deferred "connection-as-completion"). |

### Research-driven changes folded in (see feasibility doc)
- **The Witness has two tiers:** *live* coherence on-device via **camera-PPG / BLE strap** (HealthKit is **not** real-time), plus *passive* nourishment from **HealthKit / Oura / Whoop**.
- **Strava is demoted** from beachhead to an optional later "movement" power-up: its 2026 terms forbid showing data to anyone but the owner (**kills the social-graph wedge**), ban AI/ML training, and add a paid tier. **Lead with Apple Health + Oura.**
- **Sequencing:** universal core (no gate) → HealthKit → Cloudflare broker + Oura → Whoop (approval-gated, submit early) → Strava (optional) → Commons (Ember-native, never on Strava data).
- **Scope:** A connected biometric companion that reuses this repo's engine patterns — generative blueprint seam, compounding append-only memory, offline-first adapters, a discrete emotion-driven state machine, and on-device Bonsai imaging. A single creature you *guard*: it blooms on your regulated nervous-system state and rests (never dies, never nags) when the signal is gone. Its growth is logged as a living **dex of your own states**, and it evolves along an **extensible species taxonomy**. **iOS-first via HealthKit**, with a **universal heart-data core that runs on any device** and **brand-specific power-ups** unlocked by connecting Whoop, Oura, and Strava. Every signal source is an adapter behind one interface, so capability degrades and upgrades gracefully and a future dedicated object binds to the same seam.
- **Beachhead:** monthly-active **Strava** users who log several activity types (see §2).
- **Non-clinical:** a wellbeing companion, not a medical device. HRV/coherence is practice feedback, never diagnosis.

---

## 0. Directing decisions (locked)

| Question | Decision | Consequence |
|---|---|---|
| **Bond** | **Guardianship only** — it always needs you. | Keep dependency-as-meaning; *invert the punishment*. No death, no nagging, no neglect-guilt. Absence → the companion **rests**; it re-blooms the instant your signal returns. The dependency is "it can only bloom *through your regulated/recovered state*," not "it suffers when you leave." |
| **Collection** | **One deep companion + a dex of your own states.** | The "collection" is Pokémon's *dex-as-living-journal* pointed inward — your sessions, recoveries, and activities are the documented, growing record. No creature-collecting, no scarcity, no gacha. |
| **Form factor** | **iOS-first (HealthKit) + universal core + brand power-ups; object-ready seam.** | Ship a native-wrapped iOS app reading HealthKit on-device. A **universal core** runs on basic heart data available everywhere; connecting **Whoop / Oura / Strava** lights up **brand power-ups**. Each provider is one `SignalSource` adapter; a future wearable/object is just another adapter. |
| **Fiction** | **Extensible taxonomy now.** | Author an initial species/evolution tree as *data* through a `blueprint_species()` seam (the Factory pattern, reused). The world grows by adding `SpeciesSpec`s — "ship the seam, grow with SKUs." Brand integrations map onto the branches (§7). |

**The synthesis we are building:** Tamagotchi's *meaningful dependency* + Pokémon's *mutual growth, living dex, and connection-as-completion* + the collectible's *portability and projection* — fed by a real interior signal and stripped of all three shadows (guilt, gacha, manufactured scarcity). The anti-extraction stance is the wedge.

> **Constraint, addressed.** The original brief was "no DB, local storage only, strong dependency inversion." HealthKit and the universal core keep that covenant — fully on-device. **Whoop/Oura/Strava are OAuth 2.0 APIs with client secrets, refresh tokens, rate limits, and activity webhooks** that cannot run client-side, so brand power-ups need a **thin token broker**. We resolve this with a **Cloudflare Workers** backend (§11): serverless, no boxes to manage, with only a small encrypted store for refresh tokens — preserving the *spirit* of "minimal infra" rather than standing up a real DB. The core loop stays fully local; only the integration plane lives in the Worker.

---

## 1. Purpose

Most "AI companions" bond you to manufactured scarcity (blind boxes, FOMO tickets) or to obedience (feed-me-or-I-die). This one bonds to your **real interior state**. The core fiction, in one sentence: *the egg is the field of your attention; the atmosphere it needs to hatch and bloom is your coherence and recovery.* You co-regulate; you don't caretake. It proves the same thesis this repo proves for clinical reasoning — **feeling and intelligence should compound** — applied to a personal physiological practice: every session, recovery, and activity is logged; the companion grows as the practitioner does; the record is theirs.

## 2. Beachhead market & go-to-market wedge

**Target: monthly-active Strava users who log several activity types.** Why this segment is the right first network:

- **Habit already exists.** They open an app to *close the loop* on physical effort monthly+ — we attach meaning to a ritual they already keep, instead of manufacturing a new one.
- **Identity-invested & multi-modal.** Multi-sport loggers (run + ride + swim + strength…) are exactly the users our **variety** evolution gate rewards (§6 `EvolveRule.minVariety`); their diverse data makes the companion's growth visibly richer than a single-sport user's. The product's depth lands hardest on precisely this person.
- **Comfortable connecting apps.** Strava's whole culture is third-party connection (it's a hub, not a silo), so an OAuth "connect Strava" ask is native to the behavior — low friction for our first integration.
- **A social graph to grow into.** Strava is itself a social product. It gives us a credible, *non-extractive* path to Pokémon's **connection-as-completion** moat later (cohorts, shared blooms, kudos→care) without inventing a network from scratch. We defer building social in v1 but the beachhead makes it reachable.
- **Movement-led branch is the lead persona.** Strava data feeds the *Ember* (movement-led) evolution branch (§7), so the beachhead, the signal, and the fiction all point the same way.

**Wedge sequence:** universal core (any device, basic HR) → **Strava power-up** (the beachhead unlock) → Oura/Whoop power-ups (recovery depth) → HealthKit as the iOS substrate beneath all of it → (fast-follow) Strava-graph social.

## 3. The bond, made literal (the inversion)

Tamagotchi made *mortality* the mechanic and *guilt* the shadow. We keep the dependency and delete the punishment:

- **Bloom, not survival.** A continuous `vitality` rises with regulated/recovered state and gently decays toward **rest** (not death) in its absence. Rest is restful (curled, dim, slow-breathing), never sick or dying.
- **Instant revival.** The first good signal after any absence — a coherent breathing session, a logged activity, a solid recovery score — visibly revives it. No penalty, no "you neglected me," no lost progress. Long-term growth (level, dex, evolution) is **monotonic**.
- **Dependency as meaning, relocated.** It still needs you absolutely — but what it needs is your *regulated and recovered physiology*, given when you choose, not your obedience to a clock.

## 4. The signal: from biometrics to nourishment

The companion eats one derived currency — **nourishment** — synthesized from three signal classes, each from a different source tier. All derived deterministically so the engine is inspectable and unit-testable, like the clinical scorer.

| Signal class | What it is | Primary sources | Feeds branch |
|---|---|---|---|
| **Coherence** (active) | Real-time heart-rhythm resonance during paced breathing — ~0.1 Hz power + short-window HRV (RMSSD). | Universal core: live HR/RR via HealthKit, Bluetooth strap, or camera-PPG. | Breath-led (*Tidewalker*) |
| **Recovery** (passive, daily) | Overnight HRV, resting HR, readiness/recovery, sleep quality. | Oura readiness, Whoop recovery, HealthKit HRV/sleep. | Stillness-led (*Lumen*) |
| **Effort & rebound** (episodic) | Activity load, variety, and **HR recovery** after exertion. | Strava activities + HR streams, HealthKit workouts, Whoop strain. | Movement-led (*Ember*) |

- **Raw types** — `HrSample { t, rrIntervalsMs?, heartRateBpm? }`; `DailyReadiness { date, hrvMs, restingHr, score }`; `ActivitySummary { id, type, durationS, hrStream?, hrRecoveryBpm? }`.
- **`NourishmentScore`** — `{ coherence, recovery, effort, variety, confidence, t }`, each 0..1; `confidence` lets the UI honestly show "weak/partial signal" (camera-PPG, or no integration) without faking data.
- **Windows** — instantaneous (live reaction), session/day (the bloom earned), lifetime (dex + growth).
- **No raw stream persisted by default** — only derived summaries land in the dex (§12).

These are wellbeing signals, not diagnostics. We never label arrhythmia, never alarm, never advise.

## 5. Capability tiers (universal core + brand power-ups)

A first-class **progressive-capability model** — the natural extension of this repo's `available()` adapter philosophy. The app detects what's connected and lights up power-ups; nothing is gated behind payment, only behind *what data the user chooses to share*.

| Tier | Requires | Companion capability unlocked |
|---|---|---|
| **T0 — Universal core** | Basic heart data on any device (HealthKit / Bluetooth strap / camera-PPG). | The full bond: live coherence sessions, bloom/rest, the dex, the Breath-led branch. **The product is complete and meaningful at T0.** |
| **T1 — Strava power-up** *(beachhead)* | Connect Strava (OAuth). | Activities nourish the companion; **HR-recovery** and **variety** mechanics; the Movement-led (*Ember*) branch; per-activity-type "expressions." |
| **T1 — Oura power-up** | Connect Oura. | Passive overnight **recovery** nourishment; the Stillness-led (*Lumen*) branch; "wakes up rested" mornings. |
| **T1 — Whoop power-up** | Connect Whoop. | Strain + recovery balance; recovery-gated evolution flourishes; "earned rest" mechanic. |
| **T2 — Stacked** | Multiple integrations. | Cross-signal blooms (e.g., hard Strava effort + strong Oura recovery → a rare radiant state); fuller dex; faster, more-branched evolution. |

**Power-ups add capability; they never ration the core.** This is the explicit anti-extraction posture: a free, device-only user has a real companion; integrations make it *richer*, not *un-crippled*.

## 6. Abstraction (module layers; dependencies point inward to the engine)

The core engine is **pure, deterministic TypeScript** (the live signal is client-side; the UI must react in real time). Every I/O concern is an interface injected at one composition root, mirroring the repo's `available()` adapters (`src/pdm/local_ai.py`) and the Factory blueprint seam (`src/pdm/factory.py:blueprint_specs`).

| Module (proposed) | New? | Single purpose | Mirrors today |
|---|---|---|---|
| `companion/coherence.ts` | new | Pure: `HrSample[] → coherence/arousal`. No I/O. | `runtime.py` scoring |
| `companion/nourish.ts` | new | Pure: signal classes → `NourishmentScore`. | `runtime` scoring |
| `companion/engine.ts` | new | Pure reducer: `(CompanionState, NourishmentScore, dt) → CompanionState`; mood + growth + evolution gates. | `recursive_validation` |
| `companion/species.ts` | new | `blueprint_species(): SpeciesSpec[]` — taxonomy + evolution rules as **data**; model-proposed with deterministic fallback. | `factory.blueprint_specs()` — *the seam* |
| `companion/types.ts` | new | Typed contracts. | `app/src/lib/types.ts` |
| **`SignalSource`** (interface) | new | `available()` · `start(cb)` / `fetch()` · `stop()` · `capabilities`. Impls: `HealthKitSource`, `BluetoothHrSource`, `CameraPpgSource` (live HR); `StravaSource`, `OuraSource`, `WhoopSource` (integration). Each declares which signal classes it provides. | `BonsaiWriter/ImageStudio.available()` |
| **`CompanionStore`** (interface) | new | Append-only local persistence: `appendDexEntry`, `load/saveCompanion`, `exportAll`, `wipe`. Impls: `LocalStorageStore`/`IndexedDbStore` (device), later `RemoteStore`. | `InstitutionalMemory` JSONL |
| **`CompanionImager`** (interface) | new | `render(state) → image`. Impls: `CanvasImager` (offline), `BonsaiImager` (via `/illustrate`). | what-if frame + fallback |
| **`IntegrationBroker`** (interface; impl = **Cloudflare Worker**) | new | OAuth token exchange/refresh + webhook ingest + rate-limited fetch for Strava/Oura/Whoop. Returns *derived* summaries to the device; never the engine's home. BFF token-broker, served from the edge. | *(new — the one backend piece; see §11)* |
| `companion/store.svelte.ts` | new | Svelte 5 `$state` FSM (C0–C6) + composition root injecting the chosen impls. | `app/src/lib/store.svelte.ts` |
| `src/pdm/web.py` | extend | Serve the app; keep `/illustrate`; host a **local dev broker** (fixture-backed `IntegrationBroker` for offline/CI). Production broker is the Cloudflare Worker (§11). | stdlib server + proxy |
| *(optional)* `src/pdm/companion/` | later | Python mirror of `coherence`/`nourish`/`engine` + proof harness. | `proof.py` |

**No cycles.** Device flow: `SignalSource → coherence/nourish → engine → store (UI) → Imager + CompanionStore`. Integration flow: `device → IntegrationBroker (OAuth + fetch/webhook) → derived summary → SignalSource adapter → same engine`. The engine knows only interfaces; HealthKit (local) and Strava (brokered) are indistinguishable to it.

## 7. Data model & taxonomy

**Core types** (`companion/types.ts`): `HrSample`, `DailyReadiness`, `ActivitySummary`, `NourishmentScore`, `CompanionMood` (`DORMANT→STIRRING→SETTLING→COHERENT→RADIANT`), `Companion { id, speciesId, stageId, level, vitality, lifetimeMinutes, streakDays, seed, bornAt }`, `SpeciesSpec`, `StageSpec`, `EvolveRule { minLifetimeMinutes, minStreakDays?, dominantModality?, minVariety? }`, `DexEntry { t, kind: "session"|"recovery"|"activity", summary, moodArc, modality }` (append-only).

**Initial taxonomy (data, illustrative)** — `blueprint_species()` returns:
- **Base — "Mote"**: a spark of attention (the egg). Hatches on first nourishment.
- **Branches by dominant modality**, which is exactly where the brand power-ups feed:
  - **Breath-led → *Tidewalker*** (coherence; universal core / HealthKit live HR).
  - **Stillness-led → *Lumen*** (recovery; Oura / Whoop / HealthKit sleep & HRV).
  - **Movement-led → *Ember*** (effort & rebound; **Strava** / HealthKit workouts / Whoop strain).
- **Stages gate on cumulative nourishment + consistency + variety** — never payment or rarity. Multi-source (T2) users can reach **hybrid/rare** stages (e.g., Ember×Lumen radiant) — the reward for a balanced practice, the anti-gacha source of "specialness."

`seed` locks visual identity across renders/states (the what-if seed-lock mechanic); evolution is outcome-uncertain (Tamagotchi's pull) and shaped by your real pattern of practice.

## 8. Finite-state machine (UI)

Mirrors the S0–S8 conference FSM: typed `State` union, palette/`EMOTION` map, persistent chrome, non-destructive Back. Chrome: **live companion · mood · connected sources & tier · lifetime minutes · streak (celebrated, never shamed)**.

| State | Frontstage | Primary action → next |
|---|---|---|
| **C0 NEST** | Companion at rest; warm dex summary; "connect more to nourish it." | Begin → C1 |
| **C1 ATTUNE** | Pick today's signal; show connected integrations + `available()` per source, honestly. **Connect Strava/Oura/Whoop** lives here (power-up tray). | Start → C2 |
| **C2 SESSION** | The core loop: full-bleed companion reacting in real time to live coherence; optional paced-breathing guide. Loudest screen. | End → C3 |
| **C3 BLOOM** | Payoff: nourishment earned (this session **and** any passive recovery/activity since last open), companion reaction, dex entry, growth ticks. | Dex → C4 · Again → C2 |
| **C4 DEX** | Living journal: sessions + recoveries + activities timeline, growth arc, progress to next evolution. | Back → C0 · evolve-ready → C5 |
| **C5 GROW** | Evolution moment: seed-locked Bonsai render of the new form, lineage preserved. Monotonic gain. | Continue → C4 |
| **C6 ATLAS** | The species atlas — branches, brand-power-up hints ("connect Strava to walk the Ember path"). Read-only canon, grows with SKUs. | Back |

**C3 → C2 is the practice loop;** each open starts the companion warmer, now also fed by *passive* recovery/activity ingested since last session.

## 9. On-device imaging (reuse the Bonsai spine)

Reuse the same-origin `/illustrate` proxy and dignity guardrails (`local_ai.IMAGE_GUARDRAILS`): seed-locked identity across moods/states/dex; one prompt scaffold per stage; `CanvasImager` synchronous fallback when the studio is down (no spinners). Brand expressions (e.g., an *Ember* form's post-run glow) are prompt modifiers, not separate assets. Diffusion is an upgrade, never required.

## 10. Technical feasibility

| Capability | Approach | Feasibility / risk |
|---|---|---|
| **iOS native + HealthKit** | Wrap the existing Svelte app in **Capacitor** (or Expo) and read HealthKit via a plugin — preserves the committed frontend + FSM, gains App Store distribution and Android later via the same shell. Full native Swift is the alternative (best HealthKit ergonomics, abandons the web app). | **Solid; recommend Capacitor.** HealthKit is read-only on-device, no backend. |
| **Live HR / HRV core** | HealthKit (iOS); Web Bluetooth HR straps (Polar H10 → RR) on Android/desktop; camera-PPG fallback (HR only, low confidence). | Solid on iOS/Android; camera experimental. |
| **Strava** *(beachhead)* | OAuth 2.0; `activity:read`; **webhook** for new activities; per-activity HR streams. Requires the broker. | **Solid API**, generous for read. Rate limits (per-app + per-15-min) → cache derived summaries. App registration required. |
| **Oura** | OAuth 2.0 (or Personal Access Token for solo/dev); daily readiness/sleep/HRV. | Solid; PAT path enables a **local-only** early build (§11). |
| **Whoop** | OAuth 2.0; recovery/strain/HRV/sleep; webhooks. | **Partner approval / access tier is the gating risk** — sequence Whoop *after* Strava + Oura. |
| **Token broker backend** | **Cloudflare Workers** BFF: OAuth exchange/refresh (Secrets), encrypted refresh-token storage (KV/D1), per-user Durable Objects, Cron refresh, webhook receivers → returns derived summaries only. | **Solved without servers or a real DB.** Serverless edge; only persisted state is encrypted refresh tokens. See §11. |
| **Persistence (device)** | `LocalStorageStore` → `IndexedDbStore` behind `CompanionStore`; dex is time-series, IndexedDB recommended once integrations stream daily data. | Trivial; no server DB for the dex. |
| **Carried / portable** | Native app icon on the home screen *is* the portability story (the collectible steal), now with App Store legitimacy. | Solid. |

**Net:** the **universal core is fully local and buildable now**; the **integration layer needs the broker**, and **Whoop access approval** is the longest-lead external dependency.

## 11. The integration broker — Cloudflare Workers (the one backend)

A **Cloudflare Worker** is the smallest thing that solves the OAuth/webhook problem without managing servers or a real database. It plays the **Backend-for-Frontend (BFF) token-broker** role: the app talks only to our Worker, never to providers directly; the Worker holds secrets, brokers tokens, ingests webhooks, and hands the device *derived summaries only*.

**Cloudflare primitives → broker responsibilities:**

| Need | Cloudflare primitive |
|---|---|
| Client secrets / signing keys | **Workers Secrets** (encrypted env, never shipped to the app). |
| Refresh-token storage (the only persisted state) | **Workers KV** (simple) or **D1** (SQLite, if we want queryable per-user rows); values **encrypted at rest** with a key from Secrets. |
| Per-user coordination, webhook fan-in, rate-limit counters | **Durable Objects** (one per user) — serializes token refresh and dedupes provider webhooks. |
| Scheduled token refresh / Oura daily pull | **Cron Triggers**. |
| Edge HTTP for OAuth callback + webhook receivers | The Worker `fetch` handler itself. |

**Endpoints (Worker routes):** `/integrations/{provider}/start` → PKCE auth redirect; `/integrations/{provider}/callback` → code-for-token exchange, encrypt+store refresh token; `/integrations/{provider}/webhook` → signature-verified ingest → reduce to summary → push to device (or queue for next app open); `/integrations/{provider}/sync` → rate-limited pull. **Raw streams are reduced in the Worker and discarded; only summaries persist briefly / leave the edge.**

**Dependency inversion holds:** the Worker is one concrete implementation of the `IntegrationBroker` interface (§6). The device app is broker-agnostic — point it at the Worker URL via config; a different host (or the `web.py` dev stub) swaps in without touching the engine, the dex, or the UI. `web.py` can host a **local dev broker** for fixture-based development so CI and offline work never touch Cloudflare.

**Local-only fallback (if we defer the Worker):** T0 core + **Oura via user-pasted Personal Access Token** (no secret, no callback) + **Strava manual `.gpx` import**. Fully local, worse UX, no live webhooks — a stopgap, not the destination.

### 11a. The common standard for these integrations

What we describe above *is* the de-facto industry pattern for wearable/fitness OAuth APIs; documenting it so the team builds to a known shape:

- **OAuth 2.0 Authorization Code + PKCE.** The standard for Strava, Oura, Whoop, Fitbit, Garmin, Google Fit. PKCE protects the code exchange even though a confidential client is used.
- **Confidential client / BFF.** The `client_secret` lives **only** server-side (the Worker). The mobile/web app is treated as a public client and never holds the secret — the reason a backend is non-negotiable for these providers.
- **Short-lived access token + long-lived refresh token**, refreshed server-side ahead of expiry; tokens **encrypted at rest**; least-privilege scopes (e.g. Strava `activity:read`).
- **Webhooks for push, polling for pull.** Strava and Whoop push events (new activity / new data) to a registered, **signature-verified** webhook (Strava uses a subscription + verify-token handshake; verify HMAC signatures where provided). Oura is primarily **pull** (poll daily summaries on a cron), with PAT support for solo use.
- **Rate-limit discipline.** Per-app and short-window limits (e.g. Strava's 15-minute + daily caps) → cache derived summaries, back off, and never fan a webhook into N synchronous fetches.
- **Data-deletion obligations.** Each provider's ToS requires honoring user disconnect/deletion; one-tap **disconnect** revokes the token and purges stored state (§13).

This is exactly the **token-broker / BFF-for-OAuth** pattern, and it is a clean extension of the same-origin server-to-server proxy `web.py` already runs for Bonsai (`/illustrate`, `/narrate`) — now pointed at OAuth providers from the edge.

## 12. Scope / non-goals (YAGNI)

**In (v1):** iOS-wrapped app; universal T0 core (HealthKit + Bluetooth + camera); deterministic engine; `LocalStorageStore`; canvas + Bonsai imaging; C0–C6 FSM; the 3-branch taxonomy as data; **Strava power-up via the broker** (beachhead); **Oura power-up**; dex export + wipe.
**Out / deferred (behind seams):** **Whoop** (sequence after partner approval); dedicated object / Android GA; **Strava-graph social / connection-as-completion** (fast-follow — the beachhead makes it reachable, but it needs the broker hardened + a real backend); remote sync; multi-companion collecting; any monetization.

## 13. Safety, privacy & governance

- **Two data planes, clearly separated.** *Device plane* (HealthKit, live HR, the dex, the engine) is local — "no biometric data leaves the device," mirroring the clinical covenant. *Integration plane* (the broker) holds **only OAuth refresh tokens (encrypted) and reduces provider data to derived summaries server-side**, never persisting raw streams. Name this split explicitly to users.
- **Least-privilege scopes** per provider (e.g., Strava `activity:read` only); transparent "what we read and why"; one-tap **disconnect** (revoke + delete tokens) and **export all / wipe** the dex.
- **Provider ToS compliance** — honor Strava/Oura/Whoop rate limits, attribution, and data-deletion obligations; webhook auth verified.
- **Not a medical device** — no diagnosis, no arrhythmia labeling, no alarms, no advice; coherence/recovery framed as practice feedback. Visible non-clinical disclaimer.
- **Dignity guardrails** on imagery (reuse `IMAGE_GUARDRAILS`): no fear, no body-shaming, nothing medicalized.
- **Anti-extraction, enforced:** no gacha, no pay-to-progress, no manufactured scarcity, no coercive streaks; power-ups add capability and never ration the core.
- **Paced breathing** is optional, gentle, skippable; never instructs breath-holding.

## 14. Testing

- **Unit (vitest, deterministic):** `coherence.ts`/`nourish.ts` on known series (flat vs resonant; a recovery score; an activity with HR recovery → expected nourishment); `engine.ts` transitions + `EvolveRule` gating incl. **hybrid stage** from stacked signals; growth monotonicity (absence never regresses); `LocalStorageStore` round-trip + export/wipe; `CanvasImager` offline frame.
- **Source contracts:** every `SignalSource` honors `available()`/`capabilities`/lifecycle; `SimulatedSource` reproducible from a seed; integration adapters tested against **recorded provider fixtures** (no live calls in CI).
- **Broker:** OAuth state/PKCE handling; refresh-token encryption round-trip; webhook signature verification; rate-limit backoff; raw→summary reduction discards raw.
- **Integration:** scripted multi-signal sequence (sim coherence + fixture Strava activity + fixture Oura day) writes the right `DexEntry`s, ticks vitality, fires the hybrid evolution.
- **Offline / partial:** UI works with no integrations and Bonsai down (T0 + canvas).
- **Optional Python proof:** mirror engine in `src/pdm/companion/`, extend `proof.py` with companion criteria.

## 15. Build order (phased; each phase demoable)

1. **Engine core.** `types/coherence/nourish/engine/species` + vitest. Pure, no UI, no I/O. *Proves math + growth + hybrid evolution.*
2. **Device persistence + dex.** `CompanionStore` + `LocalStorageStore`; growth wired to dex. *Compounding, no server.*
3. **UI FSM + universal core.** `companion/store.svelte.ts` + C0–C6 mirroring `app/src/lib/states/`; `SimulatedSource` + `CameraPpgSource`; `CanvasImager`. *First playable, web.*
4. **iOS wrap + HealthKit.** Capacitor shell; `HealthKitSource` (live HR + recovery + workouts); App Store-ready core. *Real on-device signal, T0 complete.*
5. **Broker + Strava power-up (beachhead).** `IntegrationBroker` in `web.py`; `StravaSource`; activities/HR-recovery/variety → Ember branch. *The wedge unlock.*
6. **Oura power-up + Bonsai imaging.** `OuraSource` (recovery → Lumen); `BonsaiImager` seed-locked renders; C5 evolution moment; C6 Atlas. *Depth + the creature seen.*
7. **Dex export + bloom card.** export/wipe; shareable milestone image (the case-study-hero analogue). *The record + first social seed.*
8. **(Future)** Whoop (post-approval); Strava-graph social/connection-as-completion; dedicated object `SignalSource`; remote store. *Behind the seams.*

---

## Appendix — why this fits the existing workload

Every novel concept has a working ancestor in the repo:

- **Deterministic, testable scoring** → `coherence.ts`/`nourish.ts`/`engine.ts` ≈ `runtime.py` + `recursive_validation`.
- **Data-as-seam generativity** → `blueprint_species()` ≈ `factory.blueprint_specs()`.
- **Append-only, inspectable, DB-free device memory** → `CompanionStore` ≈ `InstitutionalMemory` (JSONL).
- **Offline-first adapters with `available()` / graceful capability** → `SignalSource` family + tiered power-ups ≈ `BonsaiWriter`/`BonsaiImageStudio` + the existing "degrade gracefully when a server is down" philosophy.
- **Emotion-driven discrete FSM UI** → C0–C6 ≈ S0–S8 (`State` union + `EMOTION` map + chrome).
- **On-device dignified imaging with canvas fallback** → companion renders ≈ the what-if spine, same proxy and guardrails.
- **Same-origin server-to-server proxy for CORS-less local services** → the `IntegrationBroker` extends the exact pattern `web.py` already uses for Bonsai (`/illustrate`, `/narrate`) to OAuth providers.
- **Local-data covenant** → the device/integration two-plane split preserves "biometric data stays on the device" while quarantining the one place (refresh tokens) that genuinely cannot.

Ember is the repo's thesis — *feeling and intelligence should compound, locally and auditably* — pointed at a personal interior practice: a being bonded to how you actually are, that grows by your living and survives by a promise.

---

## 16. Open decisions (blocking the full Ember reconciliation)

From the world bible plus the integration research. The deep rewrite waits on these.

1. **Name** — *Ember* (recommended) vs Tend / Kindling / Hearth. Decides the whole lexicon.
2. **Hardware / signal stance for v1** — phone-only universal core (camera-PPG) with *ingest-what-you-own* wearables, vs Apple-Health-first, vs a dedicated object later.
3. **Strava** — demote to an optional owner-only "movement" power-up (recommended), or drop for v1, or keep as beachhead despite the 2026 ToS.
4. **The Commons (social) timing** — v2 / prove the solo soul first (recommended) vs v1.
5. **Whoop** — begin the ≤10-user build + submit approval now (parallel, off critical path), or defer entirely.
6. **MVP starter temperament** — Root or Seer (the treatment's two candidates for "most universal").

See the live-latency, Apple-Watch-assumption, and verify-before-code items in the feasibility doc §8.
