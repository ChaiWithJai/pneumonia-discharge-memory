<script lang="ts">
  // THE CARE PATH — the safety floor (world bible B.4). Plain, immediate, OUTSIDE
  // the fiction. Real human and crisis resources. Never gamified comfort.
  //
  // NOTE: resources are a US-default placeholder and MUST be reviewed + localized
  // with a professional care-path partner before any real-person pilot.
  import { ember } from "../lib/store.svelte";
  import { CARE_RESOURCES } from "../lib/loops/carepath";
</script>

<div class="scene">
  <h1>You're not alone in this.</h1>
  <p class="lead">
    What you're carrying matters more than anything in this app. Here are people who can help right now.
  </p>

  <div class="stack">
    {#each CARE_RESOURCES as r (r.label)}
      <div class="card">
        <strong>{r.label}</strong>
        <p style="margin-top:6px">{r.detail}</p>
        {#if r.action}
          <a class="btn btn-primary btn-block" style="margin-top:12px" href={r.action}>Reach out</a>
        {/if}
      </div>
    {/each}
  </div>

  <p class="faint">
    These are starting points, not a substitute for professional care. If you're in immediate danger, contact
    your local emergency services now.
  </p>

  <div class="spacer"></div>
  <button class="btn btn-block" onclick={() => ember.go("B1")}>Back to the country</button>
</div>
