<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "../api";
  import { conf } from "../store.svelte";
  import Insights from "../Insights.svelte";
  import type { Bundle } from "../types";

  let bundle = $state<Bundle | null>(null);

  onMount(async () => {
    try {
      bundle = await api.bundle();
    } catch {
      /* ignore */
    }
  });

  function download(name: string, content: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<section class="stage">
  <p class="label eyebrow rise rise-1">Session summary</p>
  <h1 class="hero rise rise-1">A standard, and a <span class="em">data product</span>.</h1>
  <p class="lead rise rise-2">
    {conf.casesDone} case{conf.casesDone === 1 ? "" : "s"} reviewed. The room's judgment is now durable institutional
    memory — and a value-add export any model can learn from.
  </p>

  {#if bundle}
    <div class="stats rise rise-2">
      <div class="stat card pad"><div class="v">{bundle.counts.case_studies}</div><div class="label">teaching cases</div></div>
      <div class="stat card pad"><div class="v">{bundle.counts.eval_cases}</div><div class="label">eval cases</div></div>
      <div class="stat card pad"><div class="v">{bundle.counts.preference_pairs}</div><div class="label">preference pairs</div></div>
      <div class="stat card pad"><div class="v">{bundle.counts.lessons}</div><div class="label">lessons</div></div>
    </div>

    <div class="card pad rise rise-3" style="margin-top:22px">
      <Insights />
    </div>

    <details class="card pad rise rise-3" style="margin-top:14px">
      <summary>Judge alignment across the knowledge chain</summary>
      <table>
        <thead><tr><th>layer</th><th>n</th><th>TPR</th><th>TNR</th><th>room·truth</th><th>tool·truth</th></tr></thead>
        <tbody>
          {#each bundle.alignment as a}
            <tr><td class="mono">{a.knowledge_layer}</td><td>{a.n}</td><td>{a.tpr.toFixed(2)}</td><td>{a.tnr.toFixed(2)}</td><td>{a.room_vs_outcome_agreement.toFixed(2)}</td><td>{a.tool_vs_outcome_agreement.toFixed(2)}</td></tr>
          {/each}
        </tbody>
      </table>
    </details>

    <div class="downloads rise rise-4">
      <span class="label">Export bundle</span>
      <div class="dl">
        <button class="ghost" onclick={() => download("evals.jsonl", bundle!.eval_suite_jsonl, "application/jsonl")}>eval suite · jsonl</button>
        <button class="ghost" onclick={() => download("preferences.jsonl", bundle!.preferences_jsonl, "application/jsonl")}>preference pairs · jsonl (DPO)</button>
        <button class="ghost" onclick={() => download("case_studies.md", bundle!.case_studies_markdown, "text/markdown")}>teaching cases · markdown</button>
      </div>
    </div>
  {/if}

  <div class="cta rise rise-4">
    <button class="primary" onclick={() => conf.restart()}>New session</button>
  </div>
</section>

<style>
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-top: 26px; }
  @media (max-width: 760px) { .stats { grid-template-columns: repeat(2, 1fr); } }
  .stat .v { font-family: var(--serif); font-size: 32px; line-height: 1; color: var(--gold); }
  .stat .label { margin-top: 8px; }
  summary { cursor: pointer; font-family: var(--serif); font-size: 15px; color: var(--dim); }
  summary:hover { color: var(--paper); }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12.5px; }
  th { text-align: left; font-family: var(--mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--faint); padding: 6px 8px; }
  td { padding: 8px 8px; border-top: 1px solid var(--line); color: var(--dim); }
  td:first-child { color: var(--paper); }
  .downloads { margin-top: 26px; }
  .dl { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
</style>
