<script lang="ts">
  // The thin real Witness (loop plan, this-week pilot): a 20-second manual
  // check-in. Deliberately secondary and lower-confidence (ADR-0002) — "tell the
  // Witness yourself" — never the mainstream input.
  import { ember } from "../lib/store.svelte";
  import { DIMENSIONS } from "../lib/types";
  import type { Dimension } from "../lib/types";
  import { DIMENSION_META } from "../lib/engine/blueprint";

  const save = $derived(ember.save!);
  const dims = $derived(DIMENSIONS.filter((d) => save.settings.sensing[d]));
  const levels = [
    { label: "low", v: 0.2 },
    { label: "okay", v: 0.55 },
    { label: "good", v: 0.9 },
  ];
  let choice = $state<Record<Dimension, number>>({
    breath: 1,
    rest: 1,
    movement: 1,
    attention: 1,
    connection: 1,
  });

  function submit() {
    const values: Partial<Record<Dimension, number>> = {};
    for (const d of dims) values[d] = levels[choice[d]].v;
    ember.ingestManual(values);
    ember.go("B1");
  }
</script>

<div class="scene">
  <span class="eyebrow">Tell the Witness</span>
  <p>No device today? A quick, honest word is enough. This counts a little lighter than a sensed signal — and that's right.</p>

  <div class="stack">
    {#each dims as d (d)}
      <div class="card">
        <strong>{DIMENSION_META[d].label}</strong>
        <span class="faint" style="display:block;font-size:13px;margin-bottom:8px">{DIMENSION_META[d].description}</span>
        <div class="row" style="gap:8px">
          {#each levels as lv, i (lv.label)}
            <button
              class="btn"
              style="flex:1;padding:10px"
              class:sel={choice[d] === i}
              onclick={() => (choice[d] = i)}
            >{lv.label}</button>
          {/each}
        </div>
      </div>
    {/each}
  </div>

  <div class="spacer"></div>
  <button class="btn btn-primary btn-block" onclick={submit}>Tell the Witness</button>
  <button class="btn btn-ghost btn-block" onclick={() => ember.go("B1")}>Never mind</button>
</div>

<style>
  .sel {
    border-color: var(--accent);
    color: var(--ember-soft);
  }
</style>
