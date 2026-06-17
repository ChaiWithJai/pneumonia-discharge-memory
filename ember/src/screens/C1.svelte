<script lang="ts">
  import { ember } from "../lib/store.svelte";
  import { WOKEN, temperament } from "../lib/engine/blueprint";
  import Ember from "../lib/components/Ember.svelte";

  const save = $derived(ember.save!);
  const accent = $derived(temperament(save.ember.temperament).accent);
</script>

<div class="scene">
  <span class="eyebrow">The Circle</span>
  <div class="row" style="justify-content:center">
    <Ember level={save.country.emberLevel} {accent} hush={save.country.hush} size={110} />
  </div>
  <p style="text-align:center">{save.ember.name} + a triad you build by living — never by chance.</p>

  <div class="stack">
    {#each WOKEN as w (w.id)}
      {@const st = save.woken[w.id]}
      <button class="card woken" disabled={!st.awake} onclick={() => ember.openWoken(w.id)}>
        <div class="row" style="justify-content:space-between">
          <strong>{w.name}</strong>
          {#if st.awake}
            <span class="chip" style="color:var(--good)">awake</span>
          {:else if w.wakeable}
            <span class="chip">{Math.round(st.progress * 100)}% — {w.wakes}</span>
          {:else}
            <span class="chip">{w.comingSoon}</span>
          {/if}
        </div>
        {#if st.awake}<p style="margin-top:6px">{w.gift}</p>{/if}
      </button>
    {/each}
  </div>
</div>

<style>
  .woken {
    text-align: left;
    width: 100%;
  }
  .woken:disabled {
    opacity: 0.6;
    cursor: default;
  }
</style>
