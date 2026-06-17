#!/usr/bin/env node
// ember ingest — local NDJSON normalizer for the Ember ingestion contract.
//
// Per ADR-0002 (docs/adr/0002-ingestion-api-and-cli.md), every producer
// converges on ONE normalized ingestion contract: a batch of `DailySummary`
// objects, each carrying source/subject/day/values/confidence and an
// idempotency key (`source:subject:day`) for safe re-sends and dedup.
//
// In production this CLI is a thin client that POSTs the normalized batch to
// the Cloudflare broker's versioned endpoint `POST /v1/ingest` (authed by a
// personal ingest token, with partial-success per-item status). For LOCAL use
// — dogfooding, fixtures, and tests — it instead normalizes NDJSON from a file
// or stdin and writes normalized NDJSON to a file or stdout. The on-the-wire
// shape and the local shape are identical (the FixtureSource shape == the
// ingestion shape), so this doubles as the fixture generator for the engine.
//
// Standalone, dependency-free Node ESM. No network calls in this build.

import { readFileSync } from "node:fs";
import { writeFileSync } from "node:fs";

/** The five dimensions of the Inner Country (src/lib/types.ts `Dimension`). */
const DIMENSIONS = ["breath", "rest", "movement", "attention", "connection"];
const DEFAULT_CONFIDENCE = 0.6;
const DEFAULT_SOURCE = "cli";

/** Clamp a value to [lo, hi]; return null if not a finite number. */
function clampNum(v, lo, hi) {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.min(hi, Math.max(lo, n));
}

/** epoch ms -> YYYY-MM-DD (UTC). */
function dayFromEpoch(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate & normalize one parsed object into the DailySummary contract.
 * Returns { ok: true, item } or { ok: false, error }.
 */
export function normalizeRecord(obj, opts = {}) {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return { ok: false, error: "expected a JSON object" };
  }

  // at: default to now; coerce/validate if present.
  let at;
  if (obj.at === undefined || obj.at === null) {
    at = Date.now();
  } else {
    const n = typeof obj.at === "number" ? obj.at : Number(obj.at);
    if (!Number.isFinite(n)) return { ok: false, error: "`at` is not a finite number" };
    at = n;
  }

  // day: keep if a valid YYYY-MM-DD string, else derive from `at`.
  let day;
  if (obj.day === undefined || obj.day === null || obj.day === "") {
    day = dayFromEpoch(at);
  } else if (typeof obj.day === "string" && DAY_RE.test(obj.day)) {
    day = obj.day;
  } else {
    return { ok: false, error: "`day` must be a YYYY-MM-DD string" };
  }

  // source: required-ish; default to "cli".
  let source;
  if (obj.source === undefined || obj.source === null || obj.source === "") {
    source = DEFAULT_SOURCE;
  } else if (typeof obj.source === "string") {
    source = obj.source;
  } else {
    return { ok: false, error: "`source` must be a string" };
  }

  // confidence: default 0.6, clamp 0..1.
  let confidence;
  if (obj.confidence === undefined || obj.confidence === null) {
    confidence = DEFAULT_CONFIDENCE;
  } else {
    const c = clampNum(obj.confidence, 0, 1);
    if (c === null) return { ok: false, error: "`confidence` is not a finite number" };
    confidence = c;
  }

  // values: object of dimension -> number; clamp [0,1], drop unknown keys.
  if (obj.values === undefined || obj.values === null) {
    return { ok: false, error: "`values` is required" };
  }
  if (typeof obj.values !== "object" || Array.isArray(obj.values)) {
    return { ok: false, error: "`values` must be an object" };
  }
  const values = {};
  for (const key of DIMENSIONS) {
    if (Object.prototype.hasOwnProperty.call(obj.values, key)) {
      const raw = obj.values[key];
      if (raw === undefined || raw === null) continue;
      const v = clampNum(raw, 0, 1);
      if (v === null) {
        return { ok: false, error: `value for "${key}" is not a finite number` };
      }
      values[key] = v;
    }
  }
  // (Unknown keys are silently dropped — they simply aren't copied above.)
  if (Object.keys(values).length === 0) {
    return { ok: false, error: "`values` has no recognized dimensions" };
  }

  // subject: from --subject flag, else from the record, else undefined.
  const subject =
    opts.subject !== undefined
      ? opts.subject
      : typeof obj.subject === "string" && obj.subject !== ""
        ? obj.subject
        : undefined;

  const tenant =
    opts.tenant !== undefined
      ? opts.tenant
      : typeof obj.tenant === "string" && obj.tenant !== ""
        ? obj.tenant
        : undefined;

  const item = { day, source, values, confidence, at };
  if (subject !== undefined) item.subject = subject;
  if (tenant !== undefined) item.tenant = tenant;
  // Idempotency key per ADR-0002 intent (source:subject:day).
  item.idempotencyKey = `${source}:${subject ?? ""}:${day}`;

  return { ok: true, item };
}

