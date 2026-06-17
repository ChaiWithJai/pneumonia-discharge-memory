<script lang="ts">
  // THE RETURN — re-entry after a lapse is relief, never debt. No streak-broken,
  // no catch-up, no guilt. The ember is visibly still alight.
  import { ember } from "../lib/store.svelte";
  import { temperament } from "../lib/engine/blueprint";
  import Ember from "../lib/components/Ember.svelte";
  import Voice from "../lib/components/Voice.svelte";
  import BreathPacer from "../lib/components/BreathPacer.svelte";

  const save = $derived(ember.save!);
  const accent = $derived(temperament(save.ember.temperament).accent);
  const days = $derived(Math.floor(ember.lapseDays));
  let breathing = $state(false);

  function begin() {
    breathing = true;
  }
  function done() {
    // a returning breath gently rewarms; then home.
    ember.tend("breath");
    ember.go("B1");
  }
</script>

<div class="scene center">
  <Ember level={Math.max(0.18, save.country.emberLevel)} {accent} hush={save.country.hush} size={170} />
  <h1>Welcome back.</h1>
  {#if ember.utterance}
    <Voice text={ember.utterance.text} />
  {:else}
    <p class="voice">“Your ember held. It was always going to.”</p>
  {/if}

  <p class="faint">
    {#if days >= 7}It's been a little while — and that's completely okay.{:else}Good to see you.{/if}
    Nothing to make up. Nothing was lost.
  </p>

  <div class="spacer"></div>
  {#if breathing}
    <BreathPacer {accent} seconds={12} onComplete={done} />
  {:else}
    <button class="btn btn-primary btn-block" onclick={begin}>One breath to begin again</button>
    <button class="btn btn-ghost btn-block" onclick={() => ember.go("B1")}>Just look at the country</button>
  {/if}
</div>
