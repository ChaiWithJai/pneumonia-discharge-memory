<script lang="ts">
  import { ember } from "../lib/store.svelte";
</script>

<div class="scene">
  <span class="eyebrow">A hearth</span>
  <p>You see only what they choose to share — their country's weather, never their numbers.</p>
  <div class="card">
    <p class="voice">“Their valleys are warming. They've been tending, quietly.”</p>
  </div>
  <div class="spacer"></div>
  <button class="btn btn-primary btn-block" onclick={() => ember.go("E3")}>Send warmth</button>
  <button class="btn btn-block" onclick={() => ember.go("E1")}>Back to the Commons</button>
</div>
