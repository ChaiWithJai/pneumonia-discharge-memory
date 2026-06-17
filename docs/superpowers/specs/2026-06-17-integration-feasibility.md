# Ember — Integration Feasibility & Sequencing

- **Date:** 2026-06-17
- **Status:** Research synthesis (doc-grounded); informs the product-direction spec and the open decisions below.
- **Companion docs:** narrative canon → [`docs/EMBER_WORLD_BIBLE.md`](../../EMBER_WORLD_BIBLE.md); product/architecture → [`2026-06-17-biometric-companion-design.md`](./2026-06-17-biometric-companion-design.md).
- **Sourcing caveat:** every vendor docs site (`developers.strava.com`, `developer.ouraring.com`/`cloud.ouraring.com`, `developer.whoop.com`, `developers.cloudflare.com`, Apple) blocks automated fetch (HTTP 403). Findings were extracted via search indexing of the official pages and cross-checked against reputable mirrors/SDKs. Treat load-bearing numbers (rate limits, approval caps, token TTLs, exact field names) as high-confidence-but-verify against live docs before committing code.

---

## 0. The findings that change the plan

1. **HealthKit is not real-time.** Watch→iPhone sync is seconds-to-minutes, system-controlled, with no API to accelerate, and a **watchOS 26 / iOS 26 background-delivery regression** (intervals blew out to 20–60+ min; Apple acknowledged, "no workaround," unresolved as of Jan 2026). → **Live in-session breath/HRV must come from camera-PPG or a BLE strap, not HealthKit.** HealthKit is the *passive* recovery/sleep/workout substrate. This maps cleanly onto Ember: the **Witness** senses live coherence on-device (camera/strap) and *also* ingests passive signals (HealthKit/Oura/Whoop).
2. **Strava's 2026 terms undercut the original beachhead rationale.** (a) Strava data may only be shown to the **owning user** → we **cannot** build Commons/social features on Strava data (the social-graph wedge is gone). (b) **AI/ML training on Strava data is contractually prohibited** (deterministic/statistical analysis shown back to the owner is fine; training models is not; inference-only is an unresolved grey area). (c) **Standard Tier now requires a paid Strava subscription (~$11.99/mo) from June 30, 2026**, plus a 10-athlete self-serve ceiling before review. → **Recommend demoting Strava** from beachhead to an optional later "movement" power-up; lead with Apple Health + Oura.
3. **Oura is the lowest-friction first integration; Whoop is gated.** Oura: no approval gate, real webhooks, 5,000 req/5-min. Whoop: self-serve to build but **hard-capped at 10 users until manual app approval** (community reports multi-week review queues) and **rotating refresh tokens** (concurrent-refresh race is the #1 hazard).
4. **The Cloudflare broker is sound and the hard part has a clean answer:** a **per-user SQLite Durable Object** serializes token refresh (killing the rotation race) and dedupes webhooks; encrypt tokens yourself (AES-GCM/WebCrypto, key in Secrets); use an OAuth **client** lib (**Arctic**), not `workers-oauth-provider`.

---

## 1. Live signal on-device (the Witness, real-time tier)

**Use case:** beat-to-beat feedback during a breathing/coherence session.

| Path | Latency | Notes |
|---|---|---|
| **Camera-PPG (rPPG)** via `getUserMedia`/native | sub-second | HR-grade; HRV noisy. **Phone-only, no wearable, max reach** — the right MVP default for the universal core. |
| **BLE HR strap** (Polar H10) via `@capacitor-community/bluetooth-le` | sub-second | True HR **and RR/HRV** in real time. Best live fidelity without a watch app. |
| **watchOS companion app** (`HKWorkoutSession` + WatchConnectivity) | near-real-time | Apple's official answer for live HR; **separate native target**, not buildable in Capacitor; most build/maintenance. |
| **HealthKit reads** | seconds–minutes | ❌ Not for live. Fine for "session average," not a beat visualizer. |

**Recommendation:** universal core = **camera-PPG** (phone-only) with **optional BLE strap** for fidelity; defer the watchOS target.
**Footguns:** camera-PPG accuracy varies with lighting/skin tone/motion — surface a `confidence` and never fake a reading; request camera permission with a clear purpose string.

## 2. Apple HealthKit (passive substrate, iOS)

**Pattern:** Capacitor wrapper + `capacitor-health` (Cap-go; actively maintained, supports `heartRate`, `restingHeartRate`, `heartRateVariability` (SDNN), sleep w/ stages, workouts) for foreground reads; **plan a thin custom Swift plugin** for `HKObserverQuery` + `enableBackgroundDelivery` (neither community plugin documents background delivery). `@perfood/capacitor-healthkit` is in v2-alpha limbo — avoid.

**Reads we want:** `heartRate`, `heartRateVariabilitySDNN` (ms; sparse — sporadic, not a stream), `restingHeartRate` (~1/day), `HKWorkout`, `sleepAnalysis` (staged).

**Footguns (prioritized):**
1. **Not real-time** (see §0/§1).
2. **You cannot detect read-permission denial** — denied is indistinguishable from "no data." Design empty-state UX; never gate logic on read auth status.
3. **watchOS 26 background-delivery regression** — don't promise tight passive cadence; `HKUpdateFrequency` is a hint (~hourly at best).
4. **Requires a physical iPhone + paired Watch to test** — Simulator has no HealthKit data.
5. **Entitlement + Info.plist `NSHealthShareUsageDescription`** required (missing string = hard crash).
6. **App Review (5.1.3):** no advertising/data-mining with health data; no health data in iCloud; in-app + store privacy policy; explicit data disclosure.

**Verdict:** feasible for passive reads from a Capacitor app; budget a small Swift plugin for background delivery; **HRV/RHR are sparse**, so treat them as daily nourishment, not live.

## 3. Oura API v2 — recommended **first** integration

**Pattern:** **webhook-primary + once-daily reconciliation poll.** Confidential-client OAuth2 (the Worker holds the secret).
- **Auth:** authorize `https://cloud.ouraring.com/oauth/authorize`, token `https://api.ouraring.com/oauth/token`. **PATs deprecated (Dec 2025) — OAuth2 only, even for dev.** Scopes: `personal daily heartrate` (+`spo2` if surfaced). Access token ~30d; refresh and persist the returned (rotating) refresh token.
- **Data:** `daily_readiness` (0–100 + contributors incl. **HRV balance**, resting HR); detailed **`sleep`** is where raw HRV lives (`average_hrv` + `hrv` time-series, `average/lowest_heart_rate`, respiratory rate, stages); `daily_activity`; `heartrate` (Gen3+).
- **Webhooks:** `/v2/webhook/subscription` CRUD, authed with `x-client-id`/`x-client-secret`; one subscription per `data_type`×`event_type`; GET challenge echo to verify; verify `x-oura-signature` HMAC on events; **subscriptions expire → must be renewed (Cron)**. Notifications ~30s after ring sync.
- **Rate limit:** 5,000 req / 5 min (very generous).

**Footguns:** PATs dead; **webhook subscriptions silently expire without renewal**; **data only appears after the user opens the Oura app/ring syncs** (no on-wrist real-time); HRV is in `sleep`, not `daily_readiness`; verify HMAC over the raw body.
**Verdict:** **highest-leverage first integration** — no gate, webhooks, generous limits, rich recovery/HRV.

## 4. Whoop API v2 — recommended **second** integration

**Pattern:** **webhook-primary** (`recovery.updated`/`sleep.updated`) + **per-user single-flight refresh**. Don't poll aggressively (tight limits).
- **Access:** self-serve to build, **hard cap 10 members until app approval** (manual review, reportedly slow — submit early, off the critical path). Free; gated by approval + rate limits, not dollars.
- **Auth:** authorize `…/oauth/oauth2/auth`, token `…/oauth/oauth2/token`; **PKCE supported**; scopes `read:recovery read:cycles read:sleep read:profile offline` (`offline` ⇒ refresh token; include it on refresh too). Access token ~1h. **Refresh-token ROTATION enforced.**
- **Data (v2 only; v1 sunset Oct 1 2025; UUID ids):** Recovery (`recovery_score`, `hrv_rmssd_milli`, `resting_heart_rate`, `score_state` ∈ SCORED/PENDING_SCORE/UNSCORABLE; keyed by **sleep UUID**); Cycle/strain; Sleep; Workout; profile/body.
- **Webhooks:** `X-WHOOP-Signature` + `X-WHOOP-Signature-Timestamp`; verify = base64(HMAC-SHA256(timestamp + raw body, client_secret)), constant-time compare.
- **Rate limit:** 100/min + 10,000/day → ~60–80 connected users on defaults; request increases early.

**Footguns (prioritized):** 10-user approval gate (blocks launch); **rotating refresh + concurrent-refresh race → serialize per-user (DO lock), persist atomically** (#1 hazard); **recovery doesn't exist until sleep closes / check `score_state`**; 10k/day app-wide ceiling; v1 dead; HMAC over raw body.
**Verdict:** feasible but **gated and heavier** — build second, submit approval in parallel.

## 5. Strava API — recommended **demoted** to optional later "movement" power-up

**Why demoted:** the 2026 terms remove its strategic value as a beachhead (§0.2): **owner-only display kills the Commons/social-graph wedge**, **AI/ML-training ban**, **paid Standard Tier (~$11.99/mo, June 30 2026)**, 10-athlete self-serve ceiling then 7–10-day review. The *technical* integration is fine; the *strategic* rationale collapsed.
- **Auth:** authorize `https://www.strava.com/oauth/authorize`, token `…/oauth/token`. **No PKCE** → confidential backend mandatory (validates the BFF). Scope: `activity:read_all` (plain `activity:read` silently hides private activities). Access token 6h; **refresh token ROTATES every refresh — persist the new one atomically.**
- **Data:** `GET /activities/{id}` (HR summary fields present-but-undocumented → feature-detect `has_heartrate`); `GET /activities/{id}/streams?keys=heartrate,time&key_by_type=true` (stream omitted if absent → feature-detect); `GET /athlete/activities` for backfill (`per_page=200`).
- **Webhooks:** one subscription/app; GET `hub.challenge` echo (200, JSON, <2s); event POST carries **only IDs → fetch-after-notify**; **no historical backfill via webhook**; ack in 2s then process async.
- **Rate limit:** 200/15min + 2,000/day overall; **100/15min reads** is the real backfill bottleneck.
- **Deauth/deletion:** migrate to `POST /oauth/revoke` (sole supported method June 1 2027); on deauth delete user's Strava data (48h to reflect deletions, 30-day max).

**Footguns (prioritized):** AI/ML-training ban; owner-only display; new paid tier; refresh-token rotation; webhook fetch-after-notify + no backfill; HR is device-dependent; Single-Player-Mode (1 athlete) → self-upgrade to 10 → review beyond.
**Verdict:** **technically feasible, strategically demoted.** If kept, scope it as a deterministic, owner-only "movement nourishment" source — never as the social layer, never as model-training data.

## 6. The broker — Cloudflare Workers (BFF / confidential OAuth client)

**Architecture:** Worker is the confidential client; mobile app never sees a provider secret or refresh token.
- **Token store + refresh serialization:** **one SQLite-backed Durable Object per user** (single-threaded → only one refresh in flight; Alarms API for proactive refresh + webhook dedup). This is the clean answer to the **rotation race** that bites Whoop/Strava/Oura.
- **D1 (GA)** optional, only for cross-user SQL/reporting. **KV** only for transient `state`/`code_verifier` (TTL) and read caches — *not* token source of truth (eventual consistency, 1 write/s/key).
- **Encryption (mandatory):** KV/D1/DO are encrypted at rest by infra but **plaintext to anyone with API/dashboard access** → encrypt refresh tokens yourself with **AES-256-GCM (WebCrypto)**, key in **Secrets**, **fresh 12-byte IV per encryption**, version-tag ciphertext for key rotation.
- **OAuth lib:** **Arctic** (`arcticjs.dev`, polyfill-free on Workers, S256 PKCE, generic `OAuth2Client`). ⚠️ **Not** `@cloudflare/workers-oauth-provider` (that makes you an authorization *server*).
- **Webhooks:** verify HMAC over the **raw body** with `crypto.subtle`/constant-time compare *before* JSON parse; reject stale timestamps; route side-effects through the per-user DO.
- **Outbound:** **Queues** (retries/backoff/DLQ) or DO+Alarms — never inline retry loops, **never module-global state** (isolates evicted).
- **Cron:** min 1-minute, UTC only; use for proactive refresh + Oura subscription renewal.
- **Plan:** Workers **Paid** (subrequest 1,000/req, CPU up to 5 min). On device, store only a short-lived session token in **Keychain/Keystore** (not `@capacitor/preferences`, which is plaintext); ideally no provider refresh token on device at all.

**Verdict:** highly feasible; aligns with current IETF guidance (BFF draft, PKCE RFC 7636, native-app RFC 8252, OAuth Security BCP RFC 9700/2025). All primitives are GA.

## 7. Loose scope & sequencing

| Phase | Capability | Gate / dependency |
|---|---|---|
| **P1** | Engine + universal core: **camera-PPG live coherence**, local dex, the Hush/seasons, one temperament. No backend. | none |
| **P2** | **iOS Capacitor wrap + HealthKit passive reads** (recovery/sleep/workouts); optional BLE strap. | Apple dev acct; physical iPhone+Watch to test |
| **P3** | **Cloudflare broker** (DO + AES-GCM + Arctic) + **Oura power-up** (webhooks). | Oura app reg (self-serve) |
| **P4** | **Whoop power-up.** | **Whoop approval (submit in P2/P3, slow queue)**; rate-limit increase |
| **P5** | **Strava power-up** (optional, owner-only "movement"), if business accepts paid tier + ToS. | Strava paid tier; ≤10 then review |
| **P6+** | **Commons / social** — build on *our* graph (Ember-native), **not** Strava data (owner-only forbids it). | broker hardened; real backend |

**Critical-path notes:** P1 ships with zero external gates. The slowest external dependency is **Whoop approval** — submit early, in parallel, never on the launch critical path. **Commons cannot be built on Strava data** — design it Ember-native from the start.

## 8. Open questions surfaced by research (to confirm)

- **"Live-ish" latency budget** for a session — decides camera-PPG vs BLE strap vs watch app.
- **Apple Watch assumption** — require a Watch (else HR/HRV/sleep don't exist in HealthKit) or support iPhone-only (then camera-PPG/strap is mandatory)?
- **Strava decision** — keep as demoted optional movement source, or drop for v1? (Business call on the paid tier + the strategic loss of the social wedge.)
- **Strava AI/ML grey area** — our analysis is deterministic/owner-only (compatible); confirm we will *not* train models on Strava data.
- **Whoop now or later** — start the ≤10-user build + approval submission now, or defer entirely?
- **Verify-before-code:** exact field names (`hrv_rmssd_milli`, `average_hrv`), PKCE requirements per provider, Oura webhook subscription TTL, Strava webhook retry schedule, Cloudflare Secrets Store GA status.
