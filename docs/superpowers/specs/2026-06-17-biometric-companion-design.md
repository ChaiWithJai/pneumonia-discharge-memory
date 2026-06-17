# Biometric Companion (Coherence Tamagotchi) — Design Spec

- **Date:** 2026-06-17
- **Status:** Draft (design); pending direction sign-off → implementation plan
- **Scope:** A new product surface that reuses this repo's engine patterns — generative blueprint seam, compounding append-only memory, offline-first adapters, a discrete emotion-driven state machine, and on-device Bonsai imaging — to build a **connected biometric companion**. A single creature you *guard*: it blooms on your regulated nervous-system state and rests (never dies, never nags) when the signal is gone. Its growth is logged as a living **dex of your own coherence states**, and it evolves along an **extensible species taxonomy**. App-first (web/PWA) on the current stack, with every external dependency behind an interface so a wearable or dedicated carried object can bind to the same seams later.
- **Non-clinical:** This is a wellbeing companion, not a medical device. HRV/coherence is framed as practice feedback, never diagnosis. No biometric data leaves the device.

---

## 0. Directing decisions (locked)

The four open directing questions from the brief are resolved as follows, and the rest of this spec follows from them:

| Question | Decision | Consequence |
|---|---|---|
| **Bond** | **Guardianship only** — it always needs you. | Keep dependency-as-meaning; *invert the punishment*. No death, no nagging, no neglect-guilt. Absence → the companion **rests**; it re-blooms the instant you return to coherence. The dependency is "it can only bloom *through your regulated state*," not "it suffers when you leave." |
| **Collection** | **One deep companion + a dex of your own states.** | The "collection" is Pokémon's *dex-as-living-journal* pointed inward — your sessions/states are the documented, growing record. No creature-collecting, no scarcity, no gacha. |
| **Form factor** | **App-first now, object-ready seam.** | Ship as an installable PWA on the current Svelte + stdlib-server stack; biometrics arrive through a `BiometricSource` interface. A wearable bridge or dedicated object binds to the same interface later with zero engine changes. |
| **Fiction** | **Extensible taxonomy now.** | Author an initial species/evolution tree as *data* through a `blueprint_species()` seam (the Factory pattern, reused). The world grows by adding `SpeciesSpec`s — "ship the seam, grow with SKUs." |

**The synthesis we are building:** Tamagotchi's *meaningful dependency* + Pokémon's *mutual growth and living dex* + the collectible's *portability and projection* — fed by a real interior signal (HRV-derived coherence) and stripped of all three shadows (guilt, gacha, manufactured scarcity). The anti-extraction stance is the wedge, exactly as the AI-collectible category fails to be.

---

## 1. Purpose

Most "AI companions" bond you to manufactured scarcity (blind boxes, FOMO tickets) or to obedience (feed-me-or-I-die). This one bonds to your **real interior state**. The core fiction, in one sentence (the Tamagotchi "ship one sentence of lore" lesson): *the egg is the field of your attention; the atmosphere it needs to hatch and bloom is your coherence.* You co-regulate; you don't caretake. The product proves the same thesis this repo already proves for clinical reasoning — that **intelligence/feeling should compound** — applied to a personal nervous-system practice: every session is logged, the companion grows as the practitioner does, and the record is yours and local.

This is a reference implementation / work sample. Synthetic and live biometric signals demonstrate the architecture; no data leaves the device; nothing here is medical advice.

## 2. Actors & Jobs-to-be-Done

| Actor | Job (when / want / so) | "Done" test |
|---|---|---|
| **Practitioner** (primary) | When I want to settle my nervous system, I want a companion that visibly responds to my real coherence, so the practice feels like a relationship, not a chore. | From any screen I know my companion's state, whether my signal is live, and the one next action. The session loop needs zero instruction. |
| **The companion** (the point) | When the practitioner is regulated, I want to bloom and grow; when they're away, I want to rest gracefully, so the bond is meaningful without being coercive. | It never shames, never dies, never nags. Returning to coherence always revives it within seconds. |
| **The returning self** (downstream) | When I look back, I want a living dex of my states and my companion's growth, so I can see the arc of my own practice. | One scannable timeline; export + delete my whole record in one action. |
| **Future surfaces** (wearable / object / cohort) | When new hardware or a social graph arrives, I want to bind to the existing engine, so we don't rewrite the core. | A new `BiometricSource` / `CompanionStore` implementation drops in at the composition root; the engine is untouched. |

