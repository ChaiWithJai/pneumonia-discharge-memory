<script lang="ts">
  import { conf } from "../store.svelte";
  let warm = $derived((conf.memory?.tools_in_memory ?? 0) > 0);
</script>

<section class="stage">
  <p class="label eyebrow rise rise-1">Convene &amp; recall</p>
  <h1 class="hero rise rise-1">
    {#if warm}This room has been here before.{:else}A fresh service line.{/if}
  </h1>
  <p class="lead rise rise-2">
    {#if warm}
      The toolset is warm — {conf.memory?.tools_in_memory} validated instruments already in institutional memory, reused
      across {conf.memory?.runs_completed} runs, {conf.memory?.cumulative_steps_saved} engineering steps saved. Nothing
      the room decided last time was lost.
    {:else}
      The Factory will generate this service line's instruments on the first case, then reuse them on every case after —
      so the next decision is always cheaper than the last.
    {/if}
  </p>

  {#if conf.memory && conf.memory.timeline.length}
    <div class="timeline rise rise-3">
      {#each conf.memory.timeline.slice(-16) as e}
        <span class="tk tk-{e.type === 'tool_generated' ? 'gen' : e.type === 'tool_reused' ? 'reuse' : 'case'}">
          {e.type === "case_completed" ? `run #${e.run_index}` : (e.type === "tool_generated" ? "gen " : "reuse ") + (e.name ?? "").replace(/_/g, " ")}
        </span>
      {/each}
    </div>
  {/if}

  <div class="cta rise rise-4">
    <button class="primary" onclick={() => conf.presentCase()} disabled={conf.busy}>
      {conf.busy ? "Loading the case…" : "Present the case →"}
    </button>
  </div>
  {#if conf.error}<p class="err">{conf.error}</p>{/if}
</section>

<style>
  .timeline { margin-top: 30px; display: flex; flex-wrap: wrap; gap: 5px; max-width: 760px; }
  .tk { font-family: var(--mono); font-size: 10px; padding: 4px 8px; border-radius: 6px; border: 1px solid var(--line); color: var(--faint); }
  .tk-gen { color: var(--teal); border-color: #1f5f59; }
  .tk-reuse { color: var(--gold); border-color: #3a3014; }
  .tk-case { color: var(--dim); }
</style>
