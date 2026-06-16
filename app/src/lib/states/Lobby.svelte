<script lang="ts">
  import { conf } from "../store.svelte";
  const AGENDA = [
    { label: "High-risk · lives alone", file: "pneumonia_case_001.json" },
    { label: "Borderline · data gap", file: "pneumonia_case_003_missing_data.json" },
    { label: "Low-risk · strong support", file: "pneumonia_case_002_low_risk.json" },
  ];
</script>

<section class="stage">
  <p class="label eyebrow rise rise-1">Case conference · pulmonary service line</p>
  <h1 class="hero rise rise-1">Turn the room's judgment into <span class="em">institutional memory</span>.</h1>
  <p class="lead rise rise-2">
    One discharge case at a time, the people who do the work review what the runtime decided, feel the patient's
    options, vote, and reckon with the real outcome. Their judgment compounds into a durable standard — and exports
    as eval &amp; preference data any model can learn from.
  </p>

  <div class="agenda rise rise-3">
    <span class="label">Today's agenda</span>
    <div class="rows">
      {#each AGENDA as a, i}
        <div class="row"><span class="n mono">{i + 1}</span><span>{a.label}</span></div>
      {/each}
    </div>
  </div>

  <div class="cta rise rise-4">
    <button class="primary" onclick={() => conf.begin()}>Begin session →</button>
    {#if conf.memory && conf.memory.runs_completed > 0}
      <span class="muted">memory is warm · {conf.memory.tools_in_memory} tools · +{conf.memory.cumulative_steps_saved} steps saved</span>
    {/if}
  </div>
  {#if conf.error}<p class="err">{conf.error}</p>{/if}
</section>

<style>
  .agenda { margin-top: 34px; }
  .rows { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; max-width: 460px; }
  .row {
    display: flex; align-items: center; gap: 14px;
    padding: 13px 16px; border: 1px solid var(--line); border-radius: 11px;
    background: var(--panel-2); font-size: 13.5px;
  }
  .n { color: var(--accent); font-size: 12px; }
</style>
