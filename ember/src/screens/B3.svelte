<script lang="ts">
  import { ember } from "../lib/store.svelte";
  import { DIMENSIONS } from "../lib/types";
  import { DIMENSION_META } from "../lib/engine/blueprint";

  const n = $derived(ember.nourishment);
  // never a number — light shown as a soft band
  function words(v: number): string {
    if (v >= 0.66) return "bright";
    if (v >= 0.33) return "warming";
    if (v > 0.05) return "a faint glow";
    return "quiet";
  }
</script>

<div class="scene">
  <span class="eyebrow">What your living made today</span>
  <p>Not a verdict — just what the Witness noticed. No number, no red.</p>

  {#if ember.harvest}
    <div class="card" style="border-left:3px solid var(--good)">
      <span class="eyebrow">The Hearthkeeper's dawn idea</span>
      <p class="voice" style="margin-top:8px">“{ember.harvest}”</p>
    </div>
  {/if}

  <div class="stack">
    {#each DIMENSIONS as d (d)}
      {@const v = n.byDimension[d]}
      <div class="card">
        <div class="row" style="justify-content:space-between">
          <strong>{DIMENSION_META[d].region}</strong>
          <span class="faint">{words(v)}</span>
        </div>
        <div class="track"><span style="width:{Math.max(4, v * 100)}%;background:{DIMENSION_META[d].color}"></span></div>
      </div>
    {/each}
  </div>

  <div class="spacer"></div>
  <button class="btn btn-block" onclick={() => ember.go("B1")}>Back to the country</button>
</div>

<style>
  .track {
    margin-top: 10px;
    height: 8px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.07);
    overflow: hidden;
  }
  .track span {
    display: block;
    height: 100%;
    border-radius: 999px;
    transition: width 0.8s ease;
  }
</style>
