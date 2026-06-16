<script lang="ts">
  import { conf } from "../store.svelte";

  let f = $derived(conf.finalized);
  let overall = $derived(f?.alignment.find((a) => a.knowledge_layer === "overall"));
</script>

{#if f}
  <section class="stage">
    <p class="label eyebrow rise rise-1">Compound · the payoff</p>
    <h1 class="hero rise rise-1">Their judgment is now <span class="em">permanent</span>.</h1>

    <div class="stats rise rise-2">
      <div class="stat card pad"><div class="v">{f.counts.lessons}</div><div class="label">lessons in memory</div></div>
      <div class="stat card pad"><div class="v">{f.counts.eval_cases}</div><div class="label">binary eval cases</div></div>
      <div class="stat card pad"><div class="v">{f.counts.preference_pairs}</div><div class="label">RLHF preference pairs</div></div>
      <div class="stat card pad accent"><div class="v">+{conf.memory?.cumulative_steps_saved ?? 0}</div><div class="label">engineering steps saved</div></div>
    </div>

    <div class="grid2" style="margin-top:22px">
      <div class="card pad rise rise-3">
        <div class="sec-title">The teaching case</div>
        <p class="sec-lead">{f.case_study.vignette}</p>
        <p class="verdict">{f.case_study.verdict_summary}</p>
        {#if f.case_study.lesson}
          <div class="lesson"><span class="label">Lesson · {f.case_study.lesson.knowledge_layer.replace(/_/g, " ")}</span>{f.case_study.lesson.text}</div>
        {/if}
      </div>

      <div class="card pad rise rise-3">
        <div class="sec-title">What the data team gets</div>
        {#if overall}
          <div class="align">
            <div class="ar"><span>tool vs room — TPR</span><b>{overall.tpr.toFixed(2)}</b></div>
            <div class="ar"><span>tool vs room — TNR</span><b>{overall.tnr.toFixed(2)}</b></div>
            <div class="ar"><span>room vs outcome</span><b>{overall.room_vs_outcome_agreement.toFixed(2)}</b></div>
            <div class="ar"><span>tool vs outcome</span><b>{overall.tool_vs_outcome_agreement.toFixed(2)}</b></div>
          </div>
        {/if}
        {#if f.taxonomy.length}
          <span class="label" style="display:block;margin:16px 0 8px">failure taxonomy (this case)</span>
          <div class="tax">
            {#each f.taxonomy as t}
              <span class="tchip">{t.category.replace(/_/g, " ")} · {t.count}</span>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <div class="cta rise rise-4">
      {#if conf.hasNextCase()}
        <button class="primary" onclick={() => conf.nextCase()} disabled={conf.busy}>Next case ↺</button>
        <button class="ghost" onclick={() => conf.end()}>End session</button>
      {:else}
        <button class="primary" onclick={() => conf.end()}>See the session summary →</button>
      {/if}
    </div>
  </section>
{/if}

<style>
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-top: 26px; }
  @media (max-width: 760px) { .stats { grid-template-columns: repeat(2, 1fr); } }
  .stat .v { font-family: var(--serif); font-size: 32px; line-height: 1; }
  .stat.accent .v { color: var(--gold); }
  .stat .label { margin-top: 8px; }
  .verdict { font-size: 12.5px; color: var(--dim); line-height: 1.5; }
  .lesson { margin-top: 14px; font-size: 13px; color: var(--paper); border-left: 2px solid var(--accent); padding-left: 12px; line-height: 1.5; }
  .lesson .label { display: block; margin-bottom: 5px; }
  .align { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
  .ar { display: flex; justify-content: space-between; align-items: baseline; font-size: 12.5px; color: var(--dim); border-bottom: 1px dashed var(--line); padding-bottom: 7px; }
  .ar b { font-family: var(--serif); font-size: 17px; color: var(--paper); }
  .tax { display: flex; flex-wrap: wrap; gap: 6px; }
  .tchip { font-family: var(--mono); font-size: 10.5px; padding: 5px 9px; border-radius: 7px; border: 1px solid var(--line); color: var(--gold); }
</style>
