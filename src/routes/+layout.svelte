<script>
  import "sveltekit-ui/style.css"
  import Logo from "$lib/components/Logo/index.svelte"
  import { onMount } from "svelte"
  import { page } from "$app/state"

  let { children } = $props()
  let darkTheme = $state(false)
  onMount(() => { darkTheme = document.documentElement.dataset.theme === "dark" })
  function toggleTheme() {
    darkTheme = !darkTheme
    const theme = darkTheme ? "dark" : "light"
    document.documentElement.dataset.theme = theme
    document.cookie = `theme=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`
  }
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
<header class="site-header">
  <div class="header-inner">
    <a class="brand" href="/" aria-label="Survivor Snuff home"><Logo /></a>
    <nav aria-label="Main navigation">
      <a href="/seasons/51" class:current={page.url.pathname === "/seasons/51"}>Season 51</a>
      <a href="/seasons" class:current={page.url.pathname === "/seasons"}>All seasons</a>
      <button class="theme-toggle" onclick={toggleTheme} aria-label={darkTheme ? "Switch to light theme" : "Switch to dark theme"} title={darkTheme ? "Light theme" : "Dark theme"}>
        {#if darkTheme}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>
        {:else}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M20 15.3A9 9 0 0 1 8.7 4 9 9 0 1 0 20 15.3Z"/></svg>
        {/if}
      </button>
    </nav>
  </div>
</header>
<main id="main-content">{@render children?.()}</main>
<footer class="site-footer">
  <div><a href="/" class="footer-brand">Survivor Snuff</a><p>A fan’s guide to the faces on the island.</p></div>
  <div class="footer-links"><a href="/seasons">Season archive</a><a href="https://x.com/SurvivorSnuff" target="_blank" rel="noopener noreferrer">Follow on X ↗</a></div>
  <p class="disclaimer">An independent fan site. Not affiliated with CBS or Survivor. Cast photos belong to their credited owners.</p>
</footer>

<style>
  @font-face { font-family: "Proxima Vara"; src: url("/fonts/ProximaVara.woff2") format("woff2"); font-weight: 100 900; font-stretch: 50% 100%; font-display: swap; }
  @font-face { font-family: "Roboto Serif"; src: url("/fonts/RobotoSerif-VariableFont.woff2") format("woff2"); font-weight: 100 1000; font-display: swap; }
  @font-face { font-family: "Quicksand"; src: url("/fonts/Quicksand-VariableFont.woff2") format("woff2"); font-weight: 100 1000; font-display: swap; }
  :global(:root) { --primary-c: var(--c10); --primary-h: var(--h3); --snuff-bg: #faf9f6; --snuff-card: #fffefa; --snuff-surface: #eeede6; --snuff-text: #252d27; --snuff-muted: #646c60; --snuff-border: #dedfd5; --snuff-accent: #9d472b; }
  :global(html[data-theme="dark"]) { --snuff-bg: #191e1b; --snuff-card: #222925; --snuff-surface: #2b342e; --snuff-text: #f0f0e7; --snuff-muted: #b3bcae; --snuff-border: #3c473d; --snuff-accent: #a8482b; }
  :global(html) { font-size: 100%; scroll-behavior: auto; }
  :global(body) { margin: 0; background: var(--snuff-bg); color: var(--snuff-text); font-family: "Proxima Vara", Arial, sans-serif; font-size: 16px; line-height: 1.5; }
  :global(body *) { font-family: inherit; font-size: inherit; line-height: inherit; color: inherit; }
  :global(h1), :global(h2), :global(h3), :global(h4) { font-family: inherit; color: var(--snuff-text); font-weight: 700; line-height: 1.2; }
  :global(h1) { font-size: clamp(2rem, 5vw, 3rem); }
  :global(h2) { font-size: clamp(1.5rem, 3vw, 2rem); }
  :global(h3) { font-size: 1.25rem; }
  :global(h4) { font-size: 1.1rem; }
  :global(strong) { font-weight: 700; }
  :global(input[type="checkbox"]) { appearance: auto; -webkit-appearance: auto; accent-color: var(--snuff-accent); }
  :global(*), :global(*::before), :global(*::after) { box-sizing: border-box; }
  :global(a) { color: inherit; }
  :global(button), :global(input) { font-family: inherit; }
  :global(a:focus-visible), :global(button:focus-visible) { outline: 2px solid var(--snuff-accent); outline-offset: 4px; }
  .site-header { border-bottom: 1px solid var(--snuff-border); }
  .header-inner { max-width: 1168px; padding: 1.1rem 1.5rem; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
  .brand { text-decoration: none; }
  .brand :global(.logo) { width: 2rem; }
  .brand :global(.logo_text) { font-family: "Proxima Vara", Arial, sans-serif; font-size: 1.3rem; letter-spacing: -.035em; color: var(--snuff-text); font-weight: 750; line-height: 1.2; }
  nav { display: flex; gap: 1.7rem; align-items: center; }
  nav a { font-size: .9rem; font-weight: 600; text-decoration: none; color: var(--snuff-muted); }
  nav a.current { color: var(--snuff-text); text-decoration: underline; text-underline-offset: .4rem; }
  .theme-toggle { cursor: pointer; border: 1px solid var(--snuff-border); color: var(--snuff-text); background: transparent; width: 2.2rem; height: 2.2rem; display: grid; place-content: center; border-radius: 50%; }
  .site-footer { max-width: 1120px; border-top: 1px solid var(--snuff-border); padding: 2.2rem 0 2rem; margin: 2rem auto 0; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1rem; }
  .footer-brand { font-weight: 750; text-decoration: none; font-size: 1.05rem; }
  .site-footer p { color: var(--snuff-muted); font-size: .85rem; margin: .5rem 0 0; }
  .footer-links { display: flex; gap: 1.5rem; font-size: .85rem; padding-top: .3rem; }
  .footer-links a { text-decoration: none; }
  .site-footer .disclaimer { width: 100%; font-size: .72rem; margin-top: 1rem; line-height: 1.5; }
  .skip-link { position: absolute; top: -100px; left: 1rem; z-index: 100; padding: 1rem; background: var(--snuff-card); color: var(--snuff-text); }
  .skip-link:focus { top: 1rem; }
  @media(max-width: 1180px) { .site-footer { margin-left: 1.5rem; margin-right: 1.5rem; } }
  @media(max-width: 600px) { .header-inner { padding: .9rem 1rem; gap: .5rem; } nav { gap: .85rem; } nav a { font-size: .78rem; } .brand :global(.logo_text) { font-size: 1.05rem; } .brand :global(.logo) { width: 1.7rem; } .theme-toggle { width: 1.9rem; height: 1.9rem; } .site-footer { margin-left: 1rem; margin-right: 1rem; } }
  @media(prefers-reduced-motion: no-preference) { :global(html) { scroll-behavior: smooth; } }
</style>
