<script>
  import { Button } from "sveltekit-ui"
  let { manager } = $props()
</script>

<svelte:head>
  <title>{manager.title} | Survivor Snuff</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="error-page">
  <p class="eyebrow">{manager.status}</p>
  <h1>{manager.heading}</h1>
  <p>{manager.message}</p>
  <div class="actions">
    <Button manager={manager.home_button_manager} />
    <Button manager={manager.seasons_button_manager} />
    {#if manager.status !== 404}<Button manager={manager.retry_button_manager} />{/if}
  </div>
</div>
<style>
  .error-page { max-width: 76.8rem; margin: 0 auto; padding: 8rem 2.4rem; min-height: 55vh; }
  .eyebrow { letter-spacing: .15em; font-size: 1.36rem; font-weight: 700; color: var(--snuff-muted); }
  h1 { margin: 1.6rem 0; letter-spacing: -.04em; }
  p { line-height: 1.6; }
  .actions { display: flex; flex-wrap: wrap; gap: 1.6rem; margin-top: 3.2rem; }
</style>
