<script>
  import { Button } from "sveltekit-ui"
  let { manager } = $props()
</script>

<div class="main-nav" aria-label="Season navigation">
  {#each manager.button_managers as button_manager}
    <Button manager={button_manager} />
  {/each}
</div>
<style>
  .main-nav { display: flex; align-items: center; gap: .5rem; }
  @media (max-width: 480px) { .main-nav { gap: 0; } }
</style>
