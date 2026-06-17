<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  interface Props {
    seconds?: number;
    accent?: string;
    onComplete?: () => void;
    onProgress?: (v: number) => void;
  }
  let { seconds = 19, accent = "#e0894a", onComplete, onProgress }: Props = $props();

  // Resonant-ish cycle: inhale 4s, hold 2s, exhale 6s.
  const CYCLE = 12;
  let scale = $state(0.62);
  let label = $state("Breathe in");
  let started = $state(false);
  let done = false;
  let raf = 0;
  let t0 = 0;

  function frame(now: number) {
    if (!t0) t0 = now;
    const t = (now - t0) / 1000;
    const pos = t % CYCLE;
    if (pos < 4) {
      scale = 0.62 + 0.38 * (pos / 4);
      label = "Breathe in";
    } else if (pos < 6) {
      scale = 1;
      label = "Hold";
    } else {
      scale = 1 - 0.38 * ((pos - 6) / 6);
      label = "And out";
    }
    onProgress?.(Math.min(1, t / seconds));
    if (t >= seconds && !done) {
      done = true;
      label = "There.";
      onComplete?.();
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  function begin() {
    if (started) return;
    started = true;
    t0 = 0;
    raf = requestAnimationFrame(frame);
  }

  onMount(() => {
    // a beat before it starts, so the moment feels chosen
    const id = setTimeout(begin, 400);
    return () => clearTimeout(id);
  });
  onDestroy(() => cancelAnimationFrame(raf));
</script>

<div class="pacer">
  <div
    class="orb"
    style="transform:scale({scale});box-shadow:0 0 {40 + scale * 60}px {accent};background:radial-gradient(circle at 50% 45%, #fff6ea, {accent});"
  ></div>
  <p class="label">{label}</p>
</div>

<style>
  .pacer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 26px;
  }
  .orb {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    transition: transform 0.12s linear, box-shadow 0.3s ease;
  }
  .label {
    font-family: var(--serif);
    font-style: italic;
    font-size: 18px;
    color: var(--ink);
    letter-spacing: 0.02em;
  }
</style>
