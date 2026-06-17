<script lang="ts">
  import { ember } from "../lib/store.svelte";
  import Ember from "../lib/components/Ember.svelte";
</script>

<div class="scene center">
  <div class="spacer"></div>
  <Ember level={0.16} hush={0.2} size={200} />
  <div class="spacer"></div>
  <h1>A companion that grows<br />from how you actually live.</h1>
  <p class="lead">Not a tracker. Not a score. A small light you tend — that can dim, but never dies.</p>
  <div class="spacer"></div>
  <button class="btn btn-primary btn-block" onclick={() => ember.go("A2")}>Begin</button>
</div>
