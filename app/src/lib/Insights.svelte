<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "./api";
  import type { Insights } from "./types";

  let ins = $state<Insights | null>(null);

  onMount(async () => {
    try {
      ins = await api.insights();
    } catch {
      /* ignore */
    }
  });

  // confusion cells: tool (automated judge) vs room (human label)
  let cells = $derived(
    ins
      ? [
          { k: "tp", label: "both flagged", v: ins.confusion.tp, tone: "good" },
          { k: "fp", label: "tool over-flagged", v: ins.confusion.fp, tone: "warn" },
          { k: "fn", label: "tool missed it", v: ins.confusion.fn, tone: "bad" },
          { k: "tn", label: "both cleared", v: ins.confusion.tn, tone: "good" },
        ]
      : [],
  );
  let taxMax = $derived(ins ? Math.max(1, ...ins.taxonomy.map((t) => t.count)) : 1);
</script>

{#if ins}
  <div class="insights">
    <div class="sec-title">How to read &amp; leverage your evals</div>
    <p class="sec-lead">{ins.interpretation}</p>

    <div class="cols">
      <div class="block">
        <span class="label">Tool vs. the room (the alignment matrix)</span>
        <div class="matrix">
          {#each cells as c}
            <div class="cell tone-{c.tone}">
              <div class="cv">{c.v}</div>
              <div class="cl">{c.label}</div>
            </div>
          {/each}
        </div>
        <p class="hint">Off-diagonal cells are where the automated runtime and the human room disagree — your highest-signal cases.</p>
      </div>

      <div class="block">
        <span class="label">Failure taxonomy (open → axial coding)</span>
        <div class="bars">
          {#each ins.taxonomy as t}
            <div class="bar">
              <span class="bl">{t.category.replace(/_/g, " ")}</span>
              <span class="track"><span class="fill" style="width:{(t.count / taxMax) * 100}%"></span></span>
              <span class="bc mono">{t.count}</span>
            </div>
          {/each}
          {#if !ins.taxonomy.length}<p class="hint">No coded notes yet.</p>{/if}
        </div>
      </div>
    </div>

    <span class="label" style="display:block;margin:18px 0 10px">Recommended next steps · grounded in Hamel Husain's evals</span>
    <div class="recs">
      {#each ins.recommendations as r}
        <div class="rec sev-{r.severity}">
          <div class="rtitle">{r.title}</div>
          <p class="rdetail">{r.detail}</p>
          <span class="principle">{r.principle}</span>
        </div>
      {/each}
    </div>

    {#if ins.advisor}
      <div class="advisor">
        <span class="label">Eval advisor · Bonsai (local), grounded in the Hamel canon</span>
        <p>{ins.advisor.text}</p>
      </div>
    {:else}
      <p class="muted offline">Start the Bonsai writer for a tuned, narrated advisor read. The recommendations above are computed locally either way.</p>
    {/if}
  </div>
{/if}

<style>
  .insights { margin-top: 22px; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; margin-top: 6px; }
  @media (max-width: 760px) { .cols { grid-template-columns: 1fr; } }
  .matrix { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
  .cell { border: 1px solid var(--line); border-radius: 10px; padding: 14px; background: var(--panel-2); }
  .cell .cv { font-family: var(--serif); font-size: 26px; line-height: 1; }
  .cell .cl { font-size: 11px; color: var(--dim); margin-top: 6px; }
  .tone-good { border-color: #1f5f59; }
  .tone-warn { border-color: #3a3014; }
  .tone-bad { border-color: #5a2a28; }
  .tone-good .cv { color: var(--teal); }
  .tone-warn .cv { color: var(--moderate); }
  .tone-bad .cv { color: var(--high); }
  .hint { font-size: 11px; color: var(--faint); line-height: 1.5; margin: 9px 0 0; }
  .bars { margin-top: 10px; display: flex; flex-direction: column; gap: 9px; }
  .bar { display: grid; grid-template-columns: 130px 1fr 26px; align-items: center; gap: 10px; }
  .bl { font-size: 12px; color: var(--dim); text-transform: capitalize; }
  .track { height: 8px; border-radius: 5px; background: #161f2a; overflow: hidden; }
  .fill { display: block; height: 100%; background: linear-gradient(90deg, #8a6c2e, var(--gold)); border-radius: 5px; }
  .bc { font-size: 12px; color: var(--paper); text-align: right; }
  .recs { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  @media (max-width: 760px) { .recs { grid-template-columns: 1fr; } }
  .rec { border: 1px solid var(--line); border-left-width: 3px; border-radius: 10px; padding: 13px 15px; background: var(--panel-2); }
  .sev-action { border-left-color: var(--teal); }
  .sev-warn { border-left-color: var(--moderate); }
  .sev-info { border-left-color: var(--faint); }
  .rtitle { font-size: 13.5px; font-weight: 600; }
  .rdetail { font-size: 12px; color: var(--dim); line-height: 1.5; margin: 6px 0 9px; }
  .principle { font-family: var(--mono); font-size: 9.5px; letter-spacing: 0.04em; text-transform: uppercase; color: var(--accent); border: 1px solid var(--line); border-radius: 6px; padding: 3px 7px; }
  .advisor { margin-top: 18px; border-left: 2px solid var(--accent); padding: 4px 0 4px 14px; }
  .advisor p { font-size: 13px; line-height: 1.6; color: var(--paper); margin: 8px 0 0; white-space: pre-wrap; }
  .offline { margin-top: 16px; }
</style>
