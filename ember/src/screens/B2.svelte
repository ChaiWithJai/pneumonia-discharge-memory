<script lang="ts">
  import { ember } from "../lib/store.svelte";
  import { temperament, wokenSpec } from "../lib/engine/blueprint";
  import Ember from "../lib/components/Ember.svelte";

  const save = $derived(ember.save!);
  const t = $derived(temperament(save.ember.temperament));
  const triad = $derived(save.circle.triad);
</script>

<div class="scene center">
  <span class="eyebrow">{t.name}</span>
  <Ember level={save.country.emberLevel} accent={t.accent} hush={save.country.hush} size={150} />
  <h1>{save.ember.name}</h1>
  <p class="lead">{t.genius}</p>
  <p class="faint">Its blind spot: {t.blindSpot.toLowerCase()}</p>

  <div class="card" style="width:100%;text-align:left">
    <span class="eyebrow">Standing with you</span>
    {#if triad.length}
      <div class="stack" style="margin-top:10px">
        {#each triad as w (w)}
          <button class="row" style="background:none;border:none;color:var(--ink);padding:0;justify-content:flex-start" onclick={() => ember.openWoken(w)}>
            <span class="dotgood"></span> {wokenSpec(w).name}
          </button>
        {/each}
      </div>
    {:else}
      <p style="margin-top:8px">No one yet. Wake your first companion by living — a true breath stirs the Bellows.</p>
    {/if}
  </div>

  <div class="spacer"></div>
  <button class="btn btn-block" onclick={() => ember.go("B1")}>Back to the country</button>
</div>

<style>
  .dotgood {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--good);
    display: inline-block;
    margin-right: 8px;
  }
</style>
