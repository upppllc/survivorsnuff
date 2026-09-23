import { create_button_manager, create_checkbox_manager, create_dropdown_manager, create_text_input_manager } from "sveltekit-ui"
import { tick, untrack } from "svelte"
import { replaceState } from "$app/navigation"
import { page } from "$app/state"
import { castawayImageSrc, castawayProfileDetails, sortCastawaysAlphabetically } from "$lib/castaways.js"
import { formatSeasonDate, seasonDateTimestamp } from "$lib/season-dates.js"
import { prepareCastawayShareFile, shareCastawayFile } from "$lib/client/castaway-share.js"
import { predictionCastawayKey, orderPredictionCastaways, movePredictionCastaway, movePredictionCastawayTo } from "$lib/predictions.js"
import { readPredictionUrl, writePredictionUrl } from "$lib/prediction-url.js"
import { buildActualPlacements, actualPlacementFor } from "$lib/prediction-results.js"

export function create_season_manager(config) {
  let grid_columns = $state(7)
  let is_prediction_mode = $state(false)
  let prediction_order = $state([])
  let prediction_announcement = $state("")
  let dragged_prediction_key = $state(null)
  let drop_prediction_key = $state(null)
  const prediction_controls = new Map()
  let is_generating = $state(false)
  let export_error = $state("")
  let saved_image = $state(null)
  let is_sharing = $state(false)
  let share_error = $state("")
  let failed_photos = $state({})
  let full_data = $state.raw(null)
  let spoilers_loading = $state(false)
  let spoilers_error = $state("")
  let disposed = false
  let export_revision = 0
  let spoilers_revision = 0
  let spoilers_request = null
  let prediction_url_initialized = false
  let prediction_url_pathname = ""
  let is_restoring_prediction_url = false
  const preview_id = `cast-sheet-preview-${config?.season?.season_number}`

  const author_name_text_input_manager = create_text_input_manager({
    name: "cast-sheet-author",
    val: "",
    label: "Your name (optional)",
    aria_label: "Your name (optional)",
    placeholder: "Name on your prediction",
    autocomplete: "name",
    max_length: 100,
    on_change: () => {
      invalidate_saved_image()
      if (!is_restoring_prediction_url) persist_prediction_url()
    },
  })
  const author_name = $derived(String(author_name_text_input_manager.val ?? "").trim().replace(/\s+/g, " "))
  const show_spoilers_checkbox_manager = create_checkbox_manager({
    val: false,
    name: "show-season-results",
    aria_label: () => is_prediction_mode ? "Show actual placements (spoilers)" : "Show results & spoilers",
    error_message: () => spoilers_error,
    on_change: load_spoilers,
  })
  const is_show_spoilers = $derived(!is_prediction_mode && show_spoilers_checkbox_manager.val_bool)
  const is_show_actual_placements = $derived(is_prediction_mode && show_spoilers_checkbox_manager.val_bool)
  const active_data = $derived(is_show_spoilers && full_data ? full_data : config)
  const season = $derived(active_data?.season ?? {})
  const is_upcoming = $derived(seasonDateTimestamp(season.first_air_time) > Date.now())
  const season_prepped = $derived({
    ...season,
    portrait_position: Number(season.season_number) === 51 ? "center top" : "center 25%",
    portrait_aspect_ratio: Number(season.season_number) === 51 ? "4 / 5" : null,
    display_title: season.title && season.title !== `Survivor ${season.season_number}` ? season.title : "",
    display_summary: is_show_spoilers || season.summary_spoiler_free === true ? season.twist_summary : "",
  })

  const castaways_prepped = $derived(sortCastawaysAlphabetically(active_data?.castaways ?? []).map((person) => {
    const photo_key = `photo:${person.id ?? person.name}`
    const profile = castawayProfileDetails(person, is_show_spoilers)
    return {
      ...person,
      image_src: castawayImageSrc(person, season.season_number),
      initials: String(person.name ?? "").split(" ").map((part) => part[0]).slice(0, 2).join(""),
      age_label: `Age ${person.age}`,
      result_label: Number.isInteger(person.result_order)
        ? `${person.result_order === 1 ? "Winner" : `Finished #${person.result_order}`}${person.is_on_jury ? " · Jury" : ""}`
        : "",
      facts: [
        { label: "Hometown", value: person.hometown },
        { label: "Lives in", value: person.current_residence },
        { label: "Tribe", value: profile.tribe },
        { label: "Three words", value: Array.isArray(profile.traits) ? profile.traits.join(", ") : profile.traits },
      ].filter((fact) => fact.value),
      bios: profile.bios,
      get photo_failed() { return Boolean(failed_photos[photo_key]) },
      handle_photo_error: () => { failed_photos[photo_key] = true },
    }
  }))
  const ordered_prediction_castaways = $derived(orderPredictionCastaways(castaways_prepped, prediction_order))
  const actual_placements = $derived(is_show_actual_placements && full_data
    ? buildActualPlacements(castaways_prepped, full_data.castaways) : {})
  const prediction_castaways = $derived.by(() => {
    const people = ordered_prediction_castaways
    const placements = actual_placements
    return untrack(() => people.map((person, index) => ({
      ...person,
      prediction_key: predictionCastawayKey(person),
      prediction_rank: index + 1,
      actual_placement: actualPlacementFor(person, placements, people.length),
      prediction_label: index === 0 ? "Predicted winner" : index === people.length - 1 ? "Predicted first out" : `Predicted #${index + 1}`,
      get photo_failed() { return person.photo_failed },
      ...get_prediction_controls(person),
    })))
  })
  const display_castaways = $derived(is_prediction_mode ? prediction_castaways : castaways_prepped)
  const season_facts = $derived([
    season.location,
    `${castaways_prepped.length || season.contestant_count || 0} castaways`,
    formatSeasonDate(season.first_air_time) ? `${is_upcoming ? "Premieres" : "Premiered"} ${formatSeasonDate(season.first_air_time)}` : "",
  ].filter(Boolean))
  const episodes_prepped = $derived.by(() => {
    const episodes = active_data?.episodes ?? []
    const season_number = season.season_number
    const reveal_titles = is_show_spoilers
    return untrack(() => [...episodes]
    .sort((a, b) => a.episode_number - b.episode_number)
    .map((episode) => ({
      ...episode,
      number_label: `E${String(episode.episode_number).padStart(2, "0")}`,
      display_title: reveal_titles && episode.title ? episode.title : `Episode ${episode.episode_number}`,
      air_date: formatSeasonDate(episode.air_time),
      details_button_manager: create_button_manager({
        type: "plain",
        text: "Episode details",
        aria_label: `Episode ${episode.episode_number} details`,
        href: `/seasons/${season_number}/${episode.episode_number}`,
        support_icon: "arrow_tailed",
        is_compressed: true,
      }),
    })))
  })
  const finalists_prepped = $derived((is_show_spoilers && Array.isArray(season.finalists) ? season.finalists : []).map((name) => ({
    name,
    winner_label: name === season.winner
      ? `Winner${season.winner_prize_usd ? ` · $${Number(season.winner_prize_usd).toLocaleString()}` : ""}`
      : "",
    jury_votes_label: Array.isArray(season.jury_votes)
      ? `${season.jury_votes.filter((vote) => vote.target === name).length} jury votes`
      : "",
  })))

  const view_seasons_button_manager = create_button_manager({
    type: "plain",
    text: "All seasons",
    href: "/seasons",
    support_icon: "arrow_tailed",
    icon_pos: "left",
    icon_deg: 180,
    is_compressed: true,
  })
  const cast_guide_button_manager = create_button_manager({
    type: "outlined",
    text: "Cast guide",
    aria_label: () => is_prediction_mode ? "Cast guide" : "Cast guide, selected",
    selected_type: () => is_prediction_mode ? null : "selected",
    is_compressed: true,
    on_click: () => set_prediction_mode(false),
  })
  const prediction_button_manager = create_button_manager({
    type: "outlined",
    text: "My prediction",
    aria_label: () => is_prediction_mode ? "My prediction, selected" : "My prediction",
    selected_type: () => is_prediction_mode ? "selected" : null,
    is_compressed: true,
    on_click: () => set_prediction_mode(true),
  })
  const reset_prediction_button_manager = create_button_manager({
    type: "outlined",
    text: "Reset to alphabetical",
    is_compressed: true,
    on_click: () => {
      prediction_order = []
      prediction_announcement = "Prediction order reset to alphabetical."
      invalidate_saved_image()
      persist_prediction_url()
    },
  })
  const grid_width_dropdown_manager = create_dropdown_manager({
    label: "Grid Width",
    val: 7,
    options: [3, 4, 5, 6, 7, 8].map((columns) => ({ key: columns, name: `${columns} across` })),
    is_button_compressed: true,
    selected_font_size: 1.44,
    font_size: 1.44,
    target_width: 180,
    target_height: 300,
    on_item_click: (option) => {
      // Clicking the selected library option must keep a valid grid width.
      set_grid_columns(option.key)
      grid_width_dropdown_manager.set_val(option.key)
      grid_width_dropdown_manager.popover_manager.close()
    },
  })
  const preview_image_button_manager = create_button_manager({
    text: () => is_generating ? "Creating preview…" : is_prediction_mode ? "Preview prediction" : "Preview image",
    aria_label: () => is_generating ? "Creating image preview" : is_prediction_mode ? "Preview prediction" : "Preview image",
    support_icon: "photo",
    icon_pos: "left",
    is_loading: () => is_generating,
    is_disabled: () => !display_castaways.length || spoilers_loading,
    is_compressed: true,
    is_no_wrap: true,
    on_click: preview_image,
  })
  const share_photo_button_manager = create_button_manager({
    text: "Save or share photo",
    support_icon: "share",
    icon_pos: "left",
    is_loading: () => is_sharing,
    is_disabled: () => !saved_image?.share_file,
    is_compressed: true,
    on_click: share_photo,
  })
  const save_png_button_manager = create_button_manager({
    type: () => saved_image?.share_file ? "outlined" : "primary",
    text: "Download PNG",
    support_icon: "download",
    icon_pos: "left",
    is_disabled: () => !saved_image,
    is_compressed: true,
    on_click: save_png,
  })
  const close_preview_button_manager = create_button_manager({
    type: "outlined",
    text: "Close preview",
    support_icon: "x",
    icon_pos: "left",
    is_compressed: true,
    on_click: () => {
      invalidate_saved_image()
      preview_image_button_manager.focus()
    },
  })
  const grid_description = $derived(`${column_name(grid_columns)}-column grid`)
  const export_hint = $derived(is_prediction_mode
    ? "Your order is saved in this page’s URL, so you can refresh or share the link and maintain your ordering."
    : `Castaways are listed alphabetically by name. Preview the ${grid_description} with full profiles, then save it as a PNG.`)

  function get_prediction_controls(person) {
    const key = predictionCastawayKey(person)
    if (!prediction_controls.has(key)) {
      const make_button = (direction) => create_button_manager({
        type: "outlined",
        text: direction === -1 ? "Up" : "Down",
        aria_label: `Move ${person.name} ${direction === -1 ? "up" : "down"}`,
        support_icon: "arrow_tailed",
        icon_deg: direction === -1 ? -90 : 90,
        icon_pos: "left",
        is_compressed: true,
        min_height: 4.4,
        font_size: 1.36,
        is_disabled: () => {
          const index = ordered_prediction_castaways.findIndex((item) => predictionCastawayKey(item) === key)
          return !is_prediction_mode || index < 0 || index + direction < 0 || index + direction >= ordered_prediction_castaways.length
        },
        on_click: () => move_prediction(key, direction),
      })
      prediction_controls.set(key, {
        move_up_button_manager: make_button(-1),
        move_down_button_manager: make_button(1),
      })
    }
    return prediction_controls.get(key)
  }

  function set_prediction_mode(value) {
    if (disposed || is_prediction_mode === value) return
    // A prediction is an explicit personal order, never a source of actual results.
    set_show_spoilers(false)
    end_prediction_drag()
    is_prediction_mode = value
    prediction_announcement = ""
    invalidate_saved_image()
    persist_prediction_url()
  }

  function start_prediction_drag(event, person) {
    if (disposed || !is_prediction_mode || event.target.closest("button, a, input")) {
      event.preventDefault()
      return
    }
    dragged_prediction_key = predictionCastawayKey(person)
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData("text/plain", dragged_prediction_key)
  }

  function over_prediction_drag(event, person) {
    if (!is_prediction_mode || !dragged_prediction_key) return
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
    drop_prediction_key = predictionCastawayKey(person)
  }

  function drop_prediction(event, person) {
    if (disposed || !is_prediction_mode || !dragged_prediction_key) return
    event.preventDefault()
    const key = dragged_prediction_key
    prediction_order = movePredictionCastawayTo(castaways_prepped, prediction_order, key, predictionCastawayKey(person))
    end_prediction_drag()
    const moved = castaways_prepped.find((candidate) => predictionCastawayKey(candidate) === key)
    prediction_announcement = `${moved.name} is now your #${prediction_order.indexOf(key) + 1} pick.`
    invalidate_saved_image()
    persist_prediction_url()
  }

  function end_prediction_drag() {
    dragged_prediction_key = null
    drop_prediction_key = null
  }

  function move_prediction(key, direction) {
    if (disposed || !is_prediction_mode) return
    prediction_order = movePredictionCastaway(castaways_prepped, prediction_order, key, direction)
    const rank = prediction_order.indexOf(key) + 1
    const person = castaways_prepped.find((item) => predictionCastawayKey(item) === key)
    prediction_announcement = `${person.name} is now your #${rank} pick${rank === 1 ? ", your predicted winner" : ""}.`
    invalidate_saved_image()
    persist_prediction_url()
    void tick().then(() => {
      if (disposed || !is_prediction_mode) return
      const controls = prediction_controls.get(key)
      const preferred = direction === -1 ? controls.move_up_button_manager : controls.move_down_button_manager
      const fallback = direction === -1 ? controls.move_down_button_manager : controls.move_up_button_manager
      const next_focus = preferred.is_disabled ? fallback : preferred
      next_focus.focus()
    })
  }

  function initialize_prediction_url() {
    // Run after hydration, without subscribing the owning component to draft state.
    untrack(() => {
      if (disposed || prediction_url_initialized || typeof window === "undefined") return
      prediction_url_initialized = true
      prediction_url_pathname = window.location.pathname
      restore_prediction_url()
      window.addEventListener("popstate", restore_prediction_url)
    })
  }

  function restore_prediction_url() {
    if (disposed || !prediction_url_initialized || window.location.pathname !== prediction_url_pathname) return
    // Navigation never carries an earlier opt-in to actual results with it.
    if (show_spoilers_checkbox_manager.val_bool) set_show_spoilers(false)
    const restored = readPredictionUrl(window.location.href, config?.season?.season_number, config?.castaways ?? [])
    const next_mode = restored !== null
    const order_changed = restored && JSON.stringify(restored.order) !== JSON.stringify(prediction_order)
    const name_changed = restored && restored.authorName !== author_name
    if (next_mode === is_prediction_mode && !order_changed && !name_changed) return
    set_show_spoilers(false)
    end_prediction_drag()
    if (restored) {
      prediction_order = restored.order
      is_restoring_prediction_url = true
      try { author_name_text_input_manager.set_val(restored.authorName) }
      finally { is_restoring_prediction_url = false }
    }
    is_prediction_mode = next_mode
    prediction_announcement = restored ? "Prediction order restored from this link." : ""
    invalidate_saved_image()
  }

  function persist_prediction_url() {
    if (disposed || !prediction_url_initialized || window.location.pathname !== prediction_url_pathname) return
    const next = writePredictionUrl(window.location.href, config?.season?.season_number, config?.castaways ?? [], is_prediction_mode ? prediction_order : null, author_name)
    if (next.href !== window.location.href) {
      // Keep SvelteKit's router state and any unrelated page state intact.
      replaceState(next, untrack(() => page.state))
    }
  }

  function invalidate_saved_image() {
    export_revision++
    export_error = ""
    is_sharing = false
    share_error = ""
    if (saved_image) {
      URL.revokeObjectURL(saved_image.url)
      saved_image = null
    }
  }

  function column_name(value) {
    return ({ 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven", 8: "eight" })[value] ?? "seven"
  }

  function set_grid_columns(value) {
    const next_columns = Number.isInteger(value) && value >= 3 && value <= 8 ? value : 7
    if (disposed || grid_columns === next_columns) return
    grid_columns = next_columns
    invalidate_saved_image()
  }

  async function load_spoilers(value) {
    invalidate_saved_image()
    const revision = ++spoilers_revision
    spoilers_request?.abort()
    spoilers_request = null
    spoilers_error = ""
    spoilers_loading = false
    if (disposed || value !== true || full_data) return
    spoilers_loading = true
    const controller = new AbortController()
    spoilers_request = controller
    try {
      const response = await fetch(`/api/seasons/${encodeURIComponent(config?.season?.season_number)}/spoilers`, {
        method: "POST",
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      })
      if (!response.ok) throw new Error("Spoilers could not be loaded. Turn this option on again to retry.")
      const data = await response.json()
      if (!data?.season || !Array.isArray(data.castaways) || !Array.isArray(data.episodes)) {
        throw new Error("Spoilers could not be loaded. Turn this option on again to retry.")
      }
      if (!disposed && revision === spoilers_revision && show_spoilers_checkbox_manager.val_bool) full_data = data
    } catch (error) {
      if (!disposed && revision === spoilers_revision && !controller.signal.aborted) {
        show_spoilers_checkbox_manager.set_val_from_bool(false)
        spoilers_error = error instanceof Error ? error.message : "Spoilers could not be loaded. Please try again."
      }
    } finally {
      if (revision === spoilers_revision) {
        spoilers_loading = false
        spoilers_request = null
      }
    }
  }

  function set_show_spoilers(value) {
    show_spoilers_checkbox_manager.set_val_from_bool(Boolean(value))
    void load_spoilers(Boolean(value))
  }

  async function preview_image() {
    if (disposed || is_generating || spoilers_loading || !display_castaways.length) return
    invalidate_saved_image()
    is_generating = true
    const revision = export_revision
    const selection = {
      season,
      castaways: [...display_castaways],
      gridColumns: grid_columns,
      authorName: is_prediction_mode ? author_name : "",
      showSpoilers: is_show_spoilers,
      showActualPlacements: is_show_actual_placements,
      actualPlacements: actual_placements,
      prediction: is_prediction_mode,
    }
    try {
      const { createCastawayImage } = await import("$lib/client/castaway-export.js")
      const result = await createCastawayImage(selection)
      if (disposed || revision !== export_revision) return
      saved_image = {
        ...result,
        share_file: prepareCastawayShareFile(result),
        url: URL.createObjectURL(result.blob),
        alt: (selection.prediction
          ? `My Survivor ${selection.season.season_number} prediction with ${selection.castaways.length} numbered picks, predicted winner first`
          : `Survivor ${selection.season.season_number} cast sheet with ${selection.castaways.length} castaways in a ${column_name(selection.gridColumns)}-column grid`)
          + (selection.authorName ? `. By ${selection.authorName}.` : "")
          + (selection.showActualPlacements ? " Actual placements shown in red (spoilers)." : ""),
        is_prediction: selection.prediction,
      }
      await tick()
      if (!disposed && revision === export_revision) {
        const preview = document.getElementById(preview_id)
        preview?.focus({ preventScroll: true })
        preview?.scrollIntoView({ block: "nearest" })
      }
    } catch (error) {
      if (!disposed && revision === export_revision) export_error = error instanceof Error ? error.message : "The image preview could not be created. Please try again."
    } finally {
      is_generating = false
    }
  }

  async function share_photo() {
    if (disposed || is_sharing || !saved_image?.share_file) return
    const revision = export_revision
    const file = saved_image.share_file
    is_sharing = true
    share_error = ""
    // The PNG is ready already. Invoke share in this tap, before any other await.
    const result = await shareCastawayFile(file)
    if (disposed || revision !== export_revision) return
    is_sharing = false
    if (result === "failed" || result === "unavailable") {
      share_error = "The photo share sheet could not open. Touch and hold the preview image for photo options, or use Download PNG."
    }
  }

  function save_png() {
    if (disposed || !saved_image) return
    // The package's public href API excludes blob URLs. Keep its native Button
    // controls and activate this local object URL only after an explicit click.
    const link = document.createElement("a")
    link.href = saved_image.url
    link.download = saved_image.filename
    document.body.append(link)
    link.click()
    link.remove()
  }

  function dispose() {
    disposed = true
    if (prediction_url_initialized) window.removeEventListener("popstate", restore_prediction_url)
    spoilers_revision++
    spoilers_request?.abort()
    invalidate_saved_image()
  }

  return {
    get season_prepped() { return season_prepped },
    get season_facts() { return season_facts },
    get castaways_prepped() { return castaways_prepped },
    get episodes_prepped() { return episodes_prepped },
    get finalists_prepped() { return finalists_prepped },
    get is_upcoming() { return is_upcoming },
    get spoilers_loading() { return spoilers_loading },
    get is_prediction_mode() { return is_prediction_mode },
    get prediction_announcement() { return prediction_announcement },
    cast_guide_button_manager,
    prediction_button_manager,
    reset_prediction_button_manager,
    author_name_text_input_manager,
    show_spoilers_checkbox_manager,
    view_seasons_button_manager,
    grid_width_dropdown_manager,
    get grid_columns() { return grid_columns },
    preview_image_button_manager,
    share_photo_button_manager,
    save_png_button_manager,
    close_preview_button_manager,
    preview_id,
    get display_castaways() { return display_castaways },
    get is_generating() { return is_generating },
    get export_error() { return export_error },
    get share_error() { return share_error },
    get saved_image() { return saved_image },
    get export_hint() { return export_hint },
    get is_show_spoilers() { return is_show_spoilers },
    get is_show_actual_placements() { return is_show_actual_placements },
    get dragged_prediction_key() { return dragged_prediction_key },
    get drop_prediction_key() { return drop_prediction_key },
    set is_show_spoilers(value) { set_show_spoilers(value) },
    preview_image,
    start_prediction_drag,
    over_prediction_drag,
    drop_prediction,
    end_prediction_drag,
    initialize_prediction_url,
    restore_prediction_url,
    dispose,
  }
}
