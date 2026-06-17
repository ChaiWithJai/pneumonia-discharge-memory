<script lang="ts">
  import { ember } from "../lib/store.svelte";
  import { temperament, SEASON_META } from "../lib/engine/blueprint";
  import InnerCountry from "../lib/components/InnerCountry.svelte";
  import Voice from "../lib/components/Voice.svelte";

  const save = $derived(ember.save!);
  const accent = $derived(temperament(save.ember.temperament).accent);
</script>

<div class="scene">
  <div class="row" style="justify-content:space-between">
    <span class="chip">{SEASON_META[save.country.season].label}</span>
    <button class="btn btn-ghost" style="padding:6px 12px" onclick={() => ember.go("B2")}>{save.ember.name} →</button>
  </div>

  <InnerCountry country={save.country} {accent} height={300} />

  {#if ember.utterance}<Voice text={ember.utterance.text} />{/if}

  {#if ember.inHush}
    <p class="faint">The country has quieted while you were away. Nothing is lost — tend whenever you like.</p>
  {/if}

  <div class="spacer"></div>
  <button class="btn btn-primary btn-block" onclick={() => ember.go("B4")}>Tend</button>
  <button class="btn btn-block" onclick={() => ember.go("B3")}>What my living made today</button>
</div>
