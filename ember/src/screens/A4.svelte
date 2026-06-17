<script lang="ts">
  import { ember } from "../lib/store.svelte";
  import { temperament } from "../lib/engine/blueprint";
  import Ember from "../lib/components/Ember.svelte";

  const accent = $derived(temperament(ember.draftTemperament).accent);
  let name = $state("Cinder");
</script>

<div class="scene center">
  <span class="eyebrow">Name your ember</span>
  <Ember level={0.3} {accent} size={150} />
  <p>A name is a small promise. It loads the next time you return.</p>
  <input type="text" bind:value={name} maxlength="24" style="text-align:center" />
  <div class="spacer"></div>
  <button class="btn btn-primary btn-block" onclick={() => ember.nameEmber(name)} disabled={!name.trim()}>
    This is {name.trim() || "…"}
  </button>
</div>
