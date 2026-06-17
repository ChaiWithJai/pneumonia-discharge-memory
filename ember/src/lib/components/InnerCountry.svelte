<script lang="ts">
  import { DIMENSIONS } from "../types";
  import type { CountryState, Dimension } from "../types";
  import { DIMENSION_META, SEASON_META } from "../engine/blueprint";
  import Ember from "./Ember.svelte";

  interface Props {
    country: CountryState;
    accent?: string;
    height?: number;
  }
  let { country, accent = "#e0894a", height = 320 }: Props = $props();

  const sky = $derived(SEASON_META[country.season].sky);
  const sat = $derived(1 - country.hush * 0.55);

  // Back-to-front band order across the country.
  const order: Dimension[] = ["attention", "breath", "connection", "rest", "movement"];

  function band(i: number): string {
    // a soft rolling hill silhouette, varied by index
    const top = 120 + i * 34;
    const a = 18 + ((i * 13) % 22);
    const b = 12 + ((i * 7) % 18);
    return `M0 ${top + a} C 100 ${top - b}, 200 ${top + b}, 320 ${top - a} L320 340 L0 340 Z`;
  }
  function fill(d: Dimension): number {
    return 0.18 + 0.72 * Math.max(0, Math.min(1, country.warmth[d]));
  }
  void DIMENSIONS;
</script>

<div class="country" style="height:{height}px;filter:saturate({sat});">
  <svg viewBox="0 0 320 340" preserveAspectRatio="xMidYMax slice">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color={sky[0]} />
        <stop offset="100%" stop-color={sky[1]} />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="320" height="340" fill="url(#sky)" />
    {#each order as d, i (d)}
      <path d={band(i)} fill={DIMENSION_META[d].color} opacity={fill(d)} class="hill" />
    {/each}
    {#if country.hush > 0}
      <rect x="0" y="0" width="320" height="340" fill="#0c0a12" opacity={country.hush * 0.5} />
    {/if}
  </svg>

  <div class="ember-anchor">
    <Ember level={country.emberLevel} {accent} hush={country.hush} size={Math.round(height * 0.5)} />
  </div>
</div>

<style>
  .country {
    position: relative;
    width: 100%;
    border-radius: var(--radius);
    overflow: hidden;
    border: 1px solid var(--line);
    transition: filter 0.8s ease;
  }
  svg {
    display: block;
    width: 100%;
    height: 100%;
  }
  .hill {
    transition: opacity 0.9s ease;
  }
  .ember-anchor {
    position: absolute;
    left: 50%;
    top: 46%;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }
</style>
