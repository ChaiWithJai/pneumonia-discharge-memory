<script lang="ts">
  // The recruit ceremony — recruit by living, never by chance.
  import { ember } from "../lib/store.svelte";
  import { wokenSpec, temperament } from "../lib/engine/blueprint";
  import Ember from "../lib/components/Ember.svelte";

  const save = $derived(ember.save!);
  const accent = $derived(temperament(save.ember.temperament).accent);
  const woke = $derived(ember.justWoke.length ? wokenSpec(ember.justWoke[0]) : null);
</script>

<div class="scene center">
  {#if woke}
    <span class="eyebrow">Something stirred</span>
    <Ember level={Math.max(0.5, save.country.emberLevel)} {accent} size={150} />
    <h1>{woke.name} woke.</h1>
    <p class="lead">{woke.gift}</p>
    <p class="faint">You woke it by living — {woke.wakes}.</p>
    <div class="spacer"></div>
    <button class="btn btn-primary btn-block" onclick={() => { ember.justWoke = []; ember.go("B1"); }}>
      Welcome it to the Circle
    </button>
  {:else}
    <p>All quiet for now.</p>
    <button class="btn btn-block" onclick={() => ember.go("B1")}>Back</button>
  {/if}
</div>
