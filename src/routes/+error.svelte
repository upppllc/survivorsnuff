<script>
  import { page } from "$app/state"
</script>

<svelte:head>
  <title>{page.status === 404 ? "Page not found" : "Something went wrong"} | Survivor Snuff</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="error-page">
  <p class="eyebrow">{page.status}</p>
  <h1>{page.status === 404 ? "That trail ends here." : "A little trouble on the island."}</h1>
  <p>{page.error?.message || "Please try again in a moment."}</p>
  <div class="actions"><a href="/">Back to the cast</a><a href="/seasons">Browse seasons</a>
    {#if page.status !== 404}<button onclick={() => location.reload()}>Try again</button>{/if}
  </div>
</div>
<style>
  .error-page { max-width: 48rem; margin: 0 auto; padding: 5rem 1.5rem; min-height: 55vh; }
  .eyebrow { letter-spacing: .15em; font-size: .85rem; font-weight: 700; color: var(--snuff-muted); }
  h1 { margin: 1rem 0; letter-spacing: -.04em; }
  p { line-height: 1.6; }
  .actions { display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 2rem; }
  .actions a, button { padding: .75rem 1rem; border-radius: .6rem; border: 1px solid var(--snuff-border); background: var(--snuff-card); color: var(--snuff-text); text-decoration: none; font: inherit; cursor: pointer; }
</style>
