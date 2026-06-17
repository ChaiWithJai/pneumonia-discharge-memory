<script lang="ts">
  import { ember } from "../lib/store.svelte";
  import { PRACTICES, temperament, wokenSpec } from "../lib/engine/blueprint";
  import type { Practice } from "../lib/types";
  import BreathPacer from "../lib/components/BreathPacer.svelte";

  const accent = $derived(temperament(ember.save!.ember.temperament).accent);
  let active = $state<Practice | null>(null);

  function finish(p: Practice) {
    active = null;
    ember.tend(p.dimension);
  }
</script>

<div class="scene">
  {#if active}
    <div class="scene center" style="padding:0">
      <span class="eyebrow">{active.name}</span>
      <BreathPacer {accent} seconds={active.dimension === "breath" ? 19 : 10} onComplete={() => finish(active!)} />
      <p class="faint">{active.blurb}</p>
      <button class="btn btn-ghost" onclick={() => (active = null)}>Stop</button>
    </div>
  {:else}
    <span class="eyebrow">Tend — the Kindling</span>
    <p>Practices are fuel, not chores. Each one stirs a companion. Success isn't time spent here.</p>
    <div class="stack">
      {#each PRACTICES as p (p.id)}
        <button class="card" style="text-align:left;width:100%" onclick={() => (active = p)}>
          <div class="row" style="justify-content:space-between">
            <strong>{p.name}</strong>
            <span class="chip">wakes {wokenSpec(p.wakes).name}</span>
          </div>
          <p style="margin-top:6px">{p.blurb}</p>
        </button>
      {/each}
    </div>
    <div class="spacer"></div>
    <button class="btn btn-block" onclick={() => ember.go("B1")}>Back to the country</button>
  {/if}
</div>
