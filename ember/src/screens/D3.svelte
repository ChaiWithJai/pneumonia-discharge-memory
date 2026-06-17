<script lang="ts">
  // THE STORM — hard days met with the crew and a designed sense of being held,
  // with a real floor beneath it: the care path is always one tap away.
  import { ember } from "../lib/store.svelte";
  import { temperament, wokenSpec } from "../lib/engine/blueprint";
  import Ember from "../lib/components/Ember.svelte";
  import Voice from "../lib/components/Voice.svelte";

  const save = $derived(ember.save!);
  const accent = $derived(temperament(save.ember.temperament).accent);
  const triad = $derived(save.circle.triad);
</script>

<div class="scene center">
  <span class="eyebrow">A hard day</span>
  <Ember level={Math.max(0.2, save.country.emberLevel)} {accent} hush={0.3} size={150} />
  {#if ember.utterance}<Voice text={ember.utterance.text} />{/if}

  <div class="card" style="width:100%;text-align:left">
    <p>You don't have to steady this alone.
      {#if triad.length}Your crew is here:{/if}
    </p>
    {#if triad.length}
      <div class="row wrap" style="margin-top:8px">
        {#each triad as w (w)}<span class="chip">{wokenSpec(w).name}</span>{/each}
      </div>
    {/if}
  </div>

  <div class="spacer"></div>
  <button class="btn btn-primary btn-block" onclick={() => ember.go("B1")}>Stay a moment, then return</button>
  <button class="btn btn-block" style="border-color:var(--ember-soft)" onclick={() => ember.go("carepath")}>
    I need real help right now
  </button>
</div>
