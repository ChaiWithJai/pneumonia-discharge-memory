<script lang="ts">
  import { ember } from "../lib/store.svelte";
  import { SEASON_META } from "../lib/engine/blueprint";

  const save = $derived(ember.save!);
  const dex = $derived([...save.dex].reverse().slice(0, 40));
</script>

<div class="scene">
  <span class="eyebrow">Seasons — your life, recorded</span>
  <p>Every day you lived is here, and it's yours. Ever since you began, {save.dex.length} days have been tended.</p>
  <div class="row"><span class="chip">{SEASON_META[save.country.season].label}</span><span class="chip">day {save.country.dayCount}</span></div>

  <div class="stack">
    {#each dex as e (e.day + e.source)}
      <div class="card">
        <div class="row" style="justify-content:space-between">
          <strong>{e.day}</strong>
          <span class="faint">{e.source}</span>
        </div>
        <div class="row wrap" style="margin-top:6px">
          {#each Object.entries(e.values) as [k, v] (k)}
            <span class="chip">{k} · {Math.round((v as number) * 100)}</span>
          {/each}
        </div>
      </div>
    {/each}
    {#if !dex.length}<p class="faint">Nothing recorded yet. Tend, and the seasons begin.</p>{/if}
  </div>

  <div class="spacer"></div>
  <button class="btn btn-block" onclick={() => ember.go("F2")}>Export my record</button>
</div>
