<script>
  import { onDestroy } from "svelte"
  import { castawayImageSrc } from "$lib/castaways.js"
  import { formatSeasonDate as formatDate, seasonDateTimestamp } from "$lib/season-dates.js"

  let { manager, featured = false } = $props()
  let search = $state("")
  let isSaving = $state(false)
  let exportError = $state("")
  let savedImage = $state(null)
  let failedPhotos = $state({})
  let disposed = false
  const season = $derived(manager.season_prepped)
  const castaways = $derived(manager.castaways_prepped)
  const filteredCastaways = $derived(castaways.filter((person) =>
    [person.name, person.occupation, person.hometown, person.current_residence].join(" ").toLowerCase().includes(search.trim().toLowerCase())
  ))
  const hasResults = $derived(castaways.some((person) => Number.isInteger(person.result_order)) || Boolean(season.winner))
  const hasFinalists = $derived(Array.isArray(season.finalists) && season.finalists.length > 0)
  const isUpcoming = $derived(seasonDateTimestamp(season.first_air_time) > Date.now())

  async function saveImage() {
    isSaving = true
    exportError = ""
    try {
      const { createCastawayImage } = await import("$lib/client/castaway-export.js")
      const result = await createCastawayImage({
        season, castaways: filteredCastaways,
        layout: manager.castaway_view === "grid" ? "grid" : "details",
        showSpoilers: manager.is_show_spoilers,
      })
      if (disposed) return
      if (savedImage) URL.revokeObjectURL(savedImage.url)
      savedImage = { ...result, url: URL.createObjectURL(result.blob) }
      const link = document.createElement("a")
      link.href = savedImage.url
      link.download = result.filename
      document.body.append(link)
      link.click()
      link.remove()
    } catch (error) {
      exportError = error instanceof Error ? error.message : "The image could not be saved. Please try again."
    } finally {
      isSaving = false
    }
  }
  onDestroy(() => { disposed = true; if (savedImage) URL.revokeObjectURL(savedImage.url) })
</script>

