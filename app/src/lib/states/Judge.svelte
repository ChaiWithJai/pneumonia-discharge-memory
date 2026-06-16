<script lang="ts">
  import { conf } from "../store.svelte";
  import WhatIfFrame from "../WhatIfFrame.svelte";

  let r = $derived(conf.present?.runtime);
  let seed = $derived(conf.present?.hero_seed ?? 7);

  const CLAIM: Record<string, string> = {
    analyze: "How the runtime scored the risk and validated it",
    simulate: "The discharge alternatives the runtime modeled",
    output: "The final disposition and human handoff",
  };
</script>

{#if r}
  <section class="stage">
    <p class="label eyebrow rise rise-1">Judge · the room's verdict</p>
    <h1 class="hero rise rise-1">Did the runtime get each step <span class="em">right</span>?</h1>
    <p class="lead rise rise-2">
      For each step, set the room's call — does it look sound, or should it be flagged for review? Add one line of why.
      Two choices, no scores to tally. Disagreement in the room is the signal we keep.
    </p>

    <div class="grid2" style="margin-top:26px">
      <div class="votes rise rise-2">
        {#each conf.judgments as j, i (j.step)}
          <div class="vote card pad" class:set={j.verdict !== null}>
            <div class="vtop">
              <span class="vstep mono">{j.step}</span>
              <div class="vclaim">{CLAIM[j.step]}</div>
            </div>

            <div class="lever" role="group" aria-label="verdict for {j.step}">
              <button class="opt sound" class:active={j.verdict === "pass"} onclick={() => (conf.judgments[i].verdict = "pass")}>
                <span class="ico">✓</span> Looks sound
              </button>
              <button class="opt flag" class:active={j.verdict === "fail"} onclick={() => (conf.judgments[i].verdict = "fail")}>
                <span class="ico">▲</span> Flag for review
              </button>
            </div>

            <input class="note" placeholder="why — one line (optional)" bind:value={j.note} />
          </div>
        {/each}
      </div>

      <div class="anchor rise rise-3">
        <span class="label">The patient stays in the room</span>
        {#if r.scenarios.length}
          <WhatIfFrame scenario={r.scenarios[0]} seed={seed} />
        {/if}
      </div>
    </div>

    <div class="cta rise rise-4">
      <button class="primary" onclick={() => conf.lockVote()} disabled={conf.busy || !conf.allVoted()}>
        {conf.busy ? "Reconciling…" : "Lock the room's verdict →"}
      </button>
      {#if !conf.allVoted()}<span class="muted">set a verdict on all three steps to continue</span>{/if}
    </div>
  </section>
{/if}

<style>
  .votes { display: flex; flex-direction: column; gap: 12px; }
  .vote { transition: border-color 0.3s ease; }
  .vote.set { border-color: var(--line-2); }
  .vtop { display: flex; flex-direction: column; gap: 3px; margin-bottom: 13px; }
  .vstep { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent); }
  .vclaim { font-size: 14px; }
  .lever { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 11px; }
  .opt {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 13px 12px; border-radius: 11px; font-size: 13.5px; font-weight: 500;
    border: 1px solid var(--line); background: var(--panel-2); color: var(--dim);
    transition: all 0.18s ease;
  }
  .opt .ico { font-size: 12px; }
  .opt:hover { border-color: var(--line-2); color: var(--paper); }
  .opt.sound.active { background: #16302a; border-color: #2c7a55; color: #8fe6c8; box-shadow: 0 0 0 1px #2c7a5566; }
  .opt.flag.active { background: #341a19; border-color: #8f3a37; color: #f0a6a3; box-shadow: 0 0 0 1px #8f3a3766; }
  .note { width: 100%; background: var(--ink-2); border: 1px solid var(--line); border-radius: 10px; color: var(--paper); padding: 10px 13px; font-family: var(--sans); font-size: 12.5px; }
  .note:focus { outline: none; border-color: var(--accent); }
  .anchor .label { display: block; margin-bottom: 10px; }
  .anchor :global(.frame) { max-height: 230px; }
</style>
