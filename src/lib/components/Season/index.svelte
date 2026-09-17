<script>
  import { Button, Checkbox, TextInput } from "sveltekit-ui"

  let { manager, featured = false } = $props()
  $effect(() => {
    const active_manager = manager
    return () => active_manager.dispose()
  })
</script>

<section class="season-page">
  {#if !featured}
    <div class="back-link"><Button manager={manager.view_seasons_button_manager} /></div>
    <header class="season-intro">
      <p class="eyebrow">THE CAST GUIDE</p>
      <h1>Survivor {manager.season_prepped.season_number}</h1>
      {#if manager.season_prepped.display_title}<p class="season-title">{manager.season_prepped.display_title}</p>{/if}
      <div class="season-facts">
        {#each manager.season_facts as fact}<span>{fact}</span>{/each}
      </div>
      {#if manager.season_prepped.display_summary}<p class="season-summary">{manager.season_prepped.display_summary}</p>{/if}
    </header>
  {/if}

  <section id="castaways" class="cast-section" aria-labelledby="cast-heading">
    <div class="cast-heading">
      <div>
        <p class="eyebrow">{featured ? `SURVIVOR ${manager.season_prepped.season_number}` : "PUT A FACE TO THE NAME"}</p>
        <h2 id="cast-heading">Meet the castaways<span class="count">{manager.castaways_prepped.length}</span></h2>
      </div>
      <div class="spoilers"><Checkbox manager={manager.show_spoilers_checkbox_manager} /><label for={manager.show_spoilers_checkbox_manager.id}>Show results & spoilers</label></div>
    </div>
    <div class="cast-toolbar">
      <div class="search"><TextInput manager={manager.search_text_input_manager} /></div>
      <div class="toolbar-actions">
        <div class="view-toggle" role="group" aria-label="Castaway layout">
          <Button manager={manager.grid_button_manager} />
          <Button manager={manager.details_button_manager} />
        </div>
        <Button manager={manager.preview_image_button_manager} />
      </div>
    </div>
    <p class="export-hint">{manager.export_hint}</p>
    <div aria-live="polite">
      {#if manager.spoilers_loading}<p class="export-hint" role="status">Loading spoilers… You can turn the option off to keep them hidden.</p>{/if}
      {#if manager.export_error}<p class="export-error" role="alert">{manager.export_error} Try creating the preview again.</p>{/if}
      {#if manager.saved_image}
        <section class="export-ready" aria-label="Cast sheet preview">
          <div class="export-header">
            <div><h3>Cast sheet preview</h3><p class="preview-description">{manager.saved_image.description}</p></div>
            <Button manager={manager.close_preview_button_manager} />
          </div>
          <p class="preview-instructions">Scroll to review the image, or zoom in for a closer look.{manager.saved_image.includes_spoilers ? " This image includes spoilers." : ""}</p>
          {#if manager.saved_image.share_file}
            <p class="preview-instructions">On iPhone, tap Save or share photo, then choose Save Image to add it to Photos.</p>
          {:else}
            <p class="preview-instructions">On a phone, touch and hold the image for photo options. Download PNG saves a file.</p>
          {/if}
          <div class="export-actions">
            {#if manager.saved_image.share_file}<Button manager={manager.share_photo_button_manager} />{/if}
            <Button manager={manager.save_png_button_manager} />
            <Button manager={manager.zoom_preview_button_manager} />
          </div>
          {#if manager.share_error}<p class="export-error" role="alert">{manager.share_error}</p>{/if}
          <!-- svelte-ignore a11y_no_noninteractive_tabindex (The scrollable image region needs keyboard focus for scrolling.) -->
          <div id={manager.preview_id} class="export-preview-scroll" role="region" aria-label="Scrollable cast sheet image" tabindex="0">
            <img src={manager.saved_image.url} alt={manager.saved_image.alt} width={manager.saved_image.width} height={manager.saved_image.height} class="export-preview" class:preview-zoomed={manager.is_preview_zoomed} />
          </div>
        </section>
      {/if}
    </div>

    {#if manager.filtered_castaways.length}
      <div class:cast-grid={manager.castaway_view === "grid"} class:cast-details={manager.castaway_view === "details"}>
        {#each manager.filtered_castaways as person (person.id ?? person.name)}
          <article class="cast-card">
            <div class="portrait-wrap">
              {#if person.photo_failed}
                <div class="photo-fallback"><span>{person.initials}</span><small>Photo unavailable</small></div>
              {:else}
                <img class="portrait" src={person.image_src} alt={person.name} loading="lazy" decoding="async" onerror={person.handle_photo_error} />
              {/if}
              {#if manager.is_show_spoilers && person.result_label}
                <span class="result-badge">{person.result_label}</span>
              {/if}
            </div>
            <div class="person-content">
              <div class="person-heading"><h3>{person.name}</h3>{#if person.age}<span class="age" aria-label={person.age_label}>{person.age}</span>{/if}</div>
              {#if person.occupation}<p class="occupation">{person.occupation}</p>{/if}
              {#if manager.castaway_view === "grid"}
                {#if person.hometown}<p class="hometown">{person.hometown}</p>{/if}
                {#if person.preseason_summary}<p class="preseason-summary">{person.preseason_summary}</p>{/if}
              {:else}
                <dl class="person-facts">
                  {#each person.facts as fact}<div><dt>{fact.label}</dt><dd>{fact.value}</dd></div>{/each}
                </dl>
                {#each person.bios as bio}<div class="bio"><h4>{bio.label}</h4><p>{bio.value}</p></div>{/each}
              {/if}
            </div>
          </article>
        {/each}
      </div>
    {:else}
      <div class="empty-state"><h3>{manager.castaways_prepped.length ? "No castaways match that search." : "The cast is still under wraps."}</h3><p>{manager.castaways_prepped.length ? "Try a different name, hometown, or occupation." : "Check back for cast announcements and photos."}</p>{#if manager.search}<Button manager={manager.clear_search_button_manager} />{/if}</div>
    {/if}
    {#if manager.season_prepped.source_url}
      <p class="photo-credit">Cast information and photos: <a href={manager.season_prepped.source_url} target="_blank" rel="noopener noreferrer">CBS / Paramount</a>. Ages at cast announcement.</p>
    {/if}
  </section>

  {#if manager.episodes_prepped.length}
    <section class="episodes-section" aria-labelledby="episodes-heading">
      <p class="eyebrow">ON THE ISLAND</p>
      <h2 id="episodes-heading">{manager.is_upcoming ? "Premiere night" : "Episodes"}</h2>
      <div class="episode-list">
        {#each manager.episodes_prepped as episode}
          <div class="episode-card">
            <span class="episode-number">{episode.number_label}</span>
            <div><h3>{episode.display_title}</h3>{#if episode.air_date}<p>{episode.air_date}</p>{/if}</div>
            <div class="episode-action"><Button manager={episode.details_button_manager} /></div>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  {#if manager.is_show_spoilers && manager.finalists_prepped.length}
    <section class="finalists"><h2>Finalists</h2><div class="finalist-grid">
      {#each manager.finalists_prepped as finalist}
        <article class="finalist-card"><h3>{finalist.name}</h3>
          {#if finalist.winner_label}<p>{finalist.winner_label}</p>{/if}
          {#if finalist.jury_votes_label}<p>{finalist.jury_votes_label}</p>{/if}
        </article>
      {/each}
    </div></section>
  {/if}
</section>

<style>
  .season-page { max-width: 1120px; margin: 0 auto; }
  h1, h2, h3, h4 { font-family: inherit; color: var(--snuff-text); }
  .back-link { display: inline-block; margin: 1.6rem 0 3.2rem; text-decoration: none; font-weight: 600; }
  .eyebrow { font-size: 1.2rem; letter-spacing: .16em; font-weight: 750; color: var(--snuff-muted); margin: 0 0 0.96rem; }
  .season-intro { padding: 2.4rem 0 4.8rem; }
  h1 { font-size: clamp(4.8rem, 6vw, 8rem); letter-spacing: -.045em; line-height: 1; margin: 0; }
  .season-title { font-size: 2.4rem; margin: 1.2rem 0; }
  .season-facts { display: flex; gap: 0.96rem 2.4rem; flex-wrap: wrap; color: var(--snuff-muted); margin-top: 2.4rem; }
  .season-summary { max-width: 76.8rem; line-height: 1.6; margin-top: 2rem; }
  .cast-section { scroll-margin-top: 9.6rem; }
  .cast-heading { display: flex; align-items: center; justify-content: space-between; gap: 1.6rem; flex-wrap: wrap; margin-bottom: 2.56rem; }
  h2 { margin: 0; font-size: clamp(2.64rem, 3vw, 3.68rem); letter-spacing: -.035em; }
  .count { display: inline-block; vertical-align: middle; font-size: 1.44rem; margin-left: 1.28rem; padding: 0.4rem 0.96rem; border-radius: 999px; background: var(--snuff-surface); color: var(--snuff-muted); letter-spacing: 0; }
  .cast-toolbar, .toolbar-actions { display: flex; align-items: center; gap: 1.2rem; }
  .cast-toolbar { justify-content: space-between; }
  .search { max-width: 38.4rem; min-width: 0; flex: 1; }
  .view-toggle { display: flex; gap: 0.56rem; }
  a:focus-visible, .export-preview-scroll:focus-visible { outline: 2px solid var(--snuff-accent); outline-offset: 4px; }
  .spoilers { display: flex; align-items: center; gap: 0.8rem; font-size: 1.44rem; }
  .spoilers label { cursor: pointer; }
  .export-hint { color: var(--snuff-muted); font-size: 1.36rem; margin: 1.44rem 0 2.88rem; line-height: 1.5; }
  .export-ready { padding: 1.6rem 2rem; background: var(--snuff-surface); border: 1px solid var(--snuff-border); border-radius: 1.2rem; margin: 0 0 2.4rem; font-size: 1.52rem; }
  .export-header { display: flex; align-items: start; justify-content: space-between; gap: 1.6rem; flex-wrap: wrap; }
  .preview-description { color: var(--snuff-muted); margin: 0.8rem 0 0; }
  .preview-instructions { margin: 1.2rem 0; }
  .export-actions { display: flex; flex-wrap: wrap; gap: 1.2rem; margin-bottom: 1.6rem; }
  .export-preview-scroll { max-height: min(70vh, 76rem); overflow: auto; overscroll-behavior: contain; border: 1px solid var(--snuff-border); border-radius: 0.6rem; background: var(--snuff-card); scroll-margin-top: 2rem; }
  .export-preview { display: block; width: 100%; height: auto; -webkit-touch-callout: default; user-select: auto; }
  .export-preview.preview-zoomed { width: 160%; min-width: 112rem; max-width: none; }
  .export-error { padding: 1.6rem; color: var(--snuff-accent); border: 1px solid currentColor; border-radius: 1.2rem; }
  .cast-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2.4rem; }
  .cast-card { background: var(--snuff-card); border: 1px solid var(--snuff-border); border-radius: 1.6rem; overflow: hidden; min-width: 0; }
  .portrait-wrap { position: relative; background: var(--snuff-surface); aspect-ratio: 1.2; overflow: hidden; }
  .portrait { width: 100%; height: 100%; display: block; object-fit: cover; object-position: center 25%; }
  .photo-fallback { width: 100%; height: 100%; display: grid; place-content: center; text-align: center; gap: 0.8rem; color: var(--snuff-muted); }
  .photo-fallback span { font-size: 4.8rem; }
  .person-content { padding: 1.92rem; min-width: 0; }
  .person-heading { display: flex; gap: 0.96rem; justify-content: space-between; align-items: start; }
  h3 { font-size: 2.08rem; line-height: 1.2; letter-spacing: -.02em; margin: 0; overflow-wrap: anywhere; }
  .age { color: var(--snuff-muted); font-size: 1.44rem; border: 1px solid var(--snuff-border); border-radius: 50%; min-width: 3.2rem; height: 3.2rem; display: grid; place-content: center; flex-shrink: 0; }
  .occupation { margin: 0.8rem 0 0; font-size: 1.568rem; font-weight: 550; line-height: 1.4; }
  .hometown { color: var(--snuff-muted); font-size: 1.408rem; margin: 0.56rem 0 0; line-height: 1.45; }
  .preseason-summary { color: var(--snuff-muted); font-size: 1.36rem; margin: 0.96rem 0 0; line-height: 1.5; }
  .cast-details { display: grid; gap: 2rem; }
  .cast-details .cast-card { display: grid; grid-template-columns: 240px minmax(0, 1fr); }
  .cast-details .portrait-wrap { aspect-ratio: auto; min-height: 250px; height: 100%; }
  .cast-details .person-content { padding: 2.56rem; }
  .cast-details h3 { font-size: 2.56rem; }
  .person-facts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.6rem; margin: 2rem 0 0; }
  dt, .bio h4 { color: var(--snuff-muted); font-size: 1.2rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; margin: 0 0 0.48rem; }
  dd { margin: 0; line-height: 1.4; }
  .bio { margin-top: 1.92rem; }
  .bio p { margin: 0; line-height: 1.6; }
  .result-badge { position: absolute; bottom: 1.04rem; left: 1.04rem; background: #173b2f; color: #fff; border-radius: 0.56rem; padding: 0.64rem 0.96rem; font-size: 1.28rem; }
  .photo-credit { margin: 2.08rem 0 0; color: var(--snuff-muted); font-size: 1.248rem; line-height: 1.5; }
  .photo-credit a { color: inherit; }
  .empty-state { padding: 4.8rem 1.6rem; text-align: center; border: 1px dashed var(--snuff-border); border-radius: 1.6rem; }
  .episodes-section, .finalists { margin-top: 6.4rem; }
  .episode-list { display: grid; gap: 1.28rem; margin-top: 2.4rem; }
  .episode-card { border: 1px solid var(--snuff-border); border-radius: 1.2rem; display: flex; align-items: center; gap: 1.6rem; padding: 2rem; }
  .episode-number { font-size: 1.36rem; color: var(--snuff-muted); font-weight: 700; }
  .episode-card h3 { font-size: 1.76rem; }
  .episode-card p { color: var(--snuff-muted); font-size: 1.44rem; margin: 0.48rem 0 0; }
  .episode-action { margin-left: auto; }
  .finalist-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.6rem; margin-top: 1.6rem; }
  .finalist-card { border: 1px solid var(--snuff-border); padding: 2rem; border-radius: 1.2rem; }
  @media (max-width: 700px) {
    .cast-toolbar { flex-direction: column; align-items: stretch; }
    .search { max-width: none; }
    .toolbar-actions { justify-content: space-between; }
    .cast-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.28rem; }
    .person-content { padding: 1.28rem; }
    .person-heading { gap: 0.48rem; }
    h3 { font-size: 1.68rem; }
    .age { font-size: 1.2rem; min-width: 2.56rem; height: 2.56rem; }
    .occupation { font-size: 1.36rem; }
    .hometown { font-size: 1.248rem; }
    .cast-details .cast-card { grid-template-columns: 1fr; }
    .cast-details .portrait-wrap { aspect-ratio: 1.5; min-height: 0; }
    .cast-details .person-content { padding: 2rem; }
    .episode-card { flex-wrap: wrap; }
  }
</style>
