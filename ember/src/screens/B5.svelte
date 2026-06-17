<script lang="ts">
  import { ember } from "../lib/store.svelte";
  import { temperament } from "../lib/engine/blueprint";
  import Ember from "../lib/components/Ember.svelte";
  import Voice from "../lib/components/Voice.svelte";

  const save = $derived(ember.save!);
  const accent = $derived(temperament(save.ember.temperament).accent);
</script>

<div class="scene center">
  <span class="eyebrow">The Kindle</span>
  <Ember level={save.country.emberLevel} {accent} hush={save.country.hush} size={150} />
  {#if ember.utterance}<Voice text={ember.utterance.text} />{/if}
  <div class="spacer"></div>
  <button class="btn btn-primary btn-block" onclick={() => ember.go("B1")}>Close, gently</button>
  <button class="btn btn-ghost btn-block" onclick={() => ember.go("F1")}>Go live — I'll be here</button>
</div>
