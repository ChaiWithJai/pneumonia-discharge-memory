<script lang="ts">
  import { conf } from "../store.svelte";
  import WhatIfFrame from "../WhatIfFrame.svelte";

  let r = $derived(conf.present?.runtime);
  let o = $derived(conf.outcome);
  let seed = $derived(conf.present?.hero_seed ?? 7);

  let truth = $derived(!!o?.readmitted_30d);
  let roomPos = $derived(conf.judgments.some((j) => (j.pass_votes >= j.fail_votes ? false : true)));
  let toolPos = $derived(r?.handoff.disposition === "clinician_review_required");

  // the path the outcome confirms: the riskiest scenario if readmitted, else the safest
  let callback = $derived(
    r ? [...r.scenarios].sort((a, b) => b.readmission_risk_delta - a.readmission_risk_delta)[truth ? 0 : r.scenarios.length - 1] : null,
  );
</script>

{#if r && o}
  <section class="stage">
    <p class="label eyebrow rise rise-1">Reckon · the data lake</p>
    <h1 class="hero rise rise-1">What actually happened.</h1>

    <div class="reveal card pad rise rise-2" class:bad={truth}>
      <div class="big">{truth ? "Readmitted" : "Not readmitted"}{#if truth && o.days_to_readmit} · day {o.days_to_readmit}{/if}</div>
      <div class="sub mono">LOS {o.length_of_stay_days}d · follow-up {o.followup_kept ? "kept" : "missed"} · source: mock data lake</div>
    </div>

    <div class="grid2" style="margin-top:22px">
      <div class="meters rise rise-3">
        <div class="m card pad">
          <span class="label">The room vs. reality</span>
          <div class="verdict {roomPos === truth ? 'hit' : 'miss'}">{roomPos === truth ? "foresaw it" : "missed it"}</div>
          <p class="mnote">The room {roomPos ? "distrusted" : "trusted"} the discharge; the patient was {truth ? "readmitted" : "not readmitted"}.</p>
        </div>
        <div class="m card pad">
          <span class="label">The tool vs. reality</span>
          <div class="verdict {toolPos === truth ? 'hit' : 'miss'}">{toolPos === truth ? "foresaw it" : "missed it"}</div>
          <p class="mnote">The runtime {toolPos ? "flagged review" : "saw no high risk"}; the patient was {truth ? "readmitted" : "not readmitted"}.</p>
        </div>
      </div>
      <div class="rise rise-3">
        <span class="label" style="display:block;margin-bottom:10px">The path the data confirms</span>
        {#if callback}<WhatIfFrame scenario={callback} seed={seed} />{/if}
      </div>
    </div>

    <div class="cta rise rise-4">
      <button class="primary" onclick={() => conf.toDecide()}>Decide →</button>
    </div>
  </section>
{/if}

<style>
  .reveal { text-align: center; border-color: var(--line-2); }
  .reveal.bad { border-color: #5a2a28; background: linear-gradient(180deg, #1a1110, #120c0c); }
  .big { font-family: var(--serif); font-size: 30px; }
  .reveal.bad .big { color: #f0a6a3; }
  .sub { margin-top: 8px; color: var(--dim); font-size: 11.5px; }
  .meters { display: flex; flex-direction: column; gap: 14px; }
  .verdict { font-family: var(--serif); font-size: 22px; margin: 8px 0 6px; }
  .verdict.hit { color: var(--low); }
  .verdict.miss { color: var(--moderate); }
  .mnote { font-size: 12px; color: var(--dim); line-height: 1.5; margin: 0; }
</style>
