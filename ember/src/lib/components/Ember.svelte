<script lang="ts">
  // The being you tend. Glows with `level`; dims (never dies) with `hush`.
  interface Props {
    level: number; // 0..1
    accent?: string;
    hush?: number; // 0..1
    size?: number; // px
  }
  let { level, accent = "#e0894a", hush = 0, size = 180 }: Props = $props();

  const core = $derived(0.18 + 0.32 * Math.max(0, Math.min(1, level)));
  const glow = $derived(Math.max(0.12, level) * (1 - hush * 0.55));
  const sat = $derived(1 - hush * 0.6);
</script>

<div
  class="ember"
  style="width:{size}px;height:{size}px;filter:saturate({sat});"
  aria-label="your ember"
>
  <svg viewBox="0 0 100 100" width={size} height={size}>
    <defs>
      <radialGradient id="g-glow" cx="50%" cy="52%" r="50%">
        <stop offset="0%" stop-color={accent} stop-opacity={glow} />
        <stop offset="55%" stop-color={accent} stop-opacity={glow * 0.4} />
        <stop offset="100%" stop-color={accent} stop-opacity="0" />
      </radialGradient>
      <radialGradient id="g-core" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#fff6ea" stop-opacity={0.5 + 0.5 * level} />
        <stop offset="40%" stop-color="#f6c98c" stop-opacity={0.7 + 0.3 * level} />
        <stop offset="100%" stop-color={accent} stop-opacity="0.9" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="48" fill="url(#g-glow)" />
    <g style="transform-origin:50px 50px;animation:emberPulse {3.2 + hush * 3}s ease-in-out infinite;">
      <circle cx="50" cy="50" r={core * 100} fill="url(#g-core)" />
    </g>
  </svg>
</div>

<style>
  .ember {
    display: grid;
    place-items: center;
    transition: filter 0.6s ease;
  }
  svg {
    overflow: visible;
  }
</style>
