<script lang="ts">
  import { ember } from "../lib/store.svelte";
  import { TEMPERAMENTS } from "../lib/engine/blueprint";
</script>

<div class="scene">
  <span class="eyebrow">Choose your temperament</span>
  <p>Not a difficulty — a mirror. This is how you already meet the world.</p>
  <div class="stack">
    {#each TEMPERAMENTS as t (t.id)}
      <button
        class="card temperament"
        class:locked={!t.available}
        disabled={!t.available}
        style="border-left:3px solid {t.accent}"
        onclick={() => ember.chooseTemperament(t.id)}
      >
        <div class="row" style="justify-content:space-between">
          <h2>{t.name}</h2>
          {#if !t.available}<span class="chip">later season</span>{/if}
        </div>
        <p style="margin-top:6px">{t.selfPortrait}</p>
      </button>
    {/each}
  </div>
</div>

<style>
  .temperament {
    text-align: left;
    width: 100%;
  }
  .temperament.locked {
    opacity: 0.45;
    cursor: default;
  }
</style>
