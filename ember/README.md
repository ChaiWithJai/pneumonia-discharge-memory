# Ember

**A living companion that grows from how you actually live.** Ember is an *interior-state companion*: you choose a temperament, take one sensed breath, and from then on you don't play — you live, and the **Witness** notices. Your breath, rest, movement, attention, and connection are read (here, from a simulated wearable; later, from a real one) and the **Loom** turns that living into the **Inner Country** — a world that brightens, dims, and turns through **Seasons**. Through real practice (**Tending**) you wake the **Circle**: the support companions called the **Woken**. When you lapse, the **Hush** sets in — color drains, recent gifts sleep — but the ember can dim and never dies, and the **Return** is met with relief, never debt. The whole product is built by refusing the pressures its category leaders monetize: guilt, judgment, streaks, scarcity. The canon lives in [`docs/EMBER_WORLD_BIBLE.md`](../docs/EMBER_WORLD_BIBLE.md), [`docs/EMBER_USER_JOURNEY.md`](../docs/EMBER_USER_JOURNEY.md), [`docs/EMBER_SCREENS_AND_SERVICE_MAP.md`](../docs/EMBER_SCREENS_AND_SERVICE_MAP.md), and [`docs/EMBER_LOOP_ENGINEERING.md`](../docs/EMBER_LOOP_ENGINEERING.md); this README describes the running app.

This is a standalone Svelte 5 + TypeScript + Vite app. It runs fully offline and local — no backend, no model keys, no hardware required.

## Run

```bash
cd ember
npm install
npm run dev      # Vite dev server on http://localhost:5174
npm run build    # production build → dist/ (relative base; servable from any static path)
npm test         # Vitest — the engine + loop invariants
npm run check    # svelte-check (TypeScript)
```

## Architecture

The shape is a **pure, deterministic engine** at the center, **four loops** of companion intelligence around it, **sources** feeding it, a **Ledger** persisting it, and **screens** rendering it — wired together by a single composition root.

### The engine — pure and deterministic (`src/lib/engine/`)

No I/O, no randomness it doesn't control, no Svelte. Same inputs → same world.

- **`nourish.ts`** — `summarize()` folds recent `DailySummary` rows into a recency-weighted `NourishmentScore` per dimension (7-day window, ~2.5-day half-life). A reflection, never a verdict.
- **`loom.ts`** — the **Loom**. `ingest()` warms the lived regions and clears the Hush; `tick()` lets warmth drift toward rest and the Hush rise once a grace window passes; `overnightPass()` turns the season and, if rest was kept, harvests the Hearthkeeper's dawn idea. Holds the two sacred invariants (see below).
- **`circle.ts`** — Circle logic. `witness()` stirs the **Woken** whose dimension was genuinely lived (waking is monotonic — once awake, always awake); `assembleTriad()` stands up to three awake companions beside your Ember.
- **`blueprint.ts`** — the canon as data (the blueprint seam): the four temperaments, the six Woken, the practice library, per-dimension region/color metadata, season metadata. Add content here; the engine never changes.

### The four loops (`src/lib/loops/`)

Ember's "intelligence" is engineered as a stack of loops (see the Loop Engineering doc).

- **`voice.ts`** — Loop 1, the **Companion Engine**. `DeterministicVoice` ships a rubric-safe, in-character voice today behind a `CompanionVoice` interface; an LLM voice (Claude) can swap in later without touching the loops.
- **`grader.ts`** — Loop 2, the **Facilitator Grader**. The Facilitator Rubric *enforced in code*: guilt/shame, streak-debt, scarcity/FOMO, medical-claim, and pressure-command language all fail. Failing output is replaced by a guaranteed-safe fallback and never shown.
- **`carepath.ts`** — the **care-path safety gate**. A deterministic, high-precision assessment: explicit crisis language always routes to real human/crisis resources; a prolonged severe collapse surfaces a gentle offer of help without diagnosing. (Loop 3, the event-driven Heartbeat, is designed-for but not shipped in this prototype.)
- **`companion.ts`** — `respond()`, the one path every utterance takes: **care gate first (deterministic, non-negotiable) → voice → rubric → trace**. Emits an `Utterance` plus a `Trace`.
- **`studio.ts`** — Loop 4, the **Studio**. Every utterance logs a `Trace` (state in → output → grade → care-routing); `studioStats()` aggregates pass rate, care-routing, and violations by rule. The rubric *is* the growing eval set.

### Sources — the Witness's producers (`src/lib/sources/`)

- **`SignalSource.ts`** — the dependency-inversion seam. `SignalSource` plus the `PassiveSource` interface (`history()` / `today()` yielding normalized `DailySummary` rows). Providers, manual input, and the CLI are all just producers.
- **`SimulatedSource.ts`** — a deterministic stand-in for a worn device (Oura/Whoop), so Ember feels alive locally. Swappable behind `PassiveSource` — the engine never knows the difference.
- **`manual.ts`** — the manual / CLI producer (ADR-0002): `manualSummary()` (deliberately lower confidence — never the mainstream) and `practiceSummary()` (a practice the user actually did — high confidence).

### The Ledger — your record (`src/lib/store/`)

