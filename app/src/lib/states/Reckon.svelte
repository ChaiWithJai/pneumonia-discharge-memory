<script lang="ts">
  import { conf } from "../store.svelte";
  import WhatIfFrame from "../WhatIfFrame.svelte";

  let r = $derived(conf.present?.runtime);
  let o = $derived(conf.outcome);
  let seed = $derived(conf.present?.hero_seed ?? 7);

  let truth = $derived(!!o?.readmitted_30d);
  let roomFlagged = $derived(conf.judgments.some((j) => j.verdict === "fail"));
  let toolFlagged = $derived(r?.handoff.disposition === "clinician_review_required");

  let outcomeText = $derived(
    truth
      ? `was readmitted${o?.days_to_readmit ? ` on day ${o.days_to_readmit}` : ""}`
      : "was not readmitted",
  );
  let headline = $derived(truth ? `Readmitted · day ${o?.days_to_readmit ?? "?"}` : "Not readmitted");

  function verdict(flagged: boolean) {
    return flagged === truth ? "right" : "off";
  }
  function sentence(who: string, flagged: boolean) {
    const stance = flagged ? "flagged this discharge as risky" : "trusted this discharge";
    const tail = flagged === truth ? "That call matched reality." : "That call missed reality — a lesson worth keeping.";
    return `${who} ${stance}, and the patient ${outcomeText}. ${tail}`;
  }

  let callback = $derived(
    r ? [...r.scenarios].sort((a, b) => b.readmission_risk_delta - a.readmission_risk_delta)[truth ? 0 : r.scenarios.length - 1] : null,
  );
</script>

{#if r && o}
  <section class="stage">
    <p class="label eyebrow rise rise-1">Reckon · the data lake</p>
    <h1 class="hero rise rise-1">What actually happened.</h1>
    <p class="lead rise rise-2">
      The mock data lake reveals the real 30-day outcome. Where a call matched reality, you've found a signal to
      trust; where it diverged, you've found a lesson. This is how the care team and the data team meet.
    </p>

    <div class="reveal card pad rise rise-2" class:bad={truth}>
      <div class="big">{headline}</div>
      <div class="sub mono">length of stay {o.length_of_stay_days}d · follow-up {o.followup_kept ? "kept" : "missed"} · source: mock data lake</div>
    </div>

    <div class="grid2" style="margin-top:22px">
      <div class="meters rise rise-3">
        <div class="m card pad">
          <div class="mhead"><span class="label">The room's call</span><span class="tag tag-{verdict(roomFlagged)}">{verdict(roomFlagged) === "right" ? "matched reality" : "off"}</span></div>
          <p class="mnote">{sentence("The room", roomFlagged)}</p>
        </div>
        <div class="m card pad">
          <div class="mhead"><span class="label">The runtime's call</span><span class="tag tag-{verdict(toolFlagged)}">{verdict(toolFlagged) === "right" ? "matched reality" : "off"}</span></div>
          <p class="mnote">{sentence("The runtime", toolFlagged)}</p>
        </div>
      </div>
      <div class="rise rise-3">
        <span class="label" style="display:block;margin-bottom:10px">The path the data confirms</span>
        {#if callback}<WhatIfFrame scenario={callback} seed={seed} />{/if}
      </div>
    </div>

    <div class="cta rise rise-4">
      <button class="primary" onclick={() => conf.toDecide()}>Decide what to keep →</button>
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
  .mhead { display: flex; justify-content: space-between; align-items: center; margin-bottom: 9px; }
  .tag { font-family: var(--mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; padding: 4px 9px; border-radius: 7px; }
  .tag-right { background: #16302a; color: var(--low); }
  .tag-off { background: #33290f; color: var(--moderate); }
  .mnote { font-size: 13px; color: var(--paper); line-height: 1.55; margin: 0; }
</style>
