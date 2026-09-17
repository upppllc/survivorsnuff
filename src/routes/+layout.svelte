<script>
  import "sveltekit-ui/style.css"
  import { Layout, Checkbox, Button } from "sveltekit-ui"
  import Logo from "$lib/components/Logo/index.svelte"
  import MainNav from "$lib/components/MainNav/index.svelte"
  import { create_global_manager } from "$lib/client/index.svelte.js"
  let { children } = $props()
  const manager = create_global_manager()
</script>

<svelte:head>
  <title>Survivor Snuff — Castaway Guides & Cast Sheets</title>
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
  <meta name="description" content="Meet the Survivor castaways. Browse cast photos and profiles, explore past seasons, and save a cast sheet for watch night." />
  <meta property="og:title" content="Survivor Snuff — Know the cast" />
  <meta property="og:description" content="Your Survivor cast guide. Names, faces, and downloadable cast sheets for every watch night." />
  <meta property="og:image" content="https://www.survivorsnuff.com/thumbnail.webp" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="https://www.survivorsnuff.com/thumbnail.webp" />
</svelte:head>

<a class="skip-link" href="#main-content">Skip to content</a>
<Layout manager={manager.layout_manager}>
  {#snippet nav_bar_logo()}<div class="brand"><Logo /></div>{/snippet}
  {#snippet nav_bar_extra()}
    <div class="nav-extra"><MainNav manager={manager.main_nav_manager} /><Checkbox manager={manager.layout_manager.dark_theme_manager} /></div>
  {/snippet}
  {#snippet content()}
    <main id="main-content">{@render children?.()}</main>
    <footer class="site-footer">
      <div><Button manager={manager.footer_home_button_manager} /><p>A fan’s guide to the faces on the island.</p></div>
      <div class="footer-links"><Button manager={manager.footer_archive_button_manager} /><Button manager={manager.footer_follow_button_manager} /></div>
      <p class="disclaimer">An independent fan site. Not affiliated with CBS or Survivor. Cast photos belong to their credited owners.</p>
    </footer>
  {/snippet}
</Layout>

<style>
  @font-face { font-family: "Proxima Vara"; src: url("/fonts/ProximaVara.woff2") format("woff2"); font-weight: 100 900; font-stretch: 50% 100%; font-display: swap; }
  @font-face { font-family: "Roboto Serif"; src: url("/fonts/RobotoSerif-VariableFont.woff2") format("woff2"); font-weight: 100 1000; font-display: swap; }
  @font-face { font-family: "Quicksand"; src: url("/fonts/Quicksand-VariableFont.woff2") format("woff2"); font-weight: 100 1000; font-display: swap; }
  :global(:root) { --primary-c: var(--c10); --primary-h: var(--h3); --snuff-bg: #faf9f6; --snuff-card: #fffefa; --snuff-surface: #eeede6; --snuff-text: #252d27; --snuff-muted: #646c60; --snuff-border: #dedfd5; --snuff-accent: #9d472b; }
  :global(html[data-theme]) { --bg: var(--snuff-bg); }
  :global(html[data-theme="dark"]) { --snuff-bg: #191e1b; --snuff-card: #222925; --snuff-surface: #2b342e; --snuff-text: #f0f0e7; --snuff-muted: #b3bcae; --snuff-border: #3c473d; --snuff-accent: #a8482b; }
  :global(body) { background: var(--snuff-bg); }
  .brand :global(.logo) { width: 3.2rem; }
  .brand :global(.logo_text) { font-family: "Proxima Vara", Arial, sans-serif; font-size: 2.1rem; letter-spacing: -.05rem; color: var(--snuff-text); font-weight: 750; line-height: 1.2; }
  .nav-extra { display: flex; align-items: center; gap: 1.8rem; }
  main { flex: 1; }
  .site-footer { width: calc(100% - 4.8rem); max-width: 1120px; border-top: 1px solid var(--snuff-border); padding: 3.5rem 0 3.2rem; margin: 3.2rem auto 0; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1.6rem; }
  .site-footer p { color: var(--snuff-muted); font-size: 1.4rem; line-height: 1.5; margin: .8rem 0 0; }
  .footer-links { display: flex; gap: 1.4rem; padding-top: .5rem; }
  .site-footer .disclaimer { width: 100%; font-size: 1.15rem; margin-top: 1.6rem; line-height: 1.5; }
  .skip-link { position: absolute; top: -100px; left: 1.6rem; z-index: 100; padding: 1.6rem; background: var(--snuff-card); color: var(--snuff-text); }
  .skip-link:focus { top: 1.6rem; }
  @media(max-width: 600px) {
    .brand :global(.logo_text) { font-size: 1.7rem; }
    .brand :global(.logo) { width: 2.7rem; }
    .nav-extra { gap: .6rem; }
    .site-footer { width: calc(100% - 3.2rem); }
  }
  @media(prefers-reduced-motion: reduce) { :global(html) { scroll-behavior: auto; } }
</style>
