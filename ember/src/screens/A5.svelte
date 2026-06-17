<script lang="ts">
  import { ember } from "../lib/store.svelte";
  import { DIMENSIONS } from "../lib/types";
  import type { Dimension } from "../lib/types";
  import { DIMENSION_META } from "../lib/engine/blueprint";

  const blurb: Record<Dimension, string> = {
    breath: "Breath & calm (a brief sensed check-in)",
    rest: "Sleep & rest (from a worn device)",
    movement: "Movement (from a worn device)",
    attention: "Held stillness",
    connection: "Reaching for others (in the Commons, later)",
  };
  let sensing = $state<Record<Dimension, boolean>>({
    breath: true,
    rest: true,
    movement: true,
    attention: true,
    connection: false,
  });
  function toggle(d: Dimension) {
    sensing[d] = !sensing[d];
  }
</script>

<div class="scene">
  <span class="eyebrow">Connect the Witness</span>
  <p>The Witness notices how you live — it never scores or judges you. Choose what it may sense. You can change this anytime.</p>
  <div class="stack">
    {#each DIMENSIONS as d (d)}
      <button class="toggle" onclick={() => toggle(d)}>
        <span>
          <strong>{DIMENSION_META[d].label}</strong>
          <span class="faint" style="display:block;font-size:13px">{blurb[d]}</span>
        </span>
        <span class="switch" class:on={sensing[d]}></span>
      </button>
    {/each}
  </div>
  <p class="faint">Your record is yours — export or delete it anytime in <a href={"#"} onclick={(e) => { e.preventDefault(); ember.go("F2"); }}>the Ledger</a>.</p>
  <div class="spacer"></div>
  <button class="btn btn-primary btn-block" onclick={() => ember.connectWitness(sensing)}>Connect & continue</button>
</div>
