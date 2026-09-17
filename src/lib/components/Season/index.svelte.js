import { create_button_manager, create_checkbox_manager, create_text_input_manager } from "sveltekit-ui"
import { tick, untrack } from "svelte"
import { castawayImageSrc, castawayProfileDetails, sortCastawaysAlphabetically } from "$lib/castaways.js"
import { formatSeasonDate, seasonDateTimestamp } from "$lib/season-dates.js"
import { prepareCastawayShareFile, shareCastawayFile } from "$lib/client/castaway-share.js"

export function create_season_manager(config) {
  let castaway_view = $state("grid")
  let is_generating = $state(false)
  let export_error = $state("")
  let saved_image = $state(null)
  let is_preview_zoomed = $state(false)
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
  const preview_id = `cast-sheet-preview-${config?.season?.season_number}`

  const search_text_input_manager = create_text_input_manager({
    type: "search",
    name: "castaway-search",
    val: "",
    aria_label: "Search castaways",
    placeholder: "Find a name, hometown, or job",
    autocomplete: "off",
    on_change: invalidate_saved_image,
  })
  const show_spoilers_checkbox_manager = create_checkbox_manager({
    val: false,
    name: "show-season-results",
    aria_label: "Show results & spoilers",
    error_message: () => spoilers_error,
    on_change: load_spoilers,
  })
  const search = $derived(String(search_text_input_manager.val ?? ""))
  const search_query = $derived(search.trim().toLowerCase())
  const is_show_spoilers = $derived(show_spoilers_checkbox_manager.val_bool)
  const active_data = $derived(is_show_spoilers && full_data ? full_data : config)
  const season = $derived(active_data?.season ?? {})
  const is_upcoming = $derived(seasonDateTimestamp(season.first_air_time) > Date.now())
  const season_prepped = $derived({
    ...season,
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
      preseason_summary: profile.bios.find((bio) => bio.key === "preseason")?.value,
      get photo_failed() { return Boolean(failed_photos[photo_key]) },
      handle_photo_error: () => { failed_photos[photo_key] = true },
    }
  }))
  const filtered_castaways = $derived(castaways_prepped.filter((person) =>
    [person.name, person.occupation, person.hometown, person.current_residence].join(" ").toLowerCase().includes(search_query)
  ))
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
  const grid_button_manager = create_button_manager({
    type: "outlined",
    text: "Grid",
    aria_label: () => castaway_view === "grid" ? "Grid view, selected" : "Grid view",
    selected_type: () => castaway_view === "grid" ? "selected" : null,
    is_compressed: true,
    on_click: () => set_castaway_view("grid"),
  })
  const details_button_manager = create_button_manager({
    type: "outlined",
    text: "Details",
    aria_label: () => castaway_view === "details" ? "Details view, selected" : "Details view",
    selected_type: () => castaway_view === "details" ? "selected" : null,
    is_compressed: true,
    on_click: () => set_castaway_view("details"),
  })
  const preview_image_button_manager = create_button_manager({
    text: () => is_generating ? "Creating preview…" : "Preview image",
    aria_label: () => is_generating ? "Creating cast image preview" : "Preview image",
    support_icon: "photo",
    icon_pos: "left",
    is_loading: () => is_generating,
    is_disabled: () => !filtered_castaways.length || spoilers_loading,
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
  const zoom_preview_button_manager = create_button_manager({
    type: "outlined",
    text: () => is_preview_zoomed ? "Fit preview" : "Zoom preview",
    support_icon: "resize",
    icon_pos: "left",
    aria_label: () => is_preview_zoomed ? "Fit preview" : "Zoom preview",
    is_disabled: () => !saved_image,
    is_compressed: true,
    on_click: () => { is_preview_zoomed = !is_preview_zoomed },
  })
  const close_preview_button_manager = create_button_manager({
    type: "plain",
    text: "Close preview",
    support_icon: "x",
    icon_pos: "left",
    is_compressed: true,
    on_click: () => {
      invalidate_saved_image()
      preview_image_button_manager.focus()
    },
  })
  const clear_search_button_manager = create_button_manager({
    type: "outlined",
    text: "Clear search",
    is_compressed: true,
    on_click: () => search_text_input_manager.set_val(""),
  })
  const export_hint = $derived(`Castaways are listed alphabetically by name. Preview the ${castaway_view === "grid" ? "three-column grid" : "full details, one person per row"}, then save it as a PNG.${search_query ? ` Includes the ${filtered_castaways.length} matching castaways.` : ""}`)

  function invalidate_saved_image() {
    export_revision++
    export_error = ""
    is_preview_zoomed = false
    is_sharing = false
    share_error = ""
    if (saved_image) {
      URL.revokeObjectURL(saved_image.url)
      saved_image = null
    }
  }

  function set_castaway_view(value) {
    const next_view = value === "details" ? "details" : "grid"
    if (next_view !== castaway_view) {
      castaway_view = next_view
      invalidate_saved_image()
    }
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
    if (disposed || is_generating || spoilers_loading || !filtered_castaways.length) return
    invalidate_saved_image()
    is_generating = true
    const revision = export_revision
    const selection = {
      season,
      castaways: [...filtered_castaways],
      layout: castaway_view,
      showSpoilers: is_show_spoilers,
    }
    try {
      const { createCastawayImage } = await import("$lib/client/castaway-export.js")
      const result = await createCastawayImage(selection)
      if (disposed || revision !== export_revision) return
      saved_image = {
        ...result,
        share_file: prepareCastawayShareFile(result),
        url: URL.createObjectURL(result.blob),
        description: `${selection.castaways.length} castaways · ${selection.layout === "grid" ? "Three-column grid" : "One person per row"} · ${result.width} × ${result.height} px`,
        alt: `Survivor ${selection.season.season_number} cast sheet with ${selection.castaways.length} castaways in ${selection.layout === "grid" ? "a three-column grid" : "detailed rows"}`,
        includes_spoilers: selection.showSpoilers,
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
    search_text_input_manager,
    show_spoilers_checkbox_manager,
    view_seasons_button_manager,
    grid_button_manager,
    details_button_manager,
    preview_image_button_manager,
    share_photo_button_manager,
    save_png_button_manager,
    zoom_preview_button_manager,
    close_preview_button_manager,
    preview_id,
    clear_search_button_manager,
    get search() { return search },
    get filtered_castaways() { return filtered_castaways },
    get is_generating() { return is_generating },
    get export_error() { return export_error },
    get share_error() { return share_error },
    get saved_image() { return saved_image },
    get is_preview_zoomed() { return is_preview_zoomed },
    get export_hint() { return export_hint },
    get is_show_spoilers() { return is_show_spoilers },
    set is_show_spoilers(value) { set_show_spoilers(value) },
    get castaway_view() { return castaway_view },
    set castaway_view(value) { set_castaway_view(value) },
    preview_image,
    dispose,
  }
}
