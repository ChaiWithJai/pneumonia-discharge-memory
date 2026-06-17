<script lang="ts">
  // THE STUDIO (Loop 4). With 1–2 pilot users we read 100% of traces. Also the
  // operator's bench: dev time-travel to demonstrate the Hush/Return locally,
  // and a check-in box to exercise the care-path gate.
  import { ember } from "../lib/store.svelte";
  import { studioStats } from "../lib/loops/studio";

  const traces = $derived(ember.allTraces());
  const stats = $derived(studioStats(traces));
  const recent = $derived([...traces].reverse().slice(0, 12));
  let checkin = $state("");
</script>

<div class="scene">
  <span class="eyebrow">The Studio · loop engineering</span>

  <div class="row wrap">
    <span class="chip">{stats.total} traces</span>
    <span class="chip">rubric pass {Math.round(stats.passRate * 100)}%</span>
    <span class="chip">care-routed {stats.careRouted}</span>
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

  <span class="eyebrow">Recent traces</span>
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
      </div>
    {/each}
    {#if !recent.length}<p class="faint">No traces yet.</p>{/if}
  </div>

  <div class="spacer"></div>
  <button class="btn btn-block" onclick={() => ember.go("F4")}>Back</button>
</div>
