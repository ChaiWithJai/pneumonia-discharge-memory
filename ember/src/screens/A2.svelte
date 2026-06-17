<script lang="ts">
  import { ember } from "../lib/store.svelte";
  const cards = [
    { t: "You live, it grows", b: "Your breath, rest, and movement are noticed — and the world inside answers." },
    { t: "You never tap to feed it", b: "There are no chores here. Living well is the only input." },
    { t: "It can dim, but never die", b: "Drift, and the country quiets. Return, and the warmth comes back. No debt, ever." },
  ];
</script>

<div class="scene">
  <span class="eyebrow">How Ember works</span>
  <div class="stack">
    {#each cards as c (c.t)}
      <div class="card">
        <h2>{c.t}</h2>
        <p style="margin-top:8px">{c.b}</p>
      </div>
    {/each}
  </div>
  <div class="spacer"></div>
  <button class="btn btn-primary btn-block" onclick={() => ember.go("A3")}>I understand</button>
</div>
