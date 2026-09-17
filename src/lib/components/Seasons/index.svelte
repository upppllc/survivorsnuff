<script>
  import { Button, Icon } from "sveltekit-ui"
  let { manager } = $props()
</script>

<div class="archive">
  <p class="eyebrow">THE ARCHIVE</p><h1>Find your season.</h1><p class="intro">The faces, the places, the players. Pick a season to meet its cast.</p>
  <div class="seasons">
    {#each manager.seasons as season (season.season_number)}
      <Button manager={season.visit_button_manager}>
        {#snippet content()}
          <div class="season">
            <span class="season-number">{season.season_number}</span>
            <div class="season-copy"><h2>Survivor {season.season_number}</h2>
              {#if season.date_label}<p class="date">{season.premiere_label} {season.date_label}</p>{/if}
            </div>
            <div class="arrow" aria-hidden="true"><Icon manager={season.visit_icon_manager} /></div>
          </div>
        {/snippet}
      </Button>
    {/each}
  </div>
</div>
<style>
  .archive { max-width: 960px; margin: 0 auto; padding: 5.6rem 2.4rem; }
  .eyebrow { font-size: 1.2rem; letter-spacing: .16em; color: var(--snuff-muted); font-weight: 750; }
  h1, h2 { font-family: inherit; color: var(--snuff-text); font-weight: 750; }
  h1 { font-size: clamp(4.48rem, 7vw, 7.2rem); margin: .96rem 0 1.6rem; letter-spacing: -.045em; line-height: 1; }
  .intro { color: var(--snuff-muted); margin-bottom: 4rem; line-height: 1.5; }
  .seasons { display: grid; gap: 1.6rem; }
  .season { display: flex; width: 100%; align-items: center; gap: 2.4rem; border: 1px solid var(--snuff-border); background: var(--snuff-card); border-radius: 1.6rem; padding: 2.4rem; color: var(--snuff-text); }
  .season:hover { border-color: var(--snuff-accent); }
  .season-copy { min-width: 0; }
  .season-number { font-size: 4rem; font-weight: 750; letter-spacing: -.06em; color: var(--snuff-accent); min-width: 5.6rem; }
  h2 { font-size: 2.24rem; margin: 0; letter-spacing: -.02em; }
  .date { font-size: 1.36rem; color: var(--snuff-muted); margin: .8rem 0 0; }
  .arrow { display: flex; flex-shrink: 0; margin-left: auto; }
  @media(max-width: 500px) { .season { padding: 1.6rem; gap: 1.6rem; } .archive { padding: 4rem 1.6rem; } }
</style>
