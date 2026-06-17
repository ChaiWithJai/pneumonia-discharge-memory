<script lang="ts">
  // You — identity & the long arc.
  import { ember } from "../lib/store.svelte";
  import { TEMPERAMENTS, temperament } from "../lib/engine/blueprint";

  const save = $derived(ember.save!);
  const t = $derived(temperament(save.ember.temperament));
  let changing = $state(false);
</script>

<div class="scene">
  <span class="eyebrow">You</span>
  <div class="card">
    <h2>{save.ember.name}</h2>
    <p style="margin-top:6px">{t.name} — {t.selfPortrait}</p>
    <div class="row" style="margin-top:10px">
      <span class="chip">day {save.country.dayCount}</span>
      <span class="chip">{save.dex.length} days tended</span>
    </div>
  </div>

  {#if changing}
    <div class="stack">
      {#each TEMPERAMENTS.filter((x) => x.available) as opt (opt.id)}
        <button class="btn btn-block" onclick={() => { ember.setTemperament(opt.id); changing = false; }}>
          Become {opt.name}
        </button>
      {/each}
      <button class="btn btn-ghost btn-block" onclick={() => (changing = false)}>Never mind</button>
    </div>
  {:else}
    <button class="btn btn-block" onclick={() => (changing = true)}>Change temperament</button>
  {/if}

  <div class="stack">
    <button class="btn btn-block" onclick={() => ember.go("C4")}>Your seasons</button>
    <button class="btn btn-block" onclick={() => ember.go("E1")}>The Commons</button>
    <button class="btn btn-block" onclick={() => ember.go("F2")}>The Ledger (privacy & data)</button>
    <button class="btn btn-block" onclick={() => ember.go("F3")}>Triggers</button>
    <button class="btn btn-block" onclick={() => ember.go("studio")}>The Studio (loop engineering)</button>
  </div>
  <button class="btn btn-ghost btn-block" onclick={() => ember.go("carepath")}>Find real help</button>
</div>
