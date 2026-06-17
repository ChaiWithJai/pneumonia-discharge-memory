<script lang="ts">
  // Triggers — only the user's own scheduled traction prompts. No app-timed FOMO.
  import { ember } from "../lib/store.svelte";
  const save = $derived(ember.save!);
</script>

<div class="scene">
  <span class="eyebrow">Triggers</span>
  <p>Ember never nudges you for our own metrics. The only prompts that exist are the ones you choose to set for yourself — traction toward your own life.</p>
  <button class="toggle" onclick={() => ember.setNudges(!save.settings.nudgesEnabled)}>
    <span>
      <strong>A gentle daily invitation</strong>
      <span class="faint" style="display:block;font-size:13px">A single prompt, at a time you'd choose. Off by default.</span>
    </span>
    <span class="switch" class:on={save.settings.nudgesEnabled}></span>
  </button>
  <p class="faint">There are no streak reminders, no “you haven't opened the app” messages — those are distraction, not traction.</p>
  <div class="spacer"></div>
  <button class="btn btn-block" onclick={() => ember.go("F4")}>Back</button>
</div>
