<script lang="ts">
  import { ember } from "../lib/store.svelte";
  import { temperament } from "../lib/engine/blueprint";
  import Ember from "../lib/components/Ember.svelte";
  import BreathPacer from "../lib/components/BreathPacer.svelte";

  const accent = $derived(temperament(ember.draftTemperament).accent);
  let progress = $state(0);
  let finishing = $state(false);

  function complete() {
    finishing = true;
    // let the "catch" land before moving on
    setTimeout(() => ember.completeFirstBreath(), 1400);
  }
</script>

<div class="scene center">
  <span class="eyebrow">Your first breath</span>
  <Ember level={0.16 + 0.7 * progress} {accent} size={150} />
  {#if !finishing}
    <BreathPacer {accent} seconds={19} onProgress={(v) => (progress = v)} onComplete={complete} />
    <p class="faint">Follow the light. One breath is enough to begin.</p>
  {:else}
    <p class="voice">The valley warmed. Your ember caught.</p>
  {/if}
</div>
