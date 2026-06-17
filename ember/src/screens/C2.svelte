<script lang="ts">
  import { ember } from "../lib/store.svelte";
  import { wokenSpec } from "../lib/engine/blueprint";

  const w = $derived(ember.selectedWoken ? wokenSpec(ember.selectedWoken) : null);
  const st = $derived(ember.selectedWoken ? ember.save!.woken[ember.selectedWoken] : null);
</script>

<div class="scene">
  {#if w}
    <span class="eyebrow">A companion</span>
    <h1>{w.name}</h1>
    <div class="card"><span class="eyebrow">Wakes by</span><p style="margin-top:6px">{w.wakes}</p></div>
    <div class="card"><span class="eyebrow">Its gift</span><p style="margin-top:6px">{w.gift}</p></div>
    <div class="card"><span class="eyebrow">When it dims</span><p style="margin-top:6px">{w.shadow}</p></div>
    {#if st?.awake && st.wakedAt}
      <p class="faint">Woken {new Date(st.wakedAt).toLocaleDateString()} — ever since, it's stood with you.</p>
    {/if}
  {:else}
    <p>No companion selected.</p>
  {/if}
  <div class="spacer"></div>
  <button class="btn btn-block" onclick={() => ember.go("C1")}>Back to the Circle</button>
</div>
