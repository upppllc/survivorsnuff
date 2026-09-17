import { onDestroy } from "svelte"
import { create_button_manager, create_time_manager } from "sveltekit-ui"
import { create_post_manager } from "$lib/components/Post/index.svelte.js"

export function create_episode_manager(config) {
  const initialData = $derived(typeof config?.data === "function" ? config.data() : config?.data)
  const episodeKey = $derived(`${initialData.season.season_number}/${initialData.episode.episode_number}`)
  let revealedEpisode = $state(null)
  let spoilerData = $state.raw(null)
  let isLoading = $state(false)
  let revealError = $state("")
  let activeRequest = null
  const showSpoilers = $derived(revealedEpisode === episodeKey && Boolean(spoilerData))
  const data = $derived(showSpoilers ? spoilerData : initialData)
  const air_time_manager = create_time_manager({ val: () => initialData.episode.air_time })
  const post_manager = $derived(showSpoilers && spoilerData.post ? create_post_manager({
    season_number: initialData.season.season_number,
    episode_number: initialData.episode.episode_number,
    post: structuredClone(spoilerData.post),
  }) : null)

  function resetSpoilers() {
    activeRequest?.abort()
    activeRequest = null
    revealedEpisode = null
    spoilerData = null
    isLoading = false
    revealError = ""
  }

  async function toggleSpoilers() {
    if (showSpoilers) {
      resetSpoilers()
      return
    }
    const requestedEpisode = episodeKey
    const controller = new AbortController()
    activeRequest = controller
    isLoading = true
    revealError = ""
    const timeout = setTimeout(() => controller.abort(), 30000)
    try {
      const response = await fetch(`/seasons/${requestedEpisode}`, {
        method: "POST",
        headers: { accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      })
      if (!response.ok) throw new Error("Episode details could not be loaded. Please try again.")
      const result = await response.json()
      if (!result?.episode || !result?.season) throw new Error("Episode details could not be loaded. Please try again.")
      if (activeRequest !== controller || episodeKey !== requestedEpisode) return
      spoilerData = result
      revealedEpisode = requestedEpisode
    } catch {
      if (activeRequest === controller && episodeKey === requestedEpisode) {
        revealError = "Episode details could not be loaded. Please try again."
      }
    } finally {
      clearTimeout(timeout)
      if (activeRequest === controller) {
        activeRequest = null
        isLoading = false
      }
    }
  }

  const season_button_manager = create_button_manager({
    type: "plain",
    href: () => `/seasons/${initialData.season.season_number}`,
    text: () => `Season ${initialData.season.season_number} overview`,
    support_icon: "arrow_tailed",
    icon_deg: 180,
    icon_pos: "left",
    icon_size: 1.5,
    min_height: 3.2,
    is_compressed: true,
    font_size: 1.6,
    pl: .5,
    pr: .5,
    pt: .5,
    pb: .5,
    color: "var(--snuff-text)",
  })
  const spoiler_button_manager = create_button_manager({
    type: "outlined",
    text: () => isLoading ? "Loading episode details…" : showSpoilers ? "Hide spoilers" : "Show spoilers",
    aria_label: () => isLoading ? "Loading episode details" : showSpoilers ? "Hide spoilers" : "Show spoilers",
    is_loading: () => isLoading,
    is_compressed: true,
    font_size: 1.6,
    min_height: 3.4,
    pl: 1.2,
    pr: 1.2,
    pt: .7,
    pb: .7,
    border_radius: 1,
    color: "var(--snuff-text)",
    on_click: toggleSpoilers,
  })

  $effect(() => {
    initialData.episode
    resetSpoilers()
  })
  onDestroy(resetSpoilers)

  return {
    get data() { return data },
    get show_spoilers() { return showSpoilers },
    get reveal_error() { return revealError },
    get post_manager() { return post_manager },
    air_time_manager,
    season_button_manager,
    spoiler_button_manager,
  }
}
