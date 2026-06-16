<script lang="ts">
  import { conf, FLOW, type State } from "./store.svelte";

  const STEP_LABEL: Record<string, string> = {
    present: "Present",
    feel: "Feel",
    judge: "Judge",
    reckon: "Reckon",
    decide: "Decide",
    compound: "Compound",
  };

  let activeIndex = $derived(FLOW.indexOf(conf.state as State));
</script>

<header class="chrome">
  <div class="brand">
    <span class="mark">◷</span>
    <div>
      <div class="name">Pneumonia Discharge</div>
      <div class="label">Institutional Memory Runtime</div>
    </div>
  </div>

  <nav class="stepper" aria-label="conference steps">
    {#each FLOW as step, i}
      <div class="step" class:done={activeIndex > i} class:on={activeIndex === i}>
        <span class="dot"></span>
        <span class="slabel">{STEP_LABEL[step]}</span>
      </div>
    {/each}
  </nav>

  <div class="meters">
    {#if conf.memory}
      <div class="meter"><b>{conf.memory.runs_completed}</b><span class="label">runs</span></div>
      <div class="meter"><b>{conf.memory.tools_in_memory}</b><span class="label">tools</span></div>
      <div class="meter accent"><b>+{conf.memory.cumulative_steps_saved}</b><span class="label">saved</span></div>
    {/if}
    {#if conf.config}
      <div class="status">
        <span class="sdot" class:up={conf.config.writer_available}></span>
        <span class="sdot" class:up={conf.config.studio_available}></span>
      </div>
    {/if}
  </div>
</header>

<style>
  .chrome {
    position: sticky;
    top: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 14px 26px;
    background: linear-gradient(180deg, #0b0f15ee, #0b0f15bb);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--line);
  }
  .brand { display: flex; align-items: center; gap: 11px; }
  .mark {
    font-size: 22px;
    color: var(--accent);
    transition: color 1s ease;
  }
  .name { font-family: var(--serif); font-size: 16px; line-height: 1.1; }
  .stepper { display: flex; gap: 4px; margin: 0 auto; }
  .step {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 6px 12px;
    border-radius: 999px;
    opacity: 0.45;
    transition: opacity 0.4s ease, background 0.4s ease;
  }
  .step.on { opacity: 1; background: var(--accent-soft); }
  .step.done { opacity: 0.8; }
  .dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--faint);
    transition: background 0.4s ease, box-shadow 0.4s ease;
  }
  .step.on .dot { background: var(--accent); box-shadow: 0 0 10px var(--accent); }
  .step.done .dot { background: var(--accent); }
  .slabel { font-size: 12px; color: var(--dim); }
  .step.on .slabel { color: var(--paper); }
  .meters { display: flex; align-items: center; gap: 16px; }
  .meter { text-align: right; line-height: 1; }
  .meter b { font-family: var(--serif); font-size: 19px; }
  .meter.accent b { color: var(--gold); }
  .meter .label { display: block; margin-top: 2px; }
  .status { display: flex; gap: 5px; margin-left: 4px; }
  .sdot { width: 7px; height: 7px; border-radius: 50%; background: var(--faint); }
  .sdot.up { background: var(--teal); box-shadow: 0 0 8px var(--teal); }
  @media (max-width: 820px) {
    .stepper { display: none; }
  }
</style>
