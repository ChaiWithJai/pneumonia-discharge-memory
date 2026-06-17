# ADR-0002 — One normalized ingestion API with many producers (provider, UI, CLI, admin batch)

- **Date:** 2026-06-17
- **Status:** Accepted
- **Context docs:** [product spec §6–§7](../superpowers/specs/2026-06-17-biometric-companion-design.md), [feasibility §6](../superpowers/specs/2026-06-17-integration-feasibility.md).

## Context

- Ember requires a worn device, but we want more ways for data to reach the Witness than just provider OAuth: **manual UI input**, a **CLI** (so developers — including Claude Code / Codex users — can pipe their own exports or scripted data), and **internal admin batch**, potentially **across multiple tenants**.
- The engine and the local dex are already designed to be **producer-agnostic** (the `SignalSource` interface). Generalizing *how data enters* is a natural extension of that dependency inversion.
- The CLI/manual paths double as the **dogfooding and fixture** mechanism (the same normalized shape the tests use) and as a DIY path for wearable-less power users — without making manual entry the mainstream consumer experience (the consumer path stays wearable-connected, per the locked decision).

## Decision

**Expose one normalized, versioned ingestion contract on the broker — `POST /v1/ingest` — that accepts a single item or a batch of normalized `DailySummary`/`SignalEvent` objects. Every producer converges on it; scoped auth decides which subjects a caller may write.** The engine and store never know which producer supplied a row.

**Contract:**
- Payload = array of normalized events, each carrying `subject_id`, `source`, `day`/`timestamp`, the metric fields, `confidence`, and an **idempotency key** (`source:subject:day:type`) for safe re-sends and dedup.
- **Batchable** with a **partial-success response** (per-item status), so large/resumable batches across many subjects are safe.
- **Versioned** (`/v1/ingest`) so the contract can evolve without breaking producers.

**Producers (all the same contract; differ only in auth scope):**
1. **Provider OAuth** (Oura now, Whoop parallel) — the broker fetches, normalizes, and ingests on the user's behalf.
2. **Manual UI input** — the app posts user-entered summaries with `source: "manual"` and lower `confidence`; authed by the user session.
3. **CLI** (`ember ingest`) — authed by a **personal ingest token** minted in-app; posts NDJSON from a file or stdin; idempotent; one invocation can send a batch. Aimed at devs / Claude Code / Codex users.
4. **Admin / multi-tenant batch** — an **admin token scoped to a tenant** may write for many `subject_id`s (internal onboarding/backfill). Rate-limited and audited.

**Auth scopes:** `user` (own subject only) · `cli` (own subject, long-lived personal token, revocable) · `admin:tenant` (subjects within one tenant). Same schema everywhere; authorization is the only difference.

**v1 build:** provider (Oura) + manual UI + personal-token CLI. **Admin/multi-tenant batch is designed-for now, built when needed.**

## Consequences

- **D1 earns its place** alongside the per-user Durable Object: the DO stays the token vault + per-(tenant,user) write serializer; D1 holds normalized summaries for cross-subject/tenant queries and admin batch reconciliation. Per-`tenant_id` isolation throughout.
- **Strong dependency inversion preserved:** adding a producer never touches the engine, the dex, or the UI.
- The CLI is a thin client over `/v1/ingest`; it **also serves tests and dogfooding** (the `FixtureSource` shape == the ingestion shape).
- Manual entry exists but is **deliberately not the mainstream** — lower `confidence`, framed as "tell the Witness yourself" — so it doesn't reintroduce Finch's self-report-checklist shadow as the primary mechanic.
- Idempotency + partial-success make batch processing across tenants resumable and side-effect-safe.

### Assumption to confirm
Multi-tenancy is treated as **internal-admin-first, B2B2C-ready** (tenants could later be clinics/coaches/orgs). If a near-term B2B2C product is intended, tenant management (provisioning, per-tenant keys, billing) becomes its own workstream — flag for direction.

## Alternatives considered

- **Provider-OAuth-only ingestion** — rejected: no DIY/dev/test path; no manual input; couples ingestion to vendor availability.
- **A separate endpoint/pipeline per producer** — rejected: duplication and it breaks producer-agnosticism; the whole point is one contract.
- **Manual entry as a first-class mainstream input** — rejected: revives the self-report-checklist shadow Ember exists to refuse; keep it secondary and lower-confidence.

## CLI sketch

```
ember ingest --token <T> [--subject <id>] [--tenant <id>] [--dry-run] [FILE|-]
# reads NDJSON of normalized events from FILE or stdin; idempotent; exit non-zero on any item rejected (unless --dry-run)
cat oura_export.ndjson | ember ingest --token $EMBER_TOKEN
```
