<script lang="ts">
  import { conf } from "../store.svelte";
  import ScoreBar from "../ScoreBar.svelte";

  let r = $derived(conf.present?.runtime);
  let fr = $derived(r?.factory_report);
  let review = $derived(r?.handoff.disposition === "clinician_review_required");
</script>

{#if r}
  <section class="stage">
    <p class="label eyebrow rise rise-1">Present · {r.patient_id} · run #{r.run_index}</p>
    <h1 class="hero rise rise-1">What the runtime decided.</h1>
    <p class="lead rise rise-2">{conf.present?.vignette}</p>

    <div class="grid2" style="margin-top:28px">
      <div class="card pad rise rise-2">
        <div class="facto">
          {#if fr && fr.tools_generated.length}
            <span class="pill gen">generated {fr.tools_generated.length} instruments</span>
          {/if}
          {#if fr && fr.tools_reused.length}
            <span class="pill reuse">reused {fr.tools_reused.length} · {fr.engineering_steps_saved} steps saved</span>
          {/if}
          <span class="pill">recursive loop · {r.analyze_iterations} iterations</span>
        </div>
        {#each r.scores as s}
          <ScoreBar score={s} />
        {/each}
      </div>

      <div class="card pad handoff rise rise-3">
        {#if r.handoff.required_human_review}
          <span class="stamp">requires human review</span>
        {/if}
        <span class="disp" class:review class:supports={!review}>{r.handoff.disposition.replace(/_/g, " ")}</span>
        <p class="summary">{r.handoff.summary}</p>
        {#each r.handoff.red_flags as f}
          <div class="flag">{f}</div>
        {/each}
        <div class="note">{r.handoff.clinician_note}</div>
      </div>
    </div>

    <div class="cta rise rise-4">
      <button class="primary" onclick={() => conf.toFeel()}>See the what-ifs →</button>
    </div>
  </section>
{/if}

<style>
  .facto { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
  .pill { font-family: var(--mono); font-size: 10.5px; padding: 6px 10px; border-radius: 8px; border: 1px solid var(--line); color: var(--dim); }
  .pill.gen { color: var(--teal); border-color: #1f5f59; }
  .pill.reuse { color: var(--gold); border-color: #3a3014; }
  .handoff { position: relative; }
  .stamp {
    position: absolute; top: 16px; right: 16px;
    font-family: var(--mono); font-size: 9.5px; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--gold); border: 1px solid #3a3014; border-radius: 7px; padding: 5px 9px;
  }
  .disp {
    display: inline-block; font-weight: 600; font-size: 14px; padding: 8px 14px; border-radius: 10px; text-transform: capitalize;
  }
  .disp.review { background: #341a19; color: #f0a6a3; }
  .disp.supports { background: #16302a; color: #8fe6c8; }
  .summary { font-size: 13.5px; line-height: 1.55; color: var(--paper); margin: 14px 0; }
  .flag { font-size: 12.5px; color: #f0b3b0; padding: 4px 0 4px 18px; position: relative; }
  .flag::before { content: "▲"; position: absolute; left: 0; font-size: 9px; top: 5px; }
  .note { margin-top: 14px; font-size: 11.5px; font-style: italic; color: var(--faint); border-left: 2px solid var(--line-2); padding-left: 11px; line-height: 1.5; }
</style>