/** Generate N days of plausible sample DailySummary records (NDJSON-ready). */
export function generateSamples(n, opts = {}) {
  const out = [];
  const dayMs = 86_400_000;
  const now = Date.now();
  for (let i = n - 1; i >= 0; i--) {
    const at = now - i * dayMs;
    const day = dayFromEpoch(at);
    // Deterministic-ish plausible values via a cheap seeded wobble.
    const values = {};
    for (let d = 0; d < DIMENSIONS.length; d++) {
      const phase = (i * 7 + d * 13) % 17;
      const v = 0.35 + 0.45 * Math.abs(Math.sin(phase));
      values[DIMENSIONS[d]] = Math.round(v * 100) / 100;
    }
    const rec = {
      day,
      source: opts.source ?? "simulated",
      values,
      confidence: 0.7,
      at,
    };
    if (opts.subject !== undefined) rec.subject = opts.subject;
    if (opts.tenant !== undefined) rec.tenant = opts.tenant;
    out.push(rec);
  }
  return out;
}

/** Parse argv (after `node ingest.mjs`) into options + positional file. */
export function parseArgs(argv) {
  const opts = {
    subject: undefined,
    tenant: undefined,
    dryRun: false,
    generate: undefined,
    out: undefined,
    file: undefined,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--subject":
        opts.subject = argv[++i];
        break;
      case "--tenant":
        opts.tenant = argv[++i];
        break;
      case "--dry-run":
        opts.dryRun = true;
        break;
      case "--generate": {
        const n = Number(argv[++i]);
        if (!Number.isInteger(n) || n <= 0) {
          throw new Error("--generate requires a positive integer");
        }
        opts.generate = n;
        break;
      }
      case "--out":
        opts.out = argv[++i];
        break;
      case "-h":
      case "--help":
        opts.help = true;
        break;
      case "-":
        opts.file = undefined; // explicit stdin
        break;
      default:
        if (a.startsWith("--")) throw new Error(`unknown flag: ${a}`);
        opts.file = a;
    }
  }
  return opts;
}

const HELP = `ember ingest — normalize NDJSON into the Ember ingestion contract (ADR-0002)

Usage:
  ember ingest [FILE|-] [--subject <id>] [--tenant <id>] [--dry-run] [--out <file>]
  ember ingest --generate <N>

Flags:
  --subject <id>   carry a subject id into every output record
  --tenant <id>    carry a tenant id into every output record
  --dry-run        validate + report only; write nothing; never exits non-zero for rejects
  --generate <N>   emit N days of plausible sample NDJSON to stdout and exit
  --out <file>     write normalized NDJSON here (default: stdout)
  -h, --help       show this help

Reads NDJSON (one JSON object per line) from FILE or stdin. Exits non-zero if any
line is rejected (unless --dry-run). In production this POSTs to the broker's
/v1/ingest; locally it normalizes to a file/stdout.`;

/** Read all of stdin as a string. */
function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    process.stderr.write(`ingest: ${err.message}\n`);
    process.exit(2);
  }

  if (opts.help) {
    process.stdout.write(HELP + "\n");
    return;
  }

  // --generate: emit fixtures and exit.
  if (opts.generate !== undefined) {
    const samples = generateSamples(opts.generate, {
      subject: opts.subject,
      tenant: opts.tenant,
    });
    const ndjson = samples.map((s) => JSON.stringify(s)).join("\n") + "\n";
    if (opts.out) writeFileSync(opts.out, ndjson);
    else process.stdout.write(ndjson);
    return;
  }

  // Read input.
  const raw = opts.file !== undefined ? readFileSync(opts.file, "utf8") : readStdin();
  const lines = raw.split("\n");

  const accepted = [];
  let rejected = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") continue; // skip blank lines (incl. trailing newline)
    const lineNo = i + 1;

    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch (err) {
      rejected++;
      process.stderr.write(`ingest: line ${lineNo}: invalid JSON (${err.message})\n`);
      continue;
    }

    const result = normalizeRecord(parsed, { subject: opts.subject, tenant: opts.tenant });
    if (!result.ok) {
      rejected++;
      process.stderr.write(`ingest: line ${lineNo}: ${result.error}\n`);
      continue;
    }
    accepted.push(result.item);
  }

  // Output (unless dry-run).
  if (!opts.dryRun) {
    const ndjson = accepted.map((it) => JSON.stringify(it)).join("\n") + (accepted.length ? "\n" : "");
    if (opts.out) writeFileSync(opts.out, ndjson);
    else if (ndjson) process.stdout.write(ndjson);
  }

  // Summary to stderr.
  const mode = opts.dryRun ? " (dry-run; nothing written)" : "";
  process.stderr.write(`ingest: ${accepted.length} accepted, ${rejected} rejected${mode}\n`);

  if (rejected > 0 && !opts.dryRun) process.exit(1);
}

// Only run main when executed directly (not when imported by tests).
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
