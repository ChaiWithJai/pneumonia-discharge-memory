<script lang="ts">
  import { ember } from "../store.svelte";
  import type { Screen } from "../store.svelte";

  const items: { id: Screen; label: string }[] = [
    { id: "B1", label: "Country" },
    { id: "B4", label: "Tend" },
    { id: "C1", label: "Circle" },
    { id: "F4", label: "You" },
  ];
</script>

<nav class="nav">
  {#each items as it (it.id)}
    <button class:active={ember.screen === it.id} onclick={() => ember.go(it.id)}>
      <span class="dot"></span>
      {it.label}
    </button>
  {/each}
</nav>