**Usability contract:** self-evident screens; the live session is the loudest thing on the screen; the companion's state is always legible; no streak-shaming, no dark patterns, no instructional paragraphs.

## 3. The bond, made literal (the inversion)

Tamagotchi made *mortality* the mechanic and *guilt* the shadow. We keep the dependency and delete the punishment:

- **Bloom, not survival.** The companion has a continuous `vitality` that rises with sustained coherence and gently decays toward **rest** (not death) in its absence. Rest is a restful visual state (curled, dim, breathing slowly), not a sick or dying one.
- **Instant revival.** The first coherent breaths after any absence visibly revive it. There is no penalty, no "you neglected me," no lost progress. Long-term growth (level, dex, evolution) is **monotonic** — it never regresses.
- **Dependency as meaning, relocated.** It still needs you absolutely — but what it needs is your *regulated state*, available any time you choose to give it, not your obedience to a clock. That is the entire ethical pivot.

## 4. The signal: from biometrics to coherence

The companion is driven by one derived scalar, **coherence ∈ [0,1]**, plus a coarse **arousal** read (calm ↔ activated). Computed deterministically from the raw stream so the engine is inspectable and unit-testable, exactly like the clinical scorer.

- **Raw input** — `BiometricSample { t, rrIntervalsMs?: number[], heartRateBpm?: number, source }`. RR intervals (inter-beat intervals) are the gold input; bare heart rate is the degraded fallback.
- **Coherence** — resonance of the heart-rhythm pattern: power concentrated in the ~0.1 Hz band during paced breathing (the HeartMath-style resonance read), combined with short-window HRV (RMSSD). High, smooth, sinusoidal HRV → high coherence.
- **Arousal** — heart rate relative to a personal resting baseline + HRV suppression → a calm/activated read for mood/color.
- **Windows** — instantaneous (companion's live reaction, ~5 s), session (the bloom earned), lifetime (dex + growth).
- **No raw stream is persisted by default** — only derived per-session summaries land in the dex. (See §13.)

These are wellbeing signals, not diagnostics. We never label arrhythmia, never alarm, never advise.

## 5. Abstraction (module layers; dependencies point inward to the engine)

The core engine is **pure, deterministic TypeScript** (the signal is inherently client-side: Web Bluetooth / camera / real-time UI). Every I/O concern is an interface injected at a single composition root, mirroring this repo's existing `available()` adapters (`src/pdm/local_ai.py`) and the Factory blueprint seam (`src/pdm/factory.py:blueprint_specs`). Strong dependency inversion is the explicit design constraint.

| Module (proposed) | New? | Single purpose | Mirrors today |
|---|---|---|---|
| `app/src/lib/companion/coherence.ts` | new | Pure functions: `BiometricSample[] → CoherenceScore`. No I/O. | `runtime.py` deterministic scoring |
| `app/src/lib/companion/engine.ts` | new | Pure reducer: `(CompanionState, CoherenceScore, dt) → CompanionState`. Short-term mood + long-term growth/evolution gates. | `runtime.recursive_validation` (deterministic, testable) |
| `app/src/lib/companion/species.ts` | new | `blueprint_species(): SpeciesSpec[]` — the taxonomy + evolution rules as **data**. Swap for a model-proposed spec with deterministic fallback. | `factory.blueprint_specs()` — *the seam* |
| `app/src/lib/companion/types.ts` | new | Typed contracts (samples, scores, state, species, dex entries). | `app/src/lib/types.ts` |
| **`BiometricSource`** (interface) | new | `available(): Promise<bool>` · `start(cb)` · `stop()`. Impls: `SimulatedSource`, `WebBluetoothHeartRateSource`, `CameraPpgSource`; later `WearableBridgeSource` / `ObjectSource`. | `BonsaiWriter.available()` / `BonsaiImageStudio.available()` adapter idiom |
| **`CompanionStore`** (interface) | new | Append-only persistence: `appendDexEntry`, `loadCompanion`, `saveCompanion`, `exportAll`, `wipe`. Impls: `LocalStorageStore` (v1), later `IndexedDbStore` / `RemoteStore`. | `InstitutionalMemory` append-only JSONL |
| **`CompanionImager`** (interface) | new | `render(state): Promise<Blob>`. Impls: `CanvasImager` (offline, synchronous), `BonsaiImager` (via the existing `/illustrate` proxy). | what-if frame: Bonsai render with canvas fallback |
| `app/src/lib/companion/store.svelte.ts` | new | Svelte 5 `$state` machine for the UI FSM (C0–C6) + composition root that injects the chosen impls. | `app/src/lib/store.svelte.ts` (`Conference`) |
| `src/pdm/web.py` | extend | Serve the PWA (already does); keep `/illustrate` proxy; add PWA headers + companion image prompt. No new state on the server. | existing stdlib server + Bonsai proxy |
| *(optional)* `src/pdm/companion/` | later | A Python mirror of `coherence` + `engine` + a proof harness, for the deterministic-proof culture you already keep. | `proof.py` |

**No cycles.** Data flow: `BiometricSource → coherence.ts → engine.ts → store (UI state) → CompanionImager (render) + CompanionStore (persist dex/growth)`. Everything below the engine is replaceable; the engine knows only interfaces.

## 6. Data model (`companion/types.ts`)

- `BiometricSample`: `{ t: number, rrIntervalsMs?: number[], heartRateBpm?: number, source: SourceKind }`.
- `CoherenceScore`: `{ coherence: 0..1, arousal: 0..1, rmssdMs: number, confidence: 0..1, t }` — `confidence` lets the UI honestly show "weak signal" (e.g., camera PPG) without faking a reading.
- `CompanionMood` (short-term enum): `DORMANT → STIRRING → SETTLING → COHERENT → RADIANT`. (Parallels `RuntimeState`; drives color/animation like the `EMOTION` map in today's store.)
- `Companion`: `{ id, speciesId, stageId, level, vitality: 0..1, lifetimeCoherenceMinutes, streakDays, seed, bornAt }`. `seed` locks visual identity across renders/states (the seed-lock mechanic from the what-if spine).
- `SpeciesSpec`: `{ id, name, oneLineLore, stages: StageSpec[], evolvesFrom?, branchOn?: ModalityWeights }`. Data, not code — the blueprint seam.
- `StageSpec`: `{ id, name, promptScaffold, evolveWhen: EvolveRule }`.
- `EvolveRule`: declarative gate — `{ minLifetimeMinutes, minStreakDays?, dominantModality?, minVariety? }`. Evolution is **outcome-uncertain** (Tamagotchi's pull): your *pattern of practice* shapes the branch; you don't pick it.
- `DexEntry` (the living journal row): `{ t, durationS, peakCoherence, meanCoherence, coherenceMinutes, moodArc: CompanionMood[], modality, note? }`. Append-only.
- `CompanionState` (engine's reducer state): `{ companion: Companion, mood: CompanionMood, instCoherence: number }`.

## 7. The taxonomy (initial canon, as data)

Authored up front per the "extensible taxonomy now" decision, but expressed entirely through `SpeciesSpec` data so adding to the world is a content change, not an engineering one. Illustrative starting tree (final art/names TBD with design):

- **Base — "Mote"**: a spark of attention (the egg). Hatches on first sustained coherent session.
- **Branch by dominant regulation modality** over the first stretch of practice (the engine tracks how you most often reach coherence):
  - **Breath-led →** *Tidewalker* line (resonant ~0.1 Hz breathing; oceanic, tidal motion).
  - **Stillness-led →** *Lumen* line (steady high-HRV stillness; luminous, slow).
  - **Movement-led →** *Ember* line (coherence reached around active recovery / good HR recovery; warm, kinetic).
- **Stages gate on cumulative coherence-minutes + consistency + variety** (`EvolveRule`), never on payment or rarity. A practitioner discovers their branch by practicing; that uncertainty is the engagement, ethically sourced.

`blueprint_species()` returns this tree; a Bonsai model may later *propose* a species (`origin: "bonsai_proposed"`) with the deterministic blueprint as the safe fallback — exactly the Factory's spec-proposal pattern.

## 8. Finite-state machine (UI)

Mirrors the existing S0–S8 conference FSM: a typed `State` union, an `EMOTION`/palette map, persistent chrome on every screen, and non-destructive Back. Persistent chrome: **companion avatar (live) · current mood · source status (live/weak/off) · lifetime coherence-minutes · streak (celebrated, never shamed)**.

| State | Frontstage | Primary action → next |
|---|---|---|
| **C0 NEST** (lobby) | Companion at rest in its nest; warm dex summary ("you've practiced N minutes; it's a *Tidewalker*"). | Begin → C1 |
| **C1 ATTUNE** | Choose the signal: detected Bluetooth strap / camera (experimental) / simulated. Shows `available()` per source, honestly. | Connect → C2 |
| **C2 SESSION** (the core loop) | Full-bleed companion responding in real time to live coherence; optional paced-breathing guide; mood shifts DORMANT→…→RADIANT. The loudest screen. | End session → C3 |
| **C3 BLOOM** | Session payoff: coherence earned, companion reaction, dex entry written, growth ticks (vitality, lifetime minutes, level). | See dex → C4 · or Again → C2 |
| **C4 DEX** | The living journal: timeline of sessions/states, companion growth arc, progress toward next evolution. (The inward Pokédex.) | Back → C0 · evolution ready → C5 |
| **C5 GROW** | Evolution moment when an `EvolveRule` fires: a seed-locked Bonsai render of the new form, lineage preserved. Monotonic — always a gain. | Continue → C4 |
| **C6 ATLAS** (taxonomy surface) | The species atlas — what this companion could become, branch hints. Read-only world canon; grows as SKUs are added. | Back |

**C3 → C2 is the practice loop;** each session starts the companion warmer (higher resting vitality, closer to next evolution). This is the compounding curve, re-skinned from the conference's S7→S2.

## 9. On-device imaging (reuse the Bonsai spine)

The companion is *seen* reacting — the collectible's "portability + projection" steal, but earned. Reuse the existing same-origin `/illustrate` proxy and dignity guardrails (`local_ai.IMAGE_GUARDRAILS`):

- **Seed-locked identity:** `Companion.seed` feeds the studio `seed` param so the creature looks like *itself* across moods, states, and the dex (the what-if seed-lock mechanic).
- **One prompt scaffold per stage** (`StageSpec.promptScaffold`) carrying species look + current mood + guardrails (no fear, no gore, no text — and here, nothing body-shaming or medicalized).
- **Offline-first:** `CanvasImager` synchronously paints the creature from the same palette when the studio is down — no spinners, no dead ends, exactly like the clinical canvas fallback. Diffusion render is an *upgrade*, never required.

## 10. Technical feasibility

| Capability | Approach | Feasibility |
|---|---|---|
| **HRV from a chest strap** | Web Bluetooth GATT Heart Rate Service (`0x180D`), characteristic `0x2A37` exposes RR intervals on straps like the Polar H10. Real coherence. | **Solid** on Chrome/Edge/Android. **Not** iOS Safari → object/native-later seam. |
| **HR from the camera (rPPG)** | `getUserMedia` + green-channel photoplethysmography → heart rate; RR noisy. | **Experimental** — HR-grade only. Marked low-`confidence`; good demo fallback, weak HRV. |
| **Simulated source** | Deterministic generator producing realistic RR series at chosen coherence levels. | **Trivial** — powers dev, tests, and the offline demo (the synthetic-cohort analogue). |
| **Apple Health / wearables** | No web access to HealthKit. Needs a native bridge or export import. | **Future** — slots behind `BiometricSource`; primary reason form factor is "object-ready." |
| **Persistence (no DB)** | `LocalStorageStore` implementing `CompanionStore` (companion JSON + append-only dex). Per your constraint. | **Trivial.** Dex is time-series and will grow → `IndexedDbStore` is the drop-in upgrade behind the same interface (recommended once sessions exceed ~hundreds). |
| **Carried / installable** | PWA: web app manifest + service worker for offline + home-screen install. The "anti-phone" portability story, software-first. | **Solid** — server already serves `app/dist`; add manifest + SW. |
| **Imaging** | Existing `/illustrate` proxy + canvas fallback. | **Already proven** in this repo. |

**Net:** v1 is fully buildable on the current stack with no new backend state and no database. The only genuinely deferred piece is iOS-native biometric access, which the interface design quarantines.

## 11. What we deliberately drop (anti-extraction, the wedge)

- **No mortality / neglect-guilt / nagging** (Tamagotchi's shadow) — replaced by rest + instant revival + monotonic growth.
- **No gacha, pay-to-progress, or pull-rate monetization** (Pokémon's shadow) — growth is gated only on *your practice*.
- **No blind boxes, manufactured scarcity, resale, or FOMO drops** (the collectible's shadow) — one companion, earned evolution, your data.
- **No coercive streaks** — streaks are celebrated when present and silent when broken; never a loss screen.

## 12. Scope / non-goals (YAGNI)

**In (v1):** single companion; guardianship-with-rest bond; deterministic coherence engine; `SimulatedSource` + `WebBluetoothHeartRateSource`; `LocalStorageStore`; canvas + Bonsai imaging; the C0–C6 PWA FSM; an initial 3-branch taxonomy as data; dex export + wipe.
**Out (deferred behind seams):** iOS-native / dedicated object; real wearable/HealthKit integration; **cohort / social connection-as-completion** (Pokémon's social moat — a strong Phase-Future, but it needs a backend and is out of the no-DB v1); remote sync; multi-companion collecting; any monetization.

## 13. Safety, privacy & governance

- **Local-first, like the clinical runtime.** "No biometric data leaves the device" is the covenant (mirrors "no patient data leaves the device"). Raw RR streams are processed in memory and **not persisted**; only derived per-session summaries enter the dex.
- **Explicit consent** for camera and Bluetooth; clear "what we measure and why"; one-tap **export all** and **wipe** (`CompanionStore.exportAll` / `wipe`).
- **Not a medical device.** No diagnosis, no arrhythmia labeling, no alarms, no advice. Coherence is framed as practice feedback. A visible non-clinical disclaimer, consistent with this repo's standard.
- **Dignity guardrails** on all imagery (reuse `IMAGE_GUARDRAILS`): no fear, no gore, nothing body-shaming or medicalized.
- **Accessibility / safety of paced breathing:** breath guide is optional, gentle, and skippable; never instructs breath-holding.

## 14. Testing

- **Unit (vitest, deterministic — the existing discipline):** `coherence.ts` on known RR series (flat vs resonant → expected scores); `engine.ts` mood transitions and `EvolveRule` gating; growth monotonicity (absence never regresses lifetime/level); `LocalStorageStore` round-trip + export/wipe; `CanvasImager` produces a frame offline.
- **Source contract tests:** each `BiometricSource` honors `available()` / `start` / `stop`; `SimulatedSource` is reproducible from a seed.
- **Integration:** a scripted session (`SimulatedSource` → engine → store) writes exactly one `DexEntry`, ticks vitality, and fires evolution at the boundary.
- **Offline:** UI + server work with Bonsai down (canvas + no spinners).
- **Optional Python proof:** mirror `coherence`/`engine` in `src/pdm/companion/` and extend `proof.py` with companion criteria if we want parity with the HOMER-1 proof harness.

## 15. Build order (phased; each phase is demoable)

1. **Engine core.** `types.ts`, `coherence.ts`, `engine.ts`, `species.ts` (initial taxonomy) + vitest. Pure, no UI, no I/O. *Proves the math and the growth model.*
2. **Persistence + dex.** `CompanionStore` interface + `LocalStorageStore`; growth/evolution wired to dex append. *Proves compounding, no DB.*
3. **UI FSM.** `companion/store.svelte.ts` + C0–C6 Svelte states mirroring `app/src/lib/states/`; `CanvasImager` so it's alive offline. *First playable, simulated signal.*
4. **Real biometrics + PWA.** `WebBluetoothHeartRateSource` (+ experimental `CameraPpgSource`); web manifest + service worker. *Real coherence; installable/carried.*
5. **Bonsai imaging.** `BonsaiImager` via `/illustrate`; seed-locked lineage renders; the C5 evolution moment. *The creature is seen.*
6. **Dex export + Atlas.** Export/wipe; C6 taxonomy surface; a shareable "bloom card" milestone image (the case-study-hero analogue). *The record + the world.*
7. **(Future)** iOS/object `BiometricSource`; cohort/social connection-as-completion (needs backend); remote `CompanionStore`. *Behind the seams, untouched engine.*

---

## Appendix — why this fits the existing workload

Every novel concept here has a working ancestor in the repo, so the team builds with patterns it already trusts:

- **Deterministic, testable scoring** → `coherence.ts` / `engine.ts` ≈ `runtime.py` + `recursive_validation`.
- **Data-as-seam generativity** → `blueprint_species()` ≈ `factory.blueprint_specs()` (`origin="bonsai_proposed"` with deterministic fallback).
- **Append-only, inspectable, DB-free memory** → `CompanionStore` ≈ `InstitutionalMemory` (JSONL).
- **Offline-first adapters with `available()`** → `BiometricSource` / `CompanionImager` ≈ `BonsaiWriter` / `BonsaiImageStudio`.
- **Emotion-driven discrete FSM UI** → C0–C6 ≈ the S0–S8 conference (`State` union + `EMOTION` map + persistent chrome).
- **On-device dignified imaging with canvas fallback** → companion renders ≈ the what-if spine, same proxy and guardrails.
- **Local-only data covenant** → "no biometric data leaves the device" ≈ "no patient data leaves the device."

The biometric companion is not a detour from this codebase's thesis — it is the same thesis (*feeling and intelligence should compound, locally and auditably*) pointed at a personal nervous-system practice instead of a hospital service line.
