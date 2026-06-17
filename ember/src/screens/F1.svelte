<script lang="ts">
  // The inversion — the screen that tells you to leave. North-star = lives
  // tended, not minutes captured.
  import { ember } from "../lib/store.svelte";
  import Ember from "../lib/components/Ember.svelte";
  import { temperament } from "../lib/engine/blueprint";
  const accent = $derived(temperament(ember.save!.ember.temperament).accent);
</script>

<div class="scene center">
  <Ember level={ember.save!.country.emberLevel} {accent} size={140} />
  <h1>Go live — I'll be here.</h1>
  <p class="lead">
    The country grows because you put the phone down and went and breathed, moved, and reached for someone — for real.
  </p>
  <p class="faint">The best sessions are the ones that end out there. We measure days well-lived, not minutes spent here.</p>
  <div class="spacer"></div>
  <button class="btn btn-primary btn-block" onclick={() => ember.go("B1")}>I'm going</button>
</div>
