<script lang="ts">
  import { onMount } from "svelte";
  import type { Score } from "./types";

  let { score }: { score: Score } = $props();
  let w = $state(0);
  onMount(() => {
    requestAnimationFrame(() => (w = Math.round(score.value * 100)));
  });
  const pretty = (s: string) => s.replace(/_/g, " ");
</script>

<div class="score">
  <div class="top">
    <span class="nm">{pretty(score.name)}</span>
    <span class="band band-{score.band}">{score.band} · {score.value.toFixed(2)}</span>
  </div>
  <div class="track">
    <span class="fill fill-{score.band}" style="width:{w}%"></span>
  </div>
  {#if score.evidence.length}
    <p class="ev">{score.evidence.map((e) => e.interpretation).join(" ")}</p>
  {/if}
</div>

<style>
  .score { margin: 14px 0; }
  .top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; }
  .nm { font-size: 13.5px; }
  .band {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 3px 8px;
    border-radius: 6px;
  }
  .band-low { background: #16331f; color: var(--low); }
  .band-moderate { background: #33290f; color: var(--moderate); }
  .band-high { background: #341a19; color: var(--high); }
  .track { height: 9px; border-radius: 5px; background: #161f2a; overflow: hidden; }
  .fill { display: block; height: 100%; border-radius: 5px; width: 0; transition: width 0.9s cubic-bezier(0.2, 0.8, 0.2, 1); }
  .fill-low { background: linear-gradient(90deg, #2c7a55, var(--low)); }
  .fill-moderate { background: linear-gradient(90deg, #8a6c2e, var(--moderate)); }
  .fill-high { background: linear-gradient(90deg, #8f3a37, var(--high)); }
  .ev { margin: 7px 0 0; font-size: 11.5px; line-height: 1.45; color: var(--faint); }
</style>
