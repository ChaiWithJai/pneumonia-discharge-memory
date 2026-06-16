<script lang="ts">
  import { onMount } from "svelte";
  import { conf, EMOTION } from "./lib/store.svelte";
  import Chrome from "./lib/Chrome.svelte";
  import Lobby from "./lib/states/Lobby.svelte";
  import Convene from "./lib/states/Convene.svelte";
  import Present from "./lib/states/Present.svelte";
  import Feel from "./lib/states/Feel.svelte";
  import Judge from "./lib/states/Judge.svelte";
  import Reckon from "./lib/states/Reckon.svelte";
  import Decide from "./lib/states/Decide.svelte";
  import Compound from "./lib/states/Compound.svelte";
  import Summary from "./lib/states/Summary.svelte";

  onMount(() => conf.boot());
</script>

<div class="root" data-emotion={EMOTION[conf.state]}>
  <Chrome />
  {#key conf.state}
    <div class="view">
      {#if conf.state === "lobby"}<Lobby />
      {:else if conf.state === "convene"}<Convene />
      {:else if conf.state === "present"}<Present />
      {:else if conf.state === "feel"}<Feel />
      {:else if conf.state === "judge"}<Judge />
      {:else if conf.state === "reckon"}<Reckon />
      {:else if conf.state === "decide"}<Decide />
      {:else if conf.state === "compound"}<Compound />
      {:else if conf.state === "summary"}<Summary />
      {/if}
    </div>
  {/key}

  <footer>
    Synthetic data only — not medical advice, clinical decision support, or a production system. All generation is
    local; no patient data leaves the device.
  </footer>
</div>

<style>
  .root { min-height: 100vh; display: flex; flex-direction: column; }
  .view { flex: 1; }
  footer { max-width: 1120px; margin: 0 auto; padding: 22px 26px 40px; color: var(--faint); font-size: 11.5px; line-height: 1.6; border-top: 1px solid var(--line); }
</style>
