<script lang="ts">
  import { conf } from "../store.svelte";
  import WhatIfFrame from "../WhatIfFrame.svelte";

  let r = $derived(conf.present?.runtime);
  let seed = $derived(conf.present?.hero_seed ?? 7);

  const CLAIM: Record<string, string> = {
    analyze: "The risk scoring & recursive validation",
    simulate: "The discharge alternatives modeled",
    output: "The final disposition & human handoff",
  };

  function consensus(p: number, f: number) {
    return p >= f ? "pass" : "fail";
  }
  function contested(p: number, f: number) {
    const t = p + f;
    return t > 0 && Math.min(p, f) / t >= 0.34;
  }
  function bump(i: number, field: "pass_votes" | "fail_votes", d: number) {
    conf.judgments[i][field] = Math.max(0, conf.judgments[i][field] + d);
  }
</script>

{#if r}
  <section class="stage">
    <p class="label eyebrow rise rise-1">Judge · the room votes</p>
    <h1 class="hero rise rise-1">Was the runtime <span class="em">right</span>?</h1>
    <p class="lead rise rise-2">
      Binary only — pass or fail, plus one line of why. Tally the room for each of the three clinically-weighted steps.
      Disagreement is signal, not noise.
    </p>

    <div class="grid2" style="margin-top:26px">
      <div class="votes rise rise-2">
        {#each conf.judgments as j, i (j.step)}
          {@const c = consensus(j.pass_votes, j.fail_votes)}
          <div class="vote card pad">
            <div class="vtop">
              <div>
                <span class="vstep mono">{j.step}</span>
                <div class="vclaim">{CLAIM[j.step]}</div>
              </div>
              <span class="cons cons-{c}">
                {c}{#if contested(j.pass_votes, j.fail_votes)} · contested{/if}
              </span>
            </div>
            <div class="tallies">
              <div class="tally pass">
                <span class="tlabel">pass</span>
                <button class="step-btn" onclick={() => bump(i, "pass_votes", -1)}>−</button>
                <span class="count">{j.pass_votes}</span>
                <button class="step-btn" onclick={() => bump(i, "pass_votes", 1)}>+</button>
              </div>
              <div class="tally fail">
                <span class="tlabel">fail</span>
                <button class="step-btn" onclick={() => bump(i, "fail_votes", -1)}>−</button>
                <span class="count">{j.fail_votes}</span>
                <button class="step-btn" onclick={() => bump(i, "fail_votes", 1)}>+</button>
              </div>
            </div>
            <input class="note" placeholder="one line why…" bind:value={j.note} />
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
      <button class="primary" onclick={() => conf.lockVote()} disabled={conf.busy}>
        {conf.busy ? "Reconciling…" : "Lock consensus →"}
      </button>
    </div>
  </section>
{/if}

<style>
  .votes { display: flex; flex-direction: column; gap: 12px; }
  .vtop { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
  .vstep { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent); }
  .vclaim { font-size: 13.5px; margin-top: 3px; }
  .cons { font-family: var(--mono); font-size: 10.5px; padding: 4px 9px; border-radius: 7px; text-transform: uppercase; letter-spacing: 0.06em; }
  .cons-pass { background: #16302a; color: var(--low); }
  .cons-fail { background: #341a19; color: var(--high); }
  .tallies { display: flex; gap: 10px; margin: 13px 0 11px; }
  .tally { flex: 1; display: flex; align-items: center; gap: 9px; padding: 8px 11px; border-radius: 10px; border: 1px solid var(--line); background: var(--panel-2); }
  .tlabel { font-family: var(--mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; }
  .tally.pass .tlabel { color: var(--low); }
  .tally.fail .tlabel { color: var(--high); }
  .count { font-family: var(--serif); font-size: 19px; min-width: 22px; text-align: center; }
  .step-btn { width: 24px; height: 24px; border-radius: 7px; background: #ffffff0c; color: var(--paper); font-size: 15px; line-height: 1; }
  .step-btn:hover { background: var(--accent-soft); }
  .note { width: 100%; background: var(--ink-2); border: 1px solid var(--line); border-radius: 9px; color: var(--paper); padding: 9px 12px; font-family: var(--sans); font-size: 12.5px; }
  .note:focus { outline: none; border-color: var(--accent); }
  .anchor .label { display: block; margin-bottom: 10px; }
  .anchor :global(.frame) { max-height: 220px; }
</style>
