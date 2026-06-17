<script lang="ts">
  import { ember } from "../lib/store.svelte";
  import Ember from "../lib/components/Ember.svelte";
</script>

<div class="scene center">
  <Ember level={0.7} hush={0} size={140} />
  <h1>Warmth sent.</h1>
  <p class="lead">A low-cost gesture, no status attached. The Kin stirs on both sides.</p>
  <div class="spacer"></div>
  <button class="btn btn-primary btn-block" onclick={() => ember.go("E1")}>Back to the Commons</button>
</div>
