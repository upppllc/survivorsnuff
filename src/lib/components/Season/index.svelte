<script>
  import { Button, Checkbox, Dropdown, TextInput } from "sveltekit-ui"
  import { untrack } from "svelte"
  import { afterNavigate } from "$app/navigation"

  let { manager, featured = false } = $props()
  afterNavigate(() => manager.after_prediction_navigation())
  $effect(() => {
    const active_manager = manager
    untrack(() => active_manager.initialize_prediction_url())
    return () => active_manager.dispose()
  })
</script>

<section class="season-page" style:--portrait-position={manager.season_prepped.portrait_position} style:--portrait-aspect-ratio={manager.season_prepped.portrait_aspect_ratio}>
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
        <h2 id="cast-heading">{manager.is_prediction_mode ? "My elimination prediction" : "Meet the castaways"}<span class="count">{manager.castaways_prepped.length}</span></h2>
      </div>
    </div>
    <div class="cast-toolbar">
      <div class="cast-mode" role="group" aria-label="Cast guide mode">
        <Button manager={manager.cast_guide_button_manager} />
        <Button manager={manager.prediction_button_manager} />
      </div>
      <div class="grid-options" role="group" aria-label="Grid Width">
        <Dropdown manager={manager.grid_width_dropdown_manager} />
      </div>
      <div class="print-fit"><Checkbox manager={manager.fit_letter_checkbox_manager} /><label for={manager.fit_letter_checkbox_manager.id}>Fit to 8.5 × 11 paper</label></div>
      {#if manager.is_prediction_mode}
        <div class="author-input"><TextInput manager={manager.author_name_text_input_manager} /></div>
      {/if}
      <div class="spoilers"><Checkbox manager={manager.show_spoilers_checkbox_manager} /><label for={manager.show_spoilers_checkbox_manager.id}>{manager.is_prediction_mode ? "Show actual placements (spoilers)" : "Show results & spoilers"}</label></div>
      {#if manager.is_show_spoilers || manager.is_show_actual_placements}
        <div class="sort-options" role="group" aria-label="Sort by"><Dropdown manager={manager.sort_dropdown_manager} /></div>
      {/if}
      <div class="toolbar-preview"><Button manager={manager.preview_image_button_manager} /></div>
    </div>
    <p class="export-hint">{manager.export_hint}{#if manager.is_prediction_mode}{" "}#1 is your predicted winner. #{manager.castaways_prepped.length} is your predicted first out. {manager.can_edit_prediction ? "Use Up and Down buttons or drag and drop to reorder positions." : "Choose My prediction under Sort by to edit your picks."}{/if}</p>
    {#if manager.results_hint}<p class="placements-hint">{manager.results_hint}</p>{/if}
    <p class="prediction-announcement" role="status" aria-live="polite" aria-atomic="true">{manager.prediction_announcement}</p>
    <div aria-live="polite">
      {#if manager.spoilers_loading}<p class="export-hint" role="status">Loading spoilers… You can turn the option off to keep them hidden.</p>{/if}
      {#if manager.export_error}<p class="export-error" role="alert">{manager.export_error} Try creating the preview again.</p>{/if}
      {#if manager.saved_image}
        <section class="export-ready" aria-label={manager.saved_image.is_prediction ? "Prediction image preview" : "Cast sheet preview"}>
          <div class="export-header">
            <div class="export-actions">
              {#if manager.saved_image.share_file}<Button manager={manager.share_photo_button_manager} />{/if}
              <Button manager={manager.save_png_button_manager} />
              <Button manager={manager.print_image_button_manager} />
            </div>
            <div class="export-close"><Button manager={manager.close_preview_button_manager} /></div>
          </div>
          {#if manager.share_error}<p class="export-error" role="alert">{manager.share_error}</p>{/if}
          {#if manager.print_error}<p class="export-error" role="alert">{manager.print_error}</p>{/if}
          <!-- svelte-ignore a11y_no_noninteractive_tabindex (The scrollable image region needs keyboard focus for scrolling.) -->
          <div id={manager.preview_id} class="export-preview-scroll" role="region" aria-label="Scrollable cast sheet image" tabindex="0">
            <img src={manager.saved_image.url} alt={manager.saved_image.alt} width={manager.saved_image.width} height={manager.saved_image.height} class="export-preview" />
          </div>
        </section>
      {/if}
    </div>

    {#if manager.display_castaways.length}
      <div class="cast-grid">
        {#each manager.display_castaways as person (person.id ?? person.name)}
          <article class="cast-card" class:prediction-card={manager.can_edit_prediction}
            class:is-dragging={manager.is_prediction_mode && person.prediction_key === manager.dragged_prediction_key}
            class:is-drop-target={manager.is_prediction_mode && person.prediction_key === manager.drop_prediction_key && person.prediction_key !== manager.dragged_prediction_key}
            draggable={manager.can_edit_prediction}
            ondragstart={(event) => manager.start_prediction_drag(event, person)}
            ondragover={(event) => manager.over_prediction_drag(event, person)}
            ondrop={(event) => manager.drop_prediction(event, person)}
            ondragend={manager.end_prediction_drag}>
            <div class="portrait-wrap">
              {#if person.photo_failed}
                <div class="photo-fallback"><span>{person.initials}</span><small>Photo unavailable</small></div>
              {:else}
                <img class="portrait" src={person.image_src} alt={person.name} draggable="false" loading="lazy" decoding="async" onerror={person.handle_photo_error} />
              {/if}
              {#if manager.is_prediction_mode}
                <span class="prediction-badge" aria-label={`Prediction number ${person.prediction_rank}`}>{person.prediction_rank}</span>
                {#if manager.is_show_actual_placements && person.actual_placement}
                  <span class="actual-placement-badge" aria-label={`Actual finishing place ${person.actual_placement}`}>{person.actual_placement}</span>
                {/if}
              {/if}
              {#if manager.is_show_spoilers && person.result_label}
                <span class="result-badge">{person.result_label}</span>
              {/if}
            </div>
            <div class="person-content">
              {#if manager.is_prediction_mode}<p class="prediction-position">{person.prediction_label}</p>{/if}
              <div class="person-heading"><h3>{person.name}</h3>{#if person.age}<span class="age" aria-label={person.age_label}>{person.age}</span>{/if}</div>
              {#if person.occupation}<p class="occupation">{person.occupation}</p>{/if}
              {#if person.facts.length}
                <dl class="person-facts">
                  {#each person.facts as fact}<div><dt>{fact.label}</dt><dd>{fact.value}</dd></div>{/each}
                </dl>
              {/if}
              {#each person.bios as bio}<div class="bio"><h4>{bio.label}</h4><p>{bio.value}</p></div>{/each}
              {#if manager.can_edit_prediction}
                <div class="prediction-controls" role="group" aria-label={`Change ${person.name}'s prediction rank`}>
                  <Button manager={person.move_up_button_manager} />
                  <Button manager={person.move_down_button_manager} />
                </div>
              {/if}
            </div>
          </article>
        {/each}
      </div>
    {:else}
      <div class="empty-state"><h3>The cast is still under wraps.</h3><p>Check back for cast announcements and photos.</p></div>
    {/if}
    {#if manager.can_edit_prediction}
      <div class="prediction-reset"><Button manager={manager.reset_prediction_button_manager} /></div>
    {/if}
    {#if manager.season_prepped.source_url}
      <p class="photo-credit">
        {manager.season_prepped.photo_source_url ? "Cast information:" : "Cast information and photos:"}
        <a href={manager.season_prepped.source_url} target="_blank" rel="noopener noreferrer">CBS / Paramount</a>.
        {#if manager.season_prepped.photo_source_url}
          Photos: <a href={manager.season_prepped.photo_source_url} target="_blank" rel="noopener noreferrer">{manager.season_prepped.photo_credit}</a>.
        {/if}
        Ages at cast announcement.
      </p>
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
  .season-page { min-width: 0; }
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
  .cast-toolbar { display: flex; align-items: flex-end; flex-wrap: wrap; gap: 1.6rem 2.4rem; }
  .toolbar-preview { display: flex; justify-content: flex-end; margin-left: auto; }
  .author-input { width: min(100%, 24rem); }
  .grid-options { width: 12rem; flex-shrink: 0; }
  .sort-options { width: 17rem; flex-shrink: 0; }
  .cast-mode { display: flex; gap: 0.56rem; }
  .prediction-announcement { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  a:focus-visible, .export-preview-scroll:focus-visible { outline: 2px solid var(--snuff-accent); outline-offset: 4px; }
  .spoilers, .print-fit { display: flex; align-items: center; gap: 0.8rem; min-height: 3.4rem; font-size: 1.44rem; }
  .spoilers label, .print-fit label { cursor: pointer; font-size: inherit; color: var(--snuff-text); }
  .export-hint { color: var(--snuff-muted); font-size: 1.36rem; margin: 1.44rem 0 2.88rem; line-height: 1.5; }
  .placements-hint { color: var(--snuff-muted); font-size: 1.36rem; line-height: 1.5; margin: -1.6rem 0 2.88rem; }
  .export-ready { padding: 1.6rem 2rem; background: var(--snuff-surface); border: 1px solid var(--snuff-border); border-radius: 1.2rem; margin: 0 0 2.4rem; font-size: 1.52rem; }
  .export-header { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: start; gap: 1.2rem; margin-bottom: 1.6rem; }
  .export-actions { display: flex; flex-wrap: wrap; gap: 1.2rem; }
  .export-close { justify-self: end; }
  .export-preview-scroll { max-height: min(70vh, 76rem); overflow: auto; overscroll-behavior: contain; border: 1px solid var(--snuff-border); border-radius: 0.6rem; background: var(--snuff-card); scroll-margin-top: 2rem; }
  .export-preview { display: block; width: 100%; height: auto; -webkit-touch-callout: default; user-select: auto; }
  .export-error { padding: 1.6rem; color: var(--snuff-accent); border: 1px solid currentColor; border-radius: 1.2rem; }
  .cast-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 23rem), 1fr)); gap: 2.4rem; }
  .cast-card { border-bottom: 1px solid var(--snuff-border); padding-bottom: 2rem; min-width: 0; }
  .prediction-card { cursor: grab; }
  .prediction-card:active { cursor: grabbing; }
  .is-dragging { opacity: .45; }
  .is-drop-target { outline: 2px solid var(--snuff-accent); outline-offset: 0.6rem; border-radius: 1.2rem; }
  .portrait-wrap { position: relative; background: var(--snuff-surface); aspect-ratio: var(--portrait-aspect-ratio, 1.2); border-radius: 1.2rem; overflow: hidden; }
  .portrait { width: 100%; height: 100%; display: block; object-fit: cover; object-position: var(--portrait-position, center 25%); }
  .photo-fallback { width: 100%; height: 100%; display: grid; place-content: center; text-align: center; gap: 0.8rem; color: var(--snuff-muted); }
  .photo-fallback span { font-size: 4.8rem; }
  .person-content { padding-top: 1.92rem; min-width: 0; }
  .person-heading { display: flex; gap: 0.96rem; justify-content: space-between; align-items: start; }
  h3 { font-size: 2.08rem; line-height: 1.2; letter-spacing: -.02em; margin: 0; overflow-wrap: anywhere; }
  .age { color: var(--snuff-muted); font-size: 1.44rem; border: 1px solid var(--snuff-border); border-radius: 50%; min-width: 3.2rem; height: 3.2rem; display: grid; place-content: center; flex-shrink: 0; }
  .occupation { margin: 0.8rem 0 0; font-size: 1.568rem; font-weight: 550; line-height: 1.4; }
  .person-facts { display: grid; grid-template-columns: minmax(0, 1fr); gap: 1.2rem; margin: 1.6rem 0 0; }
  dt, .bio h4 { color: var(--snuff-muted); font-size: 1.2rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; margin: 0 0 0.48rem; }
  dd { margin: 0; font-size: 1.408rem; line-height: 1.45; overflow-wrap: anywhere; }
  .bio { margin-top: 1.6rem; }
  .bio p { margin: 0; font-size: 1.36rem; line-height: 1.6; overflow-wrap: anywhere; }
  .result-badge { position: absolute; bottom: 1.04rem; left: 1.04rem; background: #173b2f; color: #fff; border-radius: 0.56rem; padding: 0.64rem 0.96rem; font-size: 1.28rem; }
  .prediction-badge { position: absolute; top: 0.96rem; left: 0.96rem; width: 4rem; height: 4rem; display: grid; place-items: center; background: #fff; color: #173e37; border-radius: 0.8rem; box-shadow: 0 2px 10px #0003; font-size: 2.08rem; font-weight: 750; font-variant-numeric: tabular-nums; }
  .actual-placement-badge { position: absolute; top: 0.96rem; right: 0.96rem; width: 4rem; height: 4rem; display: grid; place-items: center; background: #b42318; color: #fff; border-radius: 0.8rem; box-shadow: 0 2px 10px #0003; font-size: 2.08rem; font-weight: 750; font-variant-numeric: tabular-nums; }
  .prediction-position { margin: 0 0 0.8rem; color: var(--snuff-muted); font-size: 1.28rem; font-weight: 650; }
  .prediction-controls { display: flex; flex-wrap: wrap; gap: 0.64rem; margin-top: 1.6rem; }
  .prediction-reset { display: flex; justify-content: flex-end; margin-top: 3.2rem; padding: 1.6rem 0; }
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
    .export-header { grid-template-columns: minmax(0, 1fr); }
    .export-close { order: -1; }
    .cast-toolbar { gap: 1.2rem 1.6rem; }
    .cast-mode, .toolbar-preview { flex-basis: 100%; }
    .cast-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.28rem; }
    .author-input { flex: 1; min-width: 16rem; }
    .person-content { padding-top: 1.28rem; }
    .person-heading { gap: 0.48rem; }
    h3 { font-size: 1.68rem; }
    .age { font-size: 1.2rem; min-width: 2.56rem; height: 2.56rem; }
    .occupation { font-size: 1.36rem; }
    dd { font-size: 1.248rem; }
    .episode-card { flex-wrap: wrap; }
  }
</style>
