<script>
  import { formatSeasonDate, seasonDateTimestamp } from "$lib/season-dates.js"
  let { data } = $props()
  const seasons = $derived([...(data.seasons ?? [])].sort((a, b) => b.season_number - a.season_number))
</script>

<svelte:head><title>Survivor Season Archive | Survivor Snuff</title><meta name="description" content="Explore Survivor castaways, photos, and cast sheets by season." /></svelte:head>
<div class="archive">
  <p class="eyebrow">THE ARCHIVE</p><h1>Find your season.</h1><p class="intro">The faces, the places, the players. Pick a season to meet its cast.</p>
  <div class="seasons">
    {#each seasons as season}
      <a class="season" href={`/seasons/${season.season_number}`}>
        <span class="season-number">{season.season_number}</span>
        <div><h2>Survivor {season.season_number}</h2>{#if season.title && season.title !== `Survivor ${season.season_number}`}<p class="title">{season.title}</p>{/if}
        <p class="date">{seasonDateTimestamp(season.first_air_time) > Date.now() ? "Premieres" : "Premiered"} {formatSeasonDate(season.first_air_time)}{season.contestant_count ? ` · ${season.contestant_count} castaways` : ""}</p></div>
        <span class="arrow" aria-hidden="true">↗</span>
      </a>
    {/each}
  </div>
</div>
<style>
  .archive { max-width: 960px; margin: 0 auto; padding: 3.5rem 1.5rem; }
  .eyebrow { font-size: .75rem; letter-spacing: .16em; color: var(--snuff-muted); font-weight: 750; }
  h1 { font-size: clamp(2.8rem, 7vw, 4.5rem); margin: .6rem 0 1rem; letter-spacing: -.045em; line-height: 1; }
  .intro { color: var(--snuff-muted); margin-bottom: 2.5rem; line-height: 1.5; }
  .seasons { display: grid; gap: 1rem; }
  .season { display: flex; align-items: center; gap: 1.5rem; border: 1px solid var(--snuff-border); background: var(--snuff-card); border-radius: 1rem; padding: 1.5rem; text-decoration: none; color: var(--snuff-text); }
  .season:hover { border-color: var(--snuff-accent); }
  .season-number { font-size: 2.5rem; font-weight: 750; letter-spacing: -.06em; color: var(--snuff-accent); min-width: 3.5rem; }
  h2 { font-size: 1.4rem; margin: 0; letter-spacing: -.02em; }
  .title { margin: .3rem 0 0; }
  .date { font-size: .85rem; color: var(--snuff-muted); margin: .5rem 0 0; }
  .arrow { margin-left: auto; font-size: 1.5rem; }
  @media(max-width: 500px) { .season { padding: 1rem; gap: 1rem; } .archive { padding: 2.5rem 1rem; } }
</style>
