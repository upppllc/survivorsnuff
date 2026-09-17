<script>
  import { Button } from "sveltekit-ui"
  import Season from "$lib/components/Season/index.svelte"

  let { manager } = $props()
</script>

<div class="home">
  <header class="hero">
    <div class="hero-copy">
      <p class="eyebrow"><span></span> {manager.season_label}</p>
      <h1>New faces.<br />Same obsession.</h1>
      <p class="hero-description">Meet all {manager.castaway_count} castaways.<br class="desktop-break" /> Photos, hometowns, and a cast sheet to preview and save.</p>
      <div class="hero-actions"><Button manager={manager.meet_cast_button_manager} /><Button manager={manager.explore_seasons_button_manager} /></div>
      <p class="premiere"><strong>SEPT 23</strong><span>Season premiere · 8 ET/PT on CBS</span></p>
    </div>
    <div class="season-panel" aria-label={`Survivor ${manager.season_number} cast guide`}>
      <div class="season-panel-heading"><span>SURVIVOR</span><span>CAST GUIDE</span></div>
      <div class="season-panel-number">{manager.season_number}</div>
      <p class="season-panel-title">{manager.season_title}</p>
      <div class="season-panel-footer"><span>{manager.castaway_count} NEW CASTAWAYS</span><span>FIJI</span></div>
    </div>
  </header>
  <div class="quick-note"><p>Your premiere-night cheat sheet. <span>Choose a photo grid or detailed profiles, preview your cast sheet, then save it as an image.</span></p><span class="note-tag">FREE TO SAVE</span></div>
  <Season manager={manager.season_manager} featured />
  <aside class="archive-callout"><div><p class="eyebrow">A FEW FAMILIAR FACES</p><h2>Every season has a story.</h2><p>Find the castaways from seasons past.</p></div><Button manager={manager.browse_archive_button_manager} /></aside>
</div>

<style>
  .home { max-width: 1120px; padding: 0 2.4rem; margin: 0 auto; }
  .hero { display: grid; grid-template-columns: 1.2fr 1fr; gap: 4.8rem; align-items: center; padding: 7.2rem 0 5.6rem; }
  .eyebrow { line-height: 1.5; font-size: 1.2rem; letter-spacing: .15em; font-weight: 750; color: var(--snuff-muted); margin: 0 0 2.24rem; display: flex; align-items: center; gap: 0.96rem; }
  .eyebrow > span { width: 0.8rem; height: 0.8rem; border-radius: 50%; background: var(--snuff-accent); }
  h1 { font-family: inherit; color: var(--snuff-text); font-size: clamp(5.6rem, 5.7vw, 8rem); line-height: .99; letter-spacing: -.055em; margin: 0; font-weight: 780; }
  .hero-description { color: var(--snuff-muted); font-size: 1.84rem; line-height: 1.6; margin: 2.4rem 0 2.88rem; }
  .hero-actions { display: flex; gap: 2.08rem; align-items: center; flex-wrap: wrap; }
  .premiere { line-height: 1.5; display: flex; align-items: center; gap: 1.36rem; font-size: 1.312rem; margin-top: 3.2rem; color: var(--snuff-muted); }
  .premiere span { font-size: inherit; line-height: inherit; color: inherit; }
  .premiere strong { line-height: inherit; color: var(--snuff-text); font-size: 1.152rem; letter-spacing: .08em; padding-right: 1.36rem; border-right: 1px solid var(--snuff-border); }
  .season-panel { position: relative; isolation: isolate; overflow: hidden; padding: 3.2rem; border: 1px solid var(--snuff-border); border-radius: 1.6rem; background: var(--snuff-surface); transform: rotate(2deg); }
  .season-panel::before, .season-panel::after { content: ""; position: absolute; z-index: -1; width: 36rem; height: 36rem; border: 1px solid var(--snuff-border); border-radius: 50%; pointer-events: none; }
  .season-panel::before { top: -19rem; right: -15rem; box-shadow: 0 0 0 2rem var(--snuff-surface), 0 0 0 calc(2rem + 1px) var(--snuff-border); }
  .season-panel::after { bottom: -24rem; left: -10rem; box-shadow: 0 0 0 2rem var(--snuff-surface), 0 0 0 calc(2rem + 1px) var(--snuff-border); }
  .season-panel-heading, .season-panel-footer { display: flex; align-items: center; justify-content: space-between; gap: 1.6rem; }
  .season-panel-heading span, .season-panel-footer span { color: var(--snuff-muted); font-size: 1.12rem; font-weight: 650; line-height: 1.5; letter-spacing: .12em; }
  .season-panel-number { color: var(--snuff-text); font-size: clamp(13rem, 18vw, 21rem); font-weight: 780; line-height: .9; letter-spacing: -.09em; text-align: center; padding: 3.2rem 1.6rem 0 0; }
  .season-panel-title { color: var(--snuff-text); font-size: 2.24rem; font-weight: 600; line-height: 1.2; text-align: center; margin: 1.6rem 0 3.2rem; }
  .season-panel-footer { border-top: 1px solid var(--snuff-border); padding-top: 2.4rem; }
  .quick-note { display: flex; gap: 1.6rem; align-items: center; padding: 1.76rem 2.24rem; margin: 0.8rem 0 5.6rem; border-radius: 1.2rem; border: 1px solid var(--snuff-border); background: var(--snuff-surface); }
  .quick-note p { color: var(--snuff-text); margin: 0; font-size: 1.44rem; font-weight: 650; line-height: 1.5; }
  .quick-note p span { font-size: inherit; line-height: inherit; color: var(--snuff-muted); font-weight: 400; }
  .note-tag { line-height: 1.5; margin-left: auto; white-space: nowrap; font-size: 0.96rem; font-weight: 750; letter-spacing: .1em; color: var(--snuff-muted); }
  .archive-callout { margin-top: 6.4rem; padding: 3.2rem 0; border-top: 1px solid var(--snuff-border); display: flex; align-items: center; justify-content: space-between; gap: 2.4rem; }
  .archive-callout .eyebrow { margin-bottom: 0.96rem; }
  .archive-callout h2 { font-family: inherit; color: var(--snuff-text); font-weight: 700; line-height: 1.2; font-size: 2.72rem; letter-spacing: -.035em; margin: 0; }
  .archive-callout p { color: var(--snuff-muted); margin-bottom: 0; }
  .archive-callout p:not(.eyebrow) { font-size: 1.6rem; line-height: 1.5; }
  @media (max-width: 800px) {
    .hero { gap: 2.4rem; }
    h1 { font-size: 5.6rem; }
    .hero-description { font-size: 1.6rem; }
    .desktop-break { display: none; }
    .hero-actions { gap: 1.44rem; }
    .note-tag { display: none; }
  }
  @media (max-width: 600px) {
    .home { padding: 0 1.6rem; }
    .hero { grid-template-columns: 1fr; padding: 4rem 0 3.2rem; gap: 3.68rem; }
    h1 { font-size: clamp(4.96rem, 12vw, 7.2rem); }
    .season-panel { transform: none; padding: 2.4rem; }
    .season-panel-number { font-size: 12rem; padding-top: 2.4rem; }
    .season-panel-title { font-size: 1.92rem; margin-bottom: 2.4rem; }
    .season-panel-footer { padding-top: 1.6rem; }
    .premiere { flex-wrap: wrap; margin-top: 2.4rem; font-size: 1.2rem; gap: 0.8rem; }
    .quick-note { padding: 1.6rem; margin-bottom: 4rem; }
    .quick-note p span { display: block; margin-top: 0.32rem; }
    .archive-callout { flex-direction: column; align-items: start; }
  }
</style>
