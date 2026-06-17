import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { normalizeRecord, generateSamples, parseArgs } from "./ingest.mjs";

const CLI = fileURLToPath(new URL("./ingest.mjs", import.meta.url));

function runCli(args, input) {
  const res = spawnSync("node", [CLI, ...args], {
    input: input ?? "",
    encoding: "utf8",
  });
  return {
    code: res.status ?? 1,
    stdout: res.stdout ?? "",
    stderr: res.stderr ?? "",
  };
}

test("normalizeRecord clamps values into [0,1]", () => {
  const r = normalizeRecord({ values: { breath: 1.7, rest: -0.4 } });
  assert.ok(r.ok);
  assert.equal(r.item.values.breath, 1);
  assert.equal(r.item.values.rest, 0);
});

test("normalizeRecord drops unknown dimension keys", () => {
  const r = normalizeRecord({ values: { breath: 0.5, sleepiness: 0.9, foo: 1 } });
  assert.ok(r.ok);
  assert.deepEqual(Object.keys(r.item.values), ["breath"]);
});

test("normalizeRecord defaults confidence to 0.6 and clamps it", () => {
  const a = normalizeRecord({ values: { rest: 0.5 } });
  assert.equal(a.item.confidence, 0.6);
  const b = normalizeRecord({ values: { rest: 0.5 }, confidence: 5 });
  assert.equal(b.item.confidence, 1);
  const c = normalizeRecord({ values: { rest: 0.5 }, confidence: -2 });
  assert.equal(c.item.confidence, 0);
});

test("normalizeRecord defaults source to cli and at/day when missing", () => {
  const before = Date.now();
  const r = normalizeRecord({ values: { rest: 0.5 } });
  assert.equal(r.item.source, "cli");
  assert.ok(r.item.at >= before);
  assert.match(r.item.day, /^\d{4}-\d{2}-\d{2}$/);
});

test("normalizeRecord derives day from at when day missing", () => {
  const at = Date.UTC(2026, 0, 15, 12, 0, 0); // 2026-01-15
  const r = normalizeRecord({ values: { rest: 0.5 }, at });
  assert.equal(r.item.day, "2026-01-15");
});

test("idempotency key is source:subject:day", () => {
  const r = normalizeRecord(
    { values: { rest: 0.5 }, day: "2026-01-15", source: "oura" },
    { subject: "me" },
  );
  assert.equal(r.item.idempotencyKey, "oura:me:2026-01-15");
  assert.equal(r.item.subject, "me");
});

test("subject/tenant flags override and carry through", () => {
  const r = normalizeRecord(
    { values: { rest: 0.5 }, subject: "ignored" },
    { subject: "flagsub", tenant: "acme" },
  );
  assert.equal(r.item.subject, "flagsub");
  assert.equal(r.item.tenant, "acme");
});

test("normalizeRecord rejects missing/empty values", () => {
  assert.equal(normalizeRecord({ confidence: 0.5 }).ok, false);
  assert.equal(normalizeRecord({ values: {} }).ok, false);
  assert.equal(normalizeRecord({ values: { unknown: 0.5 } }).ok, false);
});

test("normalizeRecord rejects non-objects and bad day", () => {
  assert.equal(normalizeRecord(null).ok, false);
  assert.equal(normalizeRecord([1, 2]).ok, false);
  assert.equal(normalizeRecord({ values: { rest: 0.5 }, day: "Jan 1" }).ok, false);
  assert.equal(normalizeRecord({ values: { rest: "abc" } }).ok, false);
});

test("generateSamples produces N records of correct shape", () => {
  const out = generateSamples(7, { subject: "me" });
  assert.equal(out.length, 7);
  for (const rec of out) {
    assert.match(rec.day, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(typeof rec.source, "string");
    assert.equal(typeof rec.at, "number");
    assert.equal(rec.subject, "me");
    assert.ok(rec.confidence >= 0 && rec.confidence <= 1);
    for (const [k, v] of Object.entries(rec.values)) {
      assert.ok(["breath", "rest", "movement", "attention", "connection"].includes(k));
      assert.ok(v >= 0 && v <= 1);
    }
  }
  // days are strictly increasing
  const days = out.map((r) => r.day);
  assert.deepEqual([...days].sort(), days);
});

test("parseArgs reads flags and positional file", () => {
  const o = parseArgs(["data.ndjson", "--subject", "me", "--tenant", "t", "--dry-run"]);
  assert.equal(o.file, "data.ndjson");
  assert.equal(o.subject, "me");
  assert.equal(o.tenant, "t");
  assert.equal(o.dryRun, true);
});

test("CLI: --generate emits N lines of valid JSON", () => {
  const { code, stdout } = runCli(["--generate", "3"]);
  assert.equal(code, 0);
  const lines = stdout.trim().split("\n");
  assert.equal(lines.length, 3);
  for (const l of lines) {
    const obj = JSON.parse(l);
    assert.match(obj.day, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(obj.values);
  }
});

test("CLI: normalizes stdin and carries subject", () => {
  const input = '{"values":{"breath":1.7,"foo":1},"day":"2026-01-15","source":"oura"}\n';
  const { code, stdout, stderr } = runCli(["--subject", "me"], input);
  assert.equal(code, 0);
  const obj = JSON.parse(stdout.trim());
  assert.equal(obj.values.breath, 1);
  assert.equal(obj.values.foo, undefined);
  assert.equal(obj.idempotencyKey, "oura:me:2026-01-15");
  assert.match(stderr, /1 accepted, 0 rejected/);
});

test("CLI: rejects malformed lines and exits non-zero", () => {
  const input = '{"values":{"rest":0.5}}\nnot json\n{"oops":true}\n';
  const { code, stderr } = runCli([], input);
  assert.equal(code, 1);
  assert.match(stderr, /line 2: invalid JSON/);
  assert.match(stderr, /line 3:/);
  assert.match(stderr, /1 accepted, 2 rejected/);
});

test("CLI: --dry-run never exits non-zero and writes nothing", () => {
  const input = "not json\n";
  const { code, stdout, stderr } = runCli(["--dry-run"], input);
  assert.equal(code, 0);
  assert.equal(stdout, "");
  assert.match(stderr, /dry-run/);
});