- **`EmberStore.ts`** — the persistence interface (load/save the save, load/save traces, wipe, export). "Your record is yours."
- **`LocalStorageStore.ts`** — the v1 implementation over `localStorage`, with a JSON export. IndexedDB/remote drop in behind the same interface later.

### Composition root + FSM (`src/lib/store.svelte.ts`)

The `EmberApp` Svelte 5 (`$state`) store wires the engine, the loops (Companion Engine → care gate → Grader → Studio), the sources, and the Ledger. It holds the `Screen` finite-state machine, runs the boot/overnight/return logic, exposes derived views (`ember`, `nourishment`, `inHush`), and the actions screens call (`completeFirstBreath`, `tend`, `simulateDay`, `ingestManual`, `checkIn`, `advanceDays`, `storm`, settings, export/wipe). `export const ember` is the singleton.

### Screens (`src/screens/`) and components (`src/lib/components/`)

Screens follow the screen plan's IDs:
- **A1–A6** — onboarding & activation: welcome, primer, choose temperament, name, connect the Witness, first breath (the aha).
- **B1–B5** — the daily core: Home (the Inner Country, not a dashboard), your Ember, the Witness reflection, the practice library, the session close.
- **C1–C4** — world & crew: the Circle, a Woken's detail, the wake ceremony, Seasons.
- **D2 / D3** — the **Return** (the most important screen — relief, never debt) and the **Storm**.
- **E1–E3** — the Commons (neighboring Hearths, visit, send warmth).
- **F1–F4** — the inversion ("go live, I'll be here"), the Ledger controls, Triggers, and You.
- **carepath** — the safety floor, outside the fiction.
- **studio** — the Studio trace log and the operator bench.

Components: **`Ember.svelte`** (the being — glows with level, dims with hush, never dies), **`InnerCountry.svelte`** (the world as landscape), **`BreathPacer.svelte`** (the guided breath), **`Voice.svelte`** (the companion's line), **`Nav.svelte`**.

## The invariants and non-negotiables

**Two sacred invariants** (held by the Loom, proven in `src/lib/engine/loom.test.ts`):

1. **The ember can dim but never dies.** `emberLevel` is always floored at `EMBER_FLOOR` (0.08) — a full year untended still leaves it alight.
2. **Growth is monotonic.** The Hush greys the country but *never* reduces `lifetimeLight` and never unwakes a companion. Lapsing costs nothing earned.

**Two non-negotiables** (proven in `src/lib/loops/loops.test.ts`):

1. **The Facilitator Rubric is enforced in code, not vibes.** Guilt/streak/scarcity/medical-claim language fails the Grader; the deterministic voice passes the rubric across every event.
2. **The care-path crisis gate is deterministic and first.** Explicit crisis text overrides the voice and routes to care before anything else runs; a normal Hush never cries crisis.

## Demo it locally

1. **Onboard:** open the dev server, walk A1→A6 — choose a temperament, name your Ember, and take the **first breath**, which lights the first valley and lands you on Home (B1).
2. **Open the Studio** (via You → Studio, or the `studio` screen). It doubles as the **operator bench**:
   - **Skip 3 days / Skip 14 days** advance the clock to trigger the **Hush** and the **Return (D2)** without waiting.
   - **The check-in box** sends free text through the full loop — type something benign to see a graded voice line, or a crisis phrase to watch the **care gate** route to the care path first.
   - **Live a day** ingests one simulated day from the worn device (the Witness reflection).
   - **Storm** opens the hard-day support screen (D3).
3. Watch the **Recent traces** list: every utterance shows its event, its grade (pass / FAIL), or `→ care` when the gate fired.

## Swapping in real wearables later

The engine is source-agnostic by design, so real devices arrive without touching it:

- Implement `OuraSource` / `WhoopSource` against the **`PassiveSource`** interface in `src/lib/sources/SignalSource.ts` — yield the same normalized `DailySummary` rows the `SimulatedSource` produces. Nothing downstream (the Loom, the Circle, the Ledger, the screens) changes.
- Sequencing, vendor footguns, and the Cloudflare token-broker design are in [`docs/superpowers/specs/2026-06-17-integration-feasibility.md`](../docs/superpowers/specs/2026-06-17-integration-feasibility.md): lead with **Oura** (no approval gate, webhooks, generous limits), then **Whoop** (gated; submit approval early), with Apple Health as an ambient secondary.
- The two decisions that shape this seam are recorded as ADRs: [`docs/adr/0001-healthkit-role.md`](../docs/adr/0001-healthkit-role.md) (HealthKit is a trailing, ambient witness — never a live signal) and [`docs/adr/0002-ingestion-api-and-cli.md`](../docs/adr/0002-ingestion-api-and-cli.md) (one normalized ingestion contract; provider OAuth, manual UI, and CLI are all just producers).

## NOTE — the care path is a placeholder pending professional review

The crisis resources in [`src/lib/loops/carepath.ts`](src/lib/loops/carepath.ts) (988, Crisis Text Line, 911) are a **US-default placeholder**. They **must be reviewed and localized with a qualified professional partner before any real-person pilot.** The code is the always-reachable plumbing; the clinical content is owned by that partner. A service that senses distress carries a duty of care — this gate is a launch gate, not a later feature.
