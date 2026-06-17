<script lang="ts">
  import { onMount } from "svelte";
  import type { Component } from "svelte";
  import { ember } from "./lib/store.svelte";
  import type { Screen } from "./lib/store.svelte";
  import { temperament } from "./lib/engine/blueprint";
  import Nav from "./lib/components/Nav.svelte";

  import A1 from "./screens/A1.svelte";
  import A2 from "./screens/A2.svelte";
  import A3 from "./screens/A3.svelte";
  import A4 from "./screens/A4.svelte";
  import A5 from "./screens/A5.svelte";
  import A6 from "./screens/A6.svelte";
  import B1 from "./screens/B1.svelte";
  import B2 from "./screens/B2.svelte";
  import B3 from "./screens/B3.svelte";
  import B4 from "./screens/B4.svelte";
  import B5 from "./screens/B5.svelte";
  import C1 from "./screens/C1.svelte";
  import C2 from "./screens/C2.svelte";
  import C3 from "./screens/C3.svelte";
  import C4 from "./screens/C4.svelte";
  import D2 from "./screens/D2.svelte";
  import D3 from "./screens/D3.svelte";
  import E1 from "./screens/E1.svelte";
  import E2 from "./screens/E2.svelte";
  import E3 from "./screens/E3.svelte";
  import F1 from "./screens/F1.svelte";
  import F2 from "./screens/F2.svelte";
  import F3 from "./screens/F3.svelte";
  import F4 from "./screens/F4.svelte";
  import Carepath from "./screens/carepath.svelte";
  import Studio from "./screens/studio.svelte";

  const SCREENS: Record<Screen, Component> = {
    A1, A2, A3, A4, A5, A6,
    B1, B2, B3, B4, B5,
    C1, C2, C3, C4,
    D2, D3,
    E1, E2, E3,
    F1, F2, F3, F4,
    carepath: Carepath,
    studio: Studio,
  };

  const CORE: Screen[] = ["B1", "B2", "B3", "B4", "C1", "C4", "F4"];

  const accent = $derived(
    temperament(ember.ember?.temperament ?? ember.draftTemperament).accent,
  );
  const showNav = $derived(CORE.includes(ember.screen));
  const Current = $derived(SCREENS[ember.screen]);

  onMount(() => {
    ember.boot();
    ember.startHeartbeat(); // Loop 3 — ambient world-updates, never notifications
    const onVis = () => {
      if (document.visibilityState === "visible") ember.pulse();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      ember.stopHeartbeat();
      document.removeEventListener("visibilitychange", onVis);
    };
  });
</script>

<div class="frame" style="--accent:{accent};--ember:{accent}">
  <Current />
  {#if showNav}<Nav />{/if}
</div>
