<script>
  import Season from "$lib/components/Season/index.svelte"
  import { create_season_manager } from "$lib/components/Season/index.svelte.js"
  import { castawayImageSrc } from "$lib/castaways.js"

  let { data } = $props()
  let manager = $derived(create_season_manager(data))
  const featuredNames = ["Aaliyah Puglia", "Brady Booker", "Sharonda Cox", "An “Thien An” Nguyen", "Ana Sani", "Ori Jean-Charles"]
  const portraits = $derived(featuredNames.map((name) => data.castaways.find((person) => person.name === name)).filter(Boolean))
</script>

<svelte:head>
  <title>Survivor 51 Cast & Printable Cast Sheets | Survivor Snuff</title>
  <meta name="description" content="Meet all 21 Survivor 51 castaways. Get names, photos, ages, hometowns and jobs, then save a grid or detailed cast sheet for premiere night." />
  <link rel="canonical" href="https://www.survivorsnuff.com/" />
</svelte:head>

<div class="home">
  <header class="hero">
    <div class="hero-copy">
      <p class="eyebrow"><span></span> SURVIVOR 51 · THE OPEN ERA</p>
      <h1>New faces.<br />Same obsession.</h1>
      <p class="hero-description">Twenty-one castaways. A whole new era.<br class="desktop-break" /> Get to know the players before their torches are lit.</p>
      <div class="hero-actions"><a class="primary-link" href="#castaways">Meet the cast <span>↓</span></a><a class="secondary-link" href="/seasons">Explore past seasons →</a></div>
      <p class="premiere"><strong>SEPT 23</strong><span>Season premiere · 8 ET/PT on CBS</span></p>
    </div>
    <div class="hero-portraits" aria-label="A few of this season’s new castaways">
      {#each portraits as person, i}
        <div class="hero-portrait"><img src={castawayImageSrc(person, 51)} alt={person.name} fetchpriority={i === 0 ? "high" : "auto"} /><span>{person.name.split(" ")[0]}</span></div>
      {/each}
      <div class="cast-stamp"><strong>21</strong><span>NEW<br />CASTAWAYS</span></div>
    </div>
  </header>
  <div class="quick-note"><span class="note-icon">↙</span><p>Your premiere-night cheat sheet. <span>Switch between a photo grid and detailed profiles, then save either as an image.</span></p><span class="note-tag">FREE TO SAVE</span></div>
  <Season {manager} featured />
  <aside class="archive-callout"><div><p class="eyebrow">A FEW FAMILIAR FACES</p><h2>Every season has a story.</h2><p>Find the castaways from seasons past.</p></div><a href="/seasons">Browse the season archive →</a></aside>
</div>

<style>
  .home { max-width: 1120px; padding: 0 1.5rem; margin: 0 auto; }
  .hero { display: grid; grid-template-columns: 1.2fr 1fr; gap: 3rem; align-items: center; padding: 4.5rem 0 3.5rem; }
  .eyebrow { font-size: .75rem; letter-spacing: .15em; font-weight: 750; color: var(--snuff-muted); margin: 0 0 1.4rem; display: flex; align-items: center; gap: .6rem; }
  .eyebrow > span { width: .5rem; height: .5rem; border-radius: 50%; background: var(--snuff-accent); }
  h1 { font-size: clamp(3.5rem, 5.7vw, 5rem); line-height: .99; letter-spacing: -.055em; margin: 0; font-weight: 780; }
  .hero-description { color: var(--snuff-muted); font-size: 1.15rem; line-height: 1.6; margin: 1.5rem 0 1.8rem; }
  .hero-actions { display: flex; gap: 1.3rem; align-items: center; flex-wrap: wrap; }
  .primary-link { border-radius: .65rem; padding: .9rem 1.2rem; background: var(--snuff-accent); color: white; display: flex; align-items: center; gap: 1.3rem; text-decoration: none; font-weight: 650; font-size: .98rem; }
  .secondary-link { color: var(--snuff-text); font-size: .9rem; text-decoration: none; font-weight: 600; }
  .premiere { display: flex; align-items: center; gap: .85rem; font-size: .82rem; margin-top: 2rem; color: var(--snuff-muted); }
  .premiere strong { color: var(--snuff-text); font-size: .72rem; letter-spacing: .08em; padding-right: .85rem; border-right: 1px solid var(--snuff-border); }
  .hero-portraits { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .65rem; position: relative; transform: rotate(2deg); }
  .hero-portrait { aspect-ratio: .82; border-radius: .8rem; overflow: hidden; position: relative; background: var(--snuff-surface); }
  .hero-portrait img { width: 100%; height: 100%; display: block; object-fit: cover; object-position: center 25%; }
  .hero-portrait:nth-child(3n + 2) { transform: translateY(-1rem); }
  .hero-portrait span { position: absolute; bottom: 0; left: 0; right: 0; padding: 1.1rem .7rem .6rem; font-size: .75rem; font-weight: 650; color: #fff; background: linear-gradient(transparent, #0008); }
  .cast-stamp { position: absolute; right: -1rem; bottom: -1rem; display: flex; align-items: center; gap: .55rem; border: 5px solid var(--snuff-bg); border-radius: .9rem; padding: .8rem 1rem; background: #e9eddf; color: #293e30; transform: rotate(-6deg); }
  .cast-stamp strong { font-size: 2.4rem; line-height: 1; letter-spacing: -.06em; }
  .cast-stamp span { font-size: .6rem; line-height: 1.4; font-weight: 800; letter-spacing: .06em; }
  .quick-note { display: flex; gap: 1rem; align-items: center; padding: 1.1rem 1.4rem; margin: .5rem 0 3.5rem; border-radius: .75rem; border: 1px solid var(--snuff-border); background: var(--snuff-surface); }
  .quick-note p { margin: 0; font-size: .9rem; font-weight: 650; line-height: 1.5; }
  .quick-note p span { color: var(--snuff-muted); font-weight: 400; }
  .note-icon { font-size: 1.5rem; }
  .note-tag { margin-left: auto; white-space: nowrap; font-size: .6rem; font-weight: 750; letter-spacing: .1em; color: var(--snuff-muted); }
  .archive-callout { margin-top: 4rem; padding: 2rem 0; border-top: 1px solid var(--snuff-border); display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; }
  .archive-callout .eyebrow { margin-bottom: .6rem; }
  .archive-callout h2 { font-size: 1.7rem; letter-spacing: -.035em; margin: 0; }
  .archive-callout p { color: var(--snuff-muted); margin-bottom: 0; }
  .archive-callout a { font-size: .95rem; font-weight: 600; white-space: nowrap; }
  @media (max-width: 800px) {
    .hero { gap: 1.5rem; }
    h1 { font-size: 3.5rem; }
    .hero-description { font-size: 1rem; }
    .desktop-break { display: none; }
    .hero-actions { gap: .9rem; }
    .note-tag { display: none; }
  }
  @media (max-width: 600px) {
    .home { padding: 0 1rem; }
    .hero { grid-template-columns: 1fr; padding: 2.5rem 0 2rem; gap: 2.3rem; }
    h1 { font-size: clamp(3.1rem, 12vw, 4.5rem); }
    .hero-portraits { gap: .5rem; margin: 0 .35rem; }
    .hero-portrait { aspect-ratio: 1; }
    .hero-portrait:nth-child(n + 4) { display: none; }
    .hero-portrait:nth-child(3n + 2) { transform: translateY(-.5rem); }
    .cast-stamp { bottom: -.5rem; right: -.3rem; padding: .5rem .7rem; }
    .cast-stamp strong { font-size: 1.8rem; }
    .premiere { flex-wrap: wrap; margin-top: 1.5rem; font-size: .75rem; gap: .5rem; }
    .quick-note { padding: 1rem; margin-bottom: 2.5rem; }
    .quick-note p span { display: block; margin-top: .2rem; }
    .archive-callout { flex-direction: column; align-items: start; }
  }
</style>
