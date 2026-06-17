<script lang="ts">
  // The Ledger — privacy, sensing, data ownership. "Your record is yours."
  import { ember } from "../lib/store.svelte";
  import { DIMENSIONS } from "../lib/types";
  import { DIMENSION_META } from "../lib/engine/blueprint";

  const save = $derived(ember.save!);
  let confirmWipe = $state(false);

  function exportRecord() {
    const blob = new Blob([ember.exportJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ember-record.json";
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<div class="scene">
  <span class="eyebrow">The Ledger</span>
  <p>Your record is yours. Control what the Witness senses, and take it with you — or erase it — anytime.</p>

  <div class="stack">
    {#each DIMENSIONS as d (d)}
      <button class="toggle" onclick={() => ember.setSensing(d, !save.settings.sensing[d])}>
        <span>{DIMENSION_META[d].label}</span>
        <span class="switch" class:on={save.settings.sensing[d]}></span>
      </button>
    {/each}
  </div>

  <button class="btn btn-block" onclick={exportRecord}>Export my record (JSON)</button>

  {#if confirmWipe}
    <div class="card" style="border-color:var(--ember-soft)">
      <p>This erases your ember, your country, and your whole record. It cannot be undone.</p>
      <div class="row" style="margin-top:10px">
        <button class="btn btn-block" onclick={() => (confirmWipe = false)}>Keep it</button>
        <button class="btn btn-block btn-primary" onclick={() => ember.wipe()}>Erase everything</button>
      </div>
    </div>
  {:else}
    <button class="btn btn-ghost btn-block" onclick={() => (confirmWipe = true)}>Delete my record</button>
  {/if}

  <div class="spacer"></div>
  <button class="btn btn-block" onclick={() => ember.go("F4")}>Back</button>
</div>
