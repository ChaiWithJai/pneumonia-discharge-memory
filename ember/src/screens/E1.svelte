<script lang="ts">
  // The Commons (preview / v2 in the spec). Encouragement, never ranking — no
  // leaderboards, no vanity metrics. Local mock cohort.
  import { ember } from "../lib/store.svelte";

  const hearths = [
    { name: "a friend's hearth", season: "Bright", warmth: "warm" },
    { name: "your cohort", season: "Waning", warmth: "steady" },
    { name: "a quiet hearth", season: "Winter", warmth: "resting" },
  ];
</script>

<div class="scene">
  <span class="eyebrow">The Commons · preview</span>
  <p>Tend alongside others. Send warmth, never scores. There are no leaderboards here — by design, the ranking primitives don't even exist.</p>
  <div class="stack">
    {#each hearths as h (h.name)}
      <button class="card" style="text-align:left;width:100%" onclick={() => ember.go("E2")}>
        <div class="row" style="justify-content:space-between">
          <strong>{h.name}</strong>
          <span class="chip">{h.season}</span>
        </div>
        <p style="margin-top:6px">Their country is {h.warmth} today.</p>
      </button>
    {/each}
  </div>
  <p class="faint">The Kin wakes here in a later season — when connection can be witnessed both ways.</p>
  <div class="spacer"></div>
  <button class="btn btn-block" onclick={() => ember.go("B1")}>Back to the country</button>
</div>
