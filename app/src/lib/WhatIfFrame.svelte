<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "./api";
  import type { Scenario } from "./types";

  let {
    scenario,
    seed,
    narratable = false,
  }: { scenario: Scenario; seed: number; narratable?: boolean } = $props();

  let canvas: HTMLCanvasElement;
  let imgUrl = $state<string | null>(null);
  let source = $state("painting…");
  let narration = $state("");
  let narrating = $state(false);

  let risk = $derived(scenario.readmission_risk_delta > 0);
  const fmt = (v: number) => (v > 0 ? "+" : "") + v.toFixed(2);
  const pretty = (s: string) => s.replace(/_/g, " ");

  function paint() {
    const x = canvas.getContext("2d");
    if (!x) return;
    const W = canvas.width, H = canvas.height;
    const g = x.createLinearGradient(0, 0, 0, H);
    if (risk) { g.addColorStop(0, "#3a2417"); g.addColorStop(1, "#150f0a"); }
    else { g.addColorStop(0, "#15302a"); g.addColorStop(1, "#0b1714"); }
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    const r = x.createRadialGradient(W * 0.72, H * 0.3, 18, W * 0.72, H * 0.3, 260);
    r.addColorStop(0, risk ? "#e3b25f3a" : "#4ec8ba3a"); r.addColorStop(1, "transparent");
    x.fillStyle = r; x.fillRect(0, 0, W, H);
    x.strokeStyle = "#ffffff18"; x.beginPath(); x.moveTo(0, H * 0.74); x.lineTo(W, H * 0.74); x.stroke();
    x.fillStyle = "#ffffff14"; x.fillRect(W * 0.41, H * 0.54, W * 0.18, H * 0.2);
    x.beginPath(); x.moveTo(W * 0.39, H * 0.54); x.lineTo(W * 0.5, H * 0.45); x.lineTo(W * 0.61, H * 0.54); x.closePath(); x.fill();
    x.fillStyle = "#ffffff0e";
    for (let i = 0; i < 55; i++) { x.beginPath(); x.arc(Math.random() * W, Math.random() * H * 0.6, Math.random() * 1.3, 0, 7); x.fill(); }
  }

  async function narrate() {
    narrating = true;
    const prompt = `Discharge scenario: ${scenario.assumption} Operational trigger: ${scenario.operational_trigger}. Write 2-3 dignified sentences about the patient's first day at home under this plan.`;
    const res = await api.narrate(prompt);
    narration = res?.text ?? scenario.assumption;
    narrating = false;
  }

  onMount(async () => {
    paint();
    const url = await api.illustrate(scenario.empathy_prompt, seed);
    if (url) { imgUrl = url; source = "Bonsai Image 4B · on-device"; }
    else { source = "clinical canvas · studio offline"; }
  });
</script>

<figure class="plate">
  <div class="frame">
    <canvas bind:this={canvas} width="640" height="360"></canvas>
    {#if imgUrl}
      <img src={imgUrl} alt={scenario.name} class="rendered" />
    {/if}
    <span class="delta" style="color:{risk ? 'var(--high)' : 'var(--low)'}">Δ readmit {fmt(scenario.readmission_risk_delta)}</span>
    <span class="src">{source}</span>
  </div>
  <figcaption>
    <div class="title">{pretty(scenario.name)}</div>
    <p class="assume">{scenario.assumption}</p>
    {#if narratable}
      {#if narration}
        <p class="narr">{narration}</p>
      {:else}
        <button class="ghost sm" onclick={narrate} disabled={narrating}>
          {narrating ? "narrating…" : "Narrate the patient's day"}
        </button>
      {/if}
    {/if}
  </figcaption>
</figure>

<style>
  .plate { margin: 0; }
  .frame {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid var(--line-2);
    background: #0a0f15;
    box-shadow: inset 0 0 0 1px #ffffff08, var(--shadow);
  }
  canvas, .rendered { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
  .rendered { opacity: 0; animation: fade 0.7s ease forwards; }
  @keyframes fade { to { opacity: 1; } }
  .delta, .src {
    position: absolute;
    font-family: var(--mono);
    font-size: 10px;
    padding: 4px 9px;
    border-radius: 7px;
    background: #000a;
    backdrop-filter: blur(3px);
  }
  .delta { right: 9px; top: 9px; font-weight: 600; }
  .src { left: 9px; bottom: 9px; color: var(--dim); }
  figcaption { padding: 11px 3px 0; }
  .title { font-family: var(--serif); font-size: 14.5px; }
  .assume { margin: 4px 0 0; font-size: 12px; line-height: 1.5; color: var(--dim); }
  .narr { margin: 8px 0 0; font-size: 12.5px; line-height: 1.55; color: var(--paper); border-left: 2px solid var(--accent); padding-left: 10px; }
  .ghost.sm { margin-top: 9px; padding: 6px 12px; font-size: 11.5px; }
</style>
