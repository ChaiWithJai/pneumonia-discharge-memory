<script lang="ts">
  import { api } from "../api";
  import { conf } from "../store.svelte";

  const LAYERS = [
    { v: "organizational", l: "Organizational" },
    { v: "domain", l: "Domain · pneumonia" },
    { v: "service_line", l: "Service-line · pulmonary" },
    { v: "patient", l: "Patient-specific" },
  ];

  const EXAMPLES = [
    "IF lives alone AND high medication-access risk → confirm pharmacy delivery before discharge",
    "IF cultures are pending AND the infection signal is borderline → reconfirm stability before handoff",
    "IF mobility has dropped to moderate or worse → route a home-support plan through care management",
  ];

  let suggesting = $state(false);
  let suggestionSource = $state("");

  async function suggest() {
    suggesting = true;
    suggestionSource = "";
    const res = await api.suggestRule(conf.caseFile, conf.failedSteps());
    if (res) {
      conf.lessonText = res.text;
      suggestionSource = res.source;
    }
    suggesting = false;
  }
</script>

<section class="stage">
  <p class="label eyebrow rise rise-1">Decide &amp; compound</p>
  <h1 class="hero rise rise-1">One rule the room will <span class="em">keep</span>.</h1>
  <p class="lead rise rise-2">
    Capture a single, reusable rule the next clinician could apply. It persists as institutional memory, tagged to a
    layer of the knowledge chain, and becomes part of every future case's context.
  </p>

  <div class="form card pad rise rise-3">
    <div class="guide">
      <span class="label">What makes a good rule</span>
      <ul>
        <li><b>Conditional</b> — write it as <span class="mono">IF &lt;situation&gt; → THEN &lt;action&gt;</span>.</li>
        <li><b>Specific</b> — name the trigger (a risk, a gap) and the concrete next step.</li>
        <li><b>Reusable</b> — true for the next patient like this one, not just this chart.</li>
      </ul>
    </div>

    <label class="label" for="rule" style="margin-top:6px;display:block">Reusable rule</label>
    <textarea
      id="rule"
      class="rule"
      rows="2"
      placeholder="IF lives alone AND high access-risk → require confirmed pharmacy follow-up before discharge"
      bind:value={conf.lessonText}
    ></textarea>

    <div class="aids">
      <button class="ghost sm" onclick={suggest} disabled={suggesting}>
        {suggesting ? "thinking…" : "✶ Suggest a rule"}
      </button>
      {#if suggestionSource}
        <span class="muted">suggested by {suggestionSource === "bonsai" ? "Bonsai (local)" : "template"} — edit freely</span>
      {/if}
    </div>

    <span class="label" style="margin-top:6px;display:block">Or start from an example</span>
    <div class="examples">
      {#each EXAMPLES as ex}
        <button class="chip" onclick={() => (conf.lessonText = ex)}>{ex}</button>
      {/each}
    </div>

    <span class="label" style="margin-top:18px;display:block">Tag to knowledge layer</span>
    <div class="layers">
      {#each LAYERS as L}
        <button class="layer" class:on={conf.layer === L.v} onclick={() => (conf.layer = L.v)}>{L.l}</button>
      {/each}
    </div>
  </div>

  <div class="cta rise rise-4">
    <button class="primary" onclick={() => conf.compound()} disabled={conf.busy}>
      {conf.busy ? "Compounding…" : "Compound & export →"}
    </button>
    {#if !conf.lessonText.trim()}<span class="muted">a rule is optional — but it's the durable artifact this session leaves behind</span>{/if}
  </div>
  {#if conf.error}<p class="err">{conf.error}</p>{/if}
</section>

<style>
  .form { max-width: 720px; }
  .guide { margin-bottom: 16px; padding: 14px 16px; border: 1px solid var(--line); border-radius: 11px; background: var(--panel-2); }
  .guide ul { margin: 9px 0 0; padding-left: 18px; }
  .guide li { font-size: 12.5px; color: var(--dim); line-height: 1.7; }
  .guide b { color: var(--paper); font-weight: 600; }
  .rule { width: 100%; margin-top: 8px; background: var(--ink-2); border: 1px solid var(--line); border-radius: 10px; color: var(--paper); padding: 13px 15px; font-family: var(--sans); font-size: 14px; line-height: 1.5; resize: vertical; }
  .rule:focus { outline: none; border-color: var(--accent); }
  .aids { display: flex; align-items: center; gap: 12px; margin-top: 10px; }
  .ghost.sm { padding: 7px 13px; font-size: 12px; }
  .examples { display: flex; flex-direction: column; gap: 7px; margin-top: 8px; }
  .chip { text-align: left; background: transparent; border: 1px dashed var(--line-2); color: var(--dim); border-radius: 9px; padding: 9px 13px; font-size: 12px; line-height: 1.4; transition: all 0.18s ease; }
  .chip:hover { border-color: var(--accent); color: var(--paper); border-style: solid; }
  .layers { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
  .layer { background: var(--panel-2); border: 1px solid var(--line); color: var(--dim); border-radius: 9px; padding: 9px 14px; font-size: 12.5px; transition: all 0.2s ease; }
  .layer.on { border-color: var(--accent); color: var(--paper); background: var(--accent-soft); }
</style>
