<script lang="ts">
  interface Props {
    text: string;
  }
  let { text }: Props = $props();
</script>

{#if text}
  <p class="voice">“{text}”</p>
{/if}

<style>
  .voice {
    font-family: var(--serif);
    font-style: italic;
    font-size: 19px;
    line-height: 1.5;
    color: var(--ink);
  }
</style>
