<script lang="ts">
  import { conf } from "../store.svelte";
  const LAYERS = [
    { v: "organizational", l: "Organizational" },
    { v: "domain", l: "Domain · pneumonia" },
    { v: "service_line", l: "Service-line · pulmonary" },
    { v: "patient", l: "Patient-specific" },
  ];
</script>

<section class="stage">
  <p class="label eyebrow rise rise-1">Decide &amp; compound</p>
  <h1 class="hero rise rise-1">One rule the room will <span class="em">keep</span>.</h1>
  <p class="lead rise rise-2">
    The leader records the consensus and a single reusable rule. It persists as institutional memory, tagged to a
    layer of the knowledge chain, and becomes part of every future case's context.
  </p>

  <div class="form card pad rise rise-3">
    <label class="label" for="rule">Reusable rule</label>
    <input
      id="rule"
      class="rule"
      placeholder="e.g. lives-alone + high access-risk → mandatory pharmacy follow-up"
      bind:value={conf.lessonText}
    />

    <span class="label" style="margin-top:18px;display:block">Tag to knowledge layer</span>
    <div class="layers">
      {#each LAYERS as L}
        <button class="layer" class:on={conf.layer === L.v} onclick={() => (conf.layer = L.v)}>{L.l}</button>
      {/each}
    </div>
  </div>

  <div class="cta rise rise-4">
    <button class="primary" onclick={() => conf.compound()} disabled={conf.busy}>
      {conf.busy ? "Compounding…" : "Compound & export →"}
    </button>
    {#if !conf.lessonText.trim()}<span class="muted">a rule is optional, but it's the durable artifact</span>{/if}
  </div>
  {#if conf.error}<p class="err">{conf.error}</p>{/if}
</section>

<style>
  .form { max-width: 680px; }
  .rule { width: 100%; margin-top: 8px; background: var(--ink-2); border: 1px solid var(--line); border-radius: 10px; color: var(--paper); padding: 13px 15px; font-family: var(--sans); font-size: 14px; }
  .rule:focus { outline: none; border-color: var(--accent); }
  .layers { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
  .layer { background: var(--panel-2); border: 1px solid var(--line); color: var(--dim); border-radius: 9px; padding: 9px 14px; font-size: 12.5px; transition: all 0.2s ease; }
  .layer.on { border-color: var(--accent); color: var(--paper); background: var(--accent-soft); }
</style>
