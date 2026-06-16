<script lang="ts">
  import { conf } from "../store.svelte";
  import WhatIfFrame from "../WhatIfFrame.svelte";

  let r = $derived(conf.present?.runtime);
  let seed = $derived(conf.present?.hero_seed ?? 7);
</script>

{#if r}
  <section class="stage">
    <p class="label eyebrow rise rise-1">Feel · the three paths</p>
    <h1 class="hero rise rise-1">Before a score, a <span class="em">person</span>.</h1>
    <p class="lead rise rise-2">
      Three discharge paths, each illustrated on-device by Bonsai Image. The frame paints instantly from the scenario,
      then upgrades to a render when the studio is up. No identifiable likeness, no fear — dignity by design.
    </p>

    <div class="plates rise rise-3">
      {#each r.scenarios as s, i (s.name)}
        <WhatIfFrame scenario={s} seed={seed + i} narratable={true} />
      {/each}
    </div>

    <div class="cta rise rise-4">
      <button class="primary" onclick={() => conf.toJudge()}>Open the vote →</button>
    </div>
  </section>
{/if}

<style>
  .plates { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 26px; }
  @media (max-width: 900px) { .plates { grid-template-columns: 1fr; } }
</style>