<section class="season-page">
  {#if !featured}
    <a class="back-link" href="/seasons">← All seasons</a>
    <header class="season-intro">
      <p class="eyebrow">THE CAST GUIDE</p>
      <h1>Survivor {season.season_number}</h1>
      {#if season.title && season.title !== `Survivor ${season.season_number}`}<p class="season-title">{season.title}</p>{/if}
      <div class="season-facts">
        {#if season.location}<span>{season.location}</span>{/if}
        <span>{castaways.length || season.contestant_count} castaways</span>
        {#if season.total_days}<span>{season.total_days} days</span>{/if}
        {#if season.first_air_time}<span>{isUpcoming ? "Premieres" : "Premiered"} {formatDate(season.first_air_time)}</span>{/if}
      </div>
      {#if season.twist_summary}<p class="season-summary">{season.twist_summary}</p>{/if}
    </header>
  {/if}

  <section id="castaways" class="cast-section" aria-labelledby="cast-heading">
    <div class="cast-heading">
      <div>
        <p class="eyebrow">{featured ? `SURVIVOR ${season.season_number}` : "PUT A FACE TO THE NAME"}</p>
        <h2 id="cast-heading">Meet the castaways<span class="count">{castaways.length}</span></h2>
      </div>
      {#if hasResults}
        <label class="spoilers"><input type="checkbox" bind:checked={manager.is_show_spoilers} /> Show results & spoilers</label>
      {/if}
    </div>
    <div class="cast-toolbar">
      <label class="search">
        <span class="sr-only">Search castaways</span>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/></svg>
        <input type="search" placeholder="Find a name, hometown, or job" bind:value={search} />
      </label>
      <div class="toolbar-actions">
        <div class="view-toggle" aria-label="Castaway layout">
          <button class:active={manager.castaway_view === "grid"} aria-pressed={manager.castaway_view === "grid"} onclick={() => manager.castaway_view = "grid"}>Grid</button>
          <button class:active={manager.castaway_view === "details"} aria-pressed={manager.castaway_view === "details"} onclick={() => manager.castaway_view = "details"}>Details</button>
        </div>
        <button class="save-button" onclick={saveImage} disabled={isSaving || !filteredCastaways.length} aria-busy={isSaving}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/></svg>
          {isSaving ? "Creating image…" : "Save image"}
        </button>
      </div>
    </div>
    <p class="export-hint">Your cast, ready for premiere night. Save the {manager.castaway_view === "grid" ? "three-column grid" : "full details, one person per row"} as a PNG.{search.trim() ? ` Includes the ${filteredCastaways.length} matching castaways.` : ""}</p>
    <div aria-live="polite">
      {#if exportError}<p class="export-error" role="alert">{exportError} Try saving again.</p>{/if}
      {#if savedImage}
        <div class="export-ready">
          <div><strong>Your cast sheet is ready.</strong> <a href={savedImage.url} download={savedImage.filename}>Download PNG</a> · <a href={savedImage.url} target="_blank" rel="noopener">Open image</a></div>
          <details><summary>Preview cast sheet</summary><img src={savedImage.url} alt="Generated Survivor cast sheet" class="export-preview" /></details>
        </div>
      {/if}
    </div>

    {#if filteredCastaways.length}
      <div class:cast-grid={manager.castaway_view === "grid"} class:cast-details={manager.castaway_view === "details"}>
        {#each filteredCastaways as person (person.id ?? person.name)}
          <article class="cast-card">
            <div class="portrait-wrap">
              {#if failedPhotos[person.name]}
                <div class="photo-fallback"><span>{person.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><small>Photo unavailable</small></div>
              {:else}
                <img class="portrait" src={castawayImageSrc(person, season.season_number)} alt={person.name} loading="lazy" decoding="async" onerror={() => failedPhotos[person.name] = true} />
              {/if}
              {#if manager.is_show_spoilers && Number.isInteger(person.result_order)}
                <span class="result-badge">{person.result_order === 1 ? "Winner" : `Finished #${person.result_order}`}{person.is_on_jury ? " · Jury" : ""}</span>
              {/if}
            </div>
            <div class="person-content">
              <div class="person-heading"><h3>{person.name}</h3>{#if person.age}<span class="age" aria-label={`Age ${person.age}`}>{person.age}</span>{/if}</div>
              {#if person.occupation}<p class="occupation">{person.occupation}</p>{/if}
              {#if manager.castaway_view === "grid"}
                {#if person.hometown}<p class="hometown">{person.hometown}</p>{/if}
              {:else}
                <dl class="person-facts">
                  {#if person.hometown}<div><dt>Hometown</dt><dd>{person.hometown}</dd></div>{/if}
                  {#if person.current_residence}<div><dt>Lives in</dt><dd>{person.current_residence}</dd></div>{/if}
                  {#if person.tribe}<div><dt>Tribe</dt><dd>{person.tribe}</dd></div>{/if}
                  {#if person.traits?.length}<div><dt>Three words</dt><dd>{Array.isArray(person.traits) ? person.traits.join(", ") : person.traits}</dd></div>{/if}
                </dl>
                {#each [["About", person.summary ?? person.bio], ["Why Survivor", person.why_applied], ["Life experience", person.life_experience], ["Game plan", person.unique_gameplay]] as [label, value]}
                  {#if value}<div class="bio"><h4>{label}</h4><p>{value}</p></div>{/if}
                {/each}
              {/if}
            </div>
          </article>
        {/each}
      </div>
    {:else}
      <div class="empty-state"><h3>{castaways.length ? "No castaways match that search." : "The cast is still under wraps."}</h3><p>{castaways.length ? "Try a different name, hometown, or occupation." : "Check back for cast announcements and photos."}</p>{#if search}<button onclick={() => search = ""}>Clear search</button>{/if}</div>
    {/if}
    {#if season.source_url}
      <p class="photo-credit">Cast information and photos: <a href={season.source_url} target="_blank" rel="noopener noreferrer">CBS / Paramount</a>. Ages at cast announcement.</p>
    {/if}
  </section>

  {#if manager.episodes_prepped.length}
    <section class="episodes-section" aria-labelledby="episodes-heading">
      <p class="eyebrow">ON THE ISLAND</p>
      <h2 id="episodes-heading">{isUpcoming ? "Premiere night" : "Episodes"}</h2>
      <div class="episode-list">
        {#each manager.episodes_prepped as episode}
          <div class="episode-card">
            <span class="episode-number">E{String(episode.episode_number).padStart(2, "0")}</span>
            <div><h3>{episode.title || `Episode ${episode.episode_number}`}</h3>{#if episode.air_time}<p>{formatDate(episode.air_time)}</p>{/if}</div>
            <a href={`/seasons/${season.season_number}/${episode.episode_number}`} aria-label={`Episode ${episode.episode_number} details`}>Episode details →</a>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  {#if manager.is_show_spoilers && hasFinalists}
    <section class="finalists"><h2>Finalists</h2><div class="finalist-grid">
      {#each season.finalists as finalist}
        <article class="finalist-card"><h3>{finalist}</h3>
          {#if finalist === season.winner}<p>Winner{season.winner_prize_usd ? ` · $${Number(season.winner_prize_usd).toLocaleString()}` : ""}</p>{/if}
          {#if Array.isArray(season.jury_votes)}<p>{season.jury_votes.filter((vote) => vote.target === finalist).length} jury votes</p>{/if}
        </article>
      {/each}
    </div></section>
  {/if}
</section>

<style>
  .season-page { max-width: 1120px; margin: 0 auto; }
  .back-link { display: inline-block; margin: 1rem 0 2rem; text-decoration: none; font-weight: 600; }
  .eyebrow { font-size: .75rem; letter-spacing: .16em; font-weight: 750; color: var(--snuff-muted); margin: 0 0 .6rem; }
  .season-intro { padding: 1.5rem 0 3rem; }
  h1 { font-size: clamp(3rem, 6vw, 5rem); letter-spacing: -.045em; line-height: 1; margin: 0; }
  .season-title { font-size: 1.5rem; margin: .75rem 0; }
  .season-facts { display: flex; gap: .6rem 1.5rem; flex-wrap: wrap; color: var(--snuff-muted); margin-top: 1.5rem; }
  .season-summary { max-width: 48rem; line-height: 1.6; margin-top: 1.25rem; }
  .cast-section { scroll-margin-top: 6rem; }
  .cast-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.6rem; }
  h2 { margin: 0; font-size: clamp(1.65rem, 3vw, 2.3rem); letter-spacing: -.035em; }
  .count { display: inline-block; vertical-align: middle; font-size: .9rem; margin-left: .8rem; padding: .25rem .6rem; border-radius: 999px; background: var(--snuff-surface); color: var(--snuff-muted); letter-spacing: 0; }
  .cast-toolbar, .toolbar-actions { display: flex; align-items: center; gap: .75rem; }
  .cast-toolbar { justify-content: space-between; }
  .search { display: flex; align-items: center; gap: .65rem; padding: .7rem 1rem; border: 1px solid var(--snuff-border); border-radius: .7rem; max-width: 24rem; flex: 1; color: var(--snuff-muted); background: var(--snuff-card); }
  .search input { width: 100%; min-width: 0; border: 0; background: transparent; color: var(--snuff-text); outline: none; font: inherit; font-size: .95rem; }
  .search:focus-within { outline: 2px solid var(--snuff-accent); outline-offset: 2px; }
  .view-toggle { display: flex; padding: .25rem; background: var(--snuff-surface); border-radius: .65rem; }
  button { cursor: pointer; font: inherit; font-weight: 650; border: 0; border-radius: .45rem; padding: .6rem .9rem; color: var(--snuff-text); }
  .view-toggle button { background: transparent; font-size: .9rem; }
  .view-toggle button.active { background: var(--snuff-card); box-shadow: 0 1px 5px #0000000d; }
  .save-button { display: flex; align-items: center; justify-content: center; gap: .5rem; background: var(--snuff-accent); color: #fff; padding: .8rem 1.1rem; font-size: .9rem; white-space: nowrap; }
  button:disabled { cursor: wait; opacity: .6; }
  button:focus-visible, a:focus-visible, summary:focus-visible { outline: 2px solid var(--snuff-accent); outline-offset: 4px; }
  .spoilers { display: flex; align-items: center; gap: .5rem; font-size: .9rem; cursor: pointer; }
  .export-hint { color: var(--snuff-muted); font-size: .85rem; margin: .9rem 0 1.8rem; line-height: 1.5; }
  .export-ready { padding: 1rem 1.25rem; background: var(--snuff-surface); border: 1px solid var(--snuff-border); border-radius: .75rem; margin: 0 0 1.5rem; font-size: .95rem; }
  .export-ready details { margin-top: .6rem; }
  .export-ready summary { cursor: pointer; }
  .export-preview { display: block; max-width: 100%; max-height: 32rem; margin-top: 1rem; object-fit: contain; object-position: left top; }
  .export-error { padding: 1rem; color: var(--snuff-accent); border: 1px solid currentColor; border-radius: .75rem; }
  .cast-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1.5rem; }
  .cast-card { background: var(--snuff-card); border: 1px solid var(--snuff-border); border-radius: 1rem; overflow: hidden; min-width: 0; }
  .portrait-wrap { position: relative; background: var(--snuff-surface); aspect-ratio: 1.2; overflow: hidden; }
  .portrait { width: 100%; height: 100%; display: block; object-fit: cover; object-position: center 25%; }
  .photo-fallback { width: 100%; height: 100%; display: grid; place-content: center; text-align: center; gap: .5rem; color: var(--snuff-muted); }
  .photo-fallback span { font-size: 3rem; }
  .person-content { padding: 1.2rem; min-width: 0; }
  .person-heading { display: flex; gap: .6rem; justify-content: space-between; align-items: start; }
  h3 { font-size: 1.3rem; line-height: 1.2; letter-spacing: -.02em; margin: 0; overflow-wrap: anywhere; }
  .age { color: var(--snuff-muted); font-size: .9rem; border: 1px solid var(--snuff-border); border-radius: 50%; min-width: 2rem; height: 2rem; display: grid; place-content: center; flex-shrink: 0; }
  .occupation { margin: .5rem 0 0; font-size: .98rem; font-weight: 550; line-height: 1.4; }
  .hometown { color: var(--snuff-muted); font-size: .88rem; margin: .35rem 0 0; line-height: 1.45; }
  .cast-details { display: grid; gap: 1.25rem; }
  .cast-details .cast-card { display: grid; grid-template-columns: 240px minmax(0, 1fr); }
  .cast-details .portrait-wrap { aspect-ratio: auto; min-height: 250px; height: 100%; }
  .cast-details .person-content { padding: 1.6rem; }
  .cast-details h3 { font-size: 1.6rem; }
  .person-facts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; margin: 1.25rem 0 0; }
  dt, .bio h4 { color: var(--snuff-muted); font-size: .75rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; margin: 0 0 .3rem; }
  dd { margin: 0; line-height: 1.4; }
  .bio { margin-top: 1.2rem; }
  .bio p { margin: 0; line-height: 1.6; }
  .result-badge { position: absolute; bottom: .65rem; left: .65rem; background: #173b2f; color: #fff; border-radius: .35rem; padding: .4rem .6rem; font-size: .8rem; }
  .photo-credit { margin: 1.3rem 0 0; color: var(--snuff-muted); font-size: .78rem; line-height: 1.5; }
  .photo-credit a { color: inherit; }
  .empty-state { padding: 3rem 1rem; text-align: center; border: 1px dashed var(--snuff-border); border-radius: 1rem; }
  .episodes-section, .finalists { margin-top: 4rem; }
  .episode-list { display: grid; gap: .8rem; margin-top: 1.5rem; }
  .episode-card { border: 1px solid var(--snuff-border); border-radius: .75rem; display: flex; align-items: center; gap: 1rem; padding: 1.25rem; }
  .episode-number { font-size: .85rem; color: var(--snuff-muted); font-weight: 700; }
  .episode-card h3 { font-size: 1.1rem; }
  .episode-card p { color: var(--snuff-muted); font-size: .9rem; margin: .3rem 0 0; }
  .episode-card a { margin-left: auto; font-size: .9rem; }
  .finalist-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem; }
  .finalist-card { border: 1px solid var(--snuff-border); padding: 1.25rem; border-radius: .75rem; }
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
  @media (max-width: 700px) {
    .cast-toolbar { flex-direction: column; align-items: stretch; }
    .search { max-width: none; }
    .toolbar-actions { justify-content: space-between; }
    .cast-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .8rem; }
    .person-content { padding: .8rem; }
    .person-heading { gap: .3rem; }
    h3 { font-size: 1.05rem; }
    .age { font-size: .75rem; min-width: 1.6rem; height: 1.6rem; }
    .occupation { font-size: .85rem; }
    .hometown { font-size: .78rem; }
    .cast-details .cast-card { grid-template-columns: 1fr; }
    .cast-details .portrait-wrap { aspect-ratio: 1.5; min-height: 0; }
    .cast-details .person-content { padding: 1.25rem; }
    .episode-card { flex-wrap: wrap; }
  }
</style>
