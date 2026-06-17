<script lang="ts">
  // THE STUDIO (Loop 4). With 1–2 pilot users we read 100% of traces. Also the
  // operator's bench: human-in-the-loop review (Loop 2), trace labeling that
  // grows the eval set, dev time-travel to demo the Hush/Return, and a check-in
  // box that exercises the care-path gate.
  import { ember } from "../lib/store.svelte";
  import { studioStats, pendingCount, evalJSONL, toEvalCases } from "../lib/loops/studio";

  const traces = $derived(ember.allTraces());
  const stats = $derived(studioStats(traces));
  const pending = $derived(pendingCount(traces));
  const evalCount = $derived(toEvalCases(traces).length);
  const recent = $derived([...traces].reverse().slice(0, 14));
  let checkin = $state("");

  function exportEvals() {
    const blob = new Blob([evalJSONL(traces)], { type: "application/x-ndjson" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ember-evals.jsonl";
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<div class="scene">
  <span class="eyebrow">The Studio · loop engineering</span>

  <div class="row wrap">
    <span class="chip">{stats.total} traces</span>
    <span class="chip">rubric pass {Math.round(stats.passRate * 100)}%</span>
    <span class="chip">care-routed {stats.careRouted}</span>
    <span class="chip">{evalCount} eval cases</span>
  </div>

  {#if Object.keys(stats.byRule).length}
    <div class="card">
      <span class="eyebrow">Rubric violations by rule</span>
      {#each Object.entries(stats.byRule) as [rule, n] (rule)}
        <div class="row" style="justify-content:space-between;margin-top:6px"><span>{rule}</span><span class="faint">{n}</span></div>
      {/each}
    </div>
  {/if}

  <div class="card">
    <span class="eyebrow">Loop 2 — human in the loop</span>
    <button class="toggle" style="margin-top:8px" onclick={() => ember.setReviewMode(!ember.reviewMode)}>
      <span>
        <strong>Review mode</strong>
        <span class="faint" style="display:block;font-size:13px">New outputs are marked pending for an operator. Off = the rubric earns trust.</span>
      </span>
      <span class="switch" class:on={ember.reviewMode}></span>
    </button>
    {#if pending}
      <div class="row" style="justify-content:space-between;margin-top:10px">
        <span class="chip" style="color:var(--ember-soft)">{pending} awaiting review</span>
        <button class="btn" style="padding:6px 12px" onclick={() => ember.clearPending()}>Approve all</button>
      </div>
    {/if}
    <button class="btn btn-block" style="margin-top:10px" onclick={exportEvals} disabled={!evalCount}>
      Export eval set ({evalCount} cases, JSONL)
    </button>
  </div>

  <div class="card">
    <span class="eyebrow">Care gate — type a check-in</span>
    <input type="text" bind:value={checkin} placeholder="how are you, really?" style="margin-top:8px" />
    <button class="btn btn-block" style="margin-top:8px" onclick={() => { ember.checkIn(checkin); checkin = ""; }}>
      Send through the loop
    </button>
  </div>

  <div class="card">
    <span class="eyebrow">Operator bench (dev)</span>
    <div class="row wrap" style="margin-top:8px">
      <button class="btn" onclick={() => ember.simulateDay()}>Live a day</button>
      <button class="btn" onclick={() => ember.advanceDays(3)}>Skip 3 days</button>
      <button class="btn" onclick={() => ember.advanceDays(14)}>Skip 14 days</button>
      <button class="btn" onclick={() => ember.storm()}>Storm</button>
    </div>
  </div>

  <span class="eyebrow">Recent traces — label to grow the eval set</span>
  <div class="stack">
    {#each recent as t (t.id)}
      <div class="card">
        <div class="row" style="justify-content:space-between">
          <span class="chip">{t.event}</span>
          <span class="chip" style="color:{t.careRouted ? 'var(--ember-soft)' : t.grade.pass ? 'var(--good)' : '#e06a6a'}">
            {t.careRouted ? "→ care" : t.grade.pass ? "pass" : "FAIL"}
          </span>
        </div>
        <p style="margin-top:6px;font-size:14px">{t.output}</p>
        <div class="row" style="margin-top:8px;gap:8px">
          <button class="btn" style="padding:6px 12px" class:label-on={t.label === "good"} onclick={() => ember.labelTrace(t.id, "good")}>good</button>
          <button class="btn" style="padding:6px 12px" class:label-on={t.label === "bad"} onclick={() => ember.labelTrace(t.id, "bad")}>bad</button>
          {#if t.reviewed === false}<span class="chip" style="color:var(--ember-soft)">pending</span>{/if}
        </div>
      </div>
    {/each}
    {#if !recent.length}<p class="faint">No traces yet.</p>{/if}
  </div>

  <div class="spacer"></div>
  <button class="btn btn-block" onclick={() => ember.go("F4")}>Back</button>
</div>

<style>
  .label-on {
    border-color: var(--good);
    color: var(--good);
  }
</style>
