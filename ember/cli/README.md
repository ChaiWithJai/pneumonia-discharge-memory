# `ember ingest`

A standalone, dependency-free Node ESM CLI that normalizes NDJSON into the
Ember **ingestion contract** (`DailySummary`) defined in
[`docs/adr/0002-ingestion-api-and-cli.md`](../../docs/adr/0002-ingestion-api-and-cli.md)
and `src/lib/types.ts`.

Every producer (provider OAuth, manual UI, CLI, admin batch) converges on one
normalized shape. In production this CLI is a thin client that POSTs the batch
to the Cloudflare broker's versioned `POST /v1/ingest` (authed by a personal
ingest token, with partial-success per-item status). **Locally** — for
dogfooding, fixtures, and tests — it instead reads NDJSON from a file or stdin
and writes normalized NDJSON to a file or stdout. The wire shape and the local
shape are identical, so this also serves as the engine's fixture generator.

## The normalized record (`DailySummary`)

```jsonc
{
  "day": "2026-06-17",                 // YYYY-MM-DD (derived from `at` if missing)
  "source": "oura",                    // string (default "cli")
  "values": { "breath": 0.7, "rest": 0.4 }, // dimension -> 0..1 (clamped; unknown keys dropped)
  "confidence": 0.6,                   // 0..1 (default 0.6)
  "at": 1750000000000,                 // epoch ms (default Date.now())
  "subject": "me",                     // optional, from --subject or the record
  "tenant": "acme",                    // optional, from --tenant or the record
  "idempotencyKey": "oura:me:2026-06-17" // source:subject:day
}
```

Recognized dimensions: `breath`, `rest`, `movement`, `attention`, `connection`.

## Usage

```
ember ingest [FILE|-] [--subject <id>] [--tenant <id>] [--dry-run] [--out <file>]
ember ingest --generate <N>
```

### Flags

| Flag | Description |
| --- | --- |
| `--subject <id>` | Carry a subject id into every output record (overrides per-record `subject`). |
| `--tenant <id>` | Carry a tenant id into every output record (scoped multi-tenant, ADR-0002). |
| `--dry-run` | Validate + report only; write nothing; never exits non-zero for rejects. |
| `--generate <N>` | Emit `N` days of plausible sample NDJSON to stdout and exit (fixtures). |
| `--out <file>` | Write normalized NDJSON here (default: stdout). |
| `-h`, `--help` | Show help. |

Reads NDJSON (one JSON object per line) from `FILE` or stdin. Malformed lines
are reported with their line number on stderr, and the process exits non-zero
if any line is rejected (unless `--dry-run`). A summary (`N accepted, M
rejected`) is always printed to stderr.

## Examples

Pipe an export through, tagging it with your subject id:

```sh
cat data.ndjson | node cli/ingest.mjs --subject me
```

Generate a week of sample fixtures:

```sh
node cli/ingest.mjs --generate 7
```

Generate fixtures for a specific subject and pipe them back through ingest:

```sh
node cli/ingest.mjs --generate 30 --subject me | node cli/ingest.mjs --subject me --out fixtures.ndjson
```

Validate without writing anything:

```sh
cat data.ndjson | node cli/ingest.mjs --dry-run
```

Read from a file and write normalized output to another file:

```sh
node cli/ingest.mjs oura_export.ndjson --subject me --out normalized.ndjson
```

Via the npm script:

```sh
npm run ingest -- --generate 7
```

## Normalization rules

- `values`: coerced to numbers and clamped to `[0,1]`; unknown dimension keys
  are dropped; a record with no recognized dimensions is rejected.
- `confidence`: defaults to `0.6`; clamped to `[0,1]`.
- `at`: defaults to `Date.now()`; must be a finite number if present.
- `day`: kept if a valid `YYYY-MM-DD` string; otherwise derived from `at` (UTC).
- `source`: kept if a string; defaults to `"cli"`.
- `idempotencyKey`: computed as `source:subject:day` for safe re-sends/dedup.

## Tests

```sh
node --test cli/ingest.test.mjs
# or, by glob:
node --test 'cli/**/*.test.mjs'
```
