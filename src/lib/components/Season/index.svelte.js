import { create_button_manager, create_image_manager, create_time_manager } from "sveltekit-ui"
import { goto } from "$app/navigation"

export function create_season_manager(config) {
  let season_prepped = $state(null)
  let episodes_prepped = $state(null)
  let castaways_prepped = $state(null)
  let view_seasons_button_manager = $state(null)
  let is_show_spoilers_button_manager = $state(null)
  let is_show_spoilers = $state(true)

  const storage_path = "/api/v1/storage/{storage_id}"

  function init(input) {
    view_seasons_button_manager = create_button_manager({
      text: "View Seasons",
      support_icon: "arrow_tailed",
      icon_pos: "left",
      icon_deg: 180,
      is_compressed: true,
      on_click: () => goto("/seasons"),
    })
    is_show_spoilers_button_manager = create_button_manager({
      type: "outlined",
      text: () => (is_show_spoilers ? "Hide Spoilers" : "Show Spoilers"),
      is_compressed: true,
      on_click: () => (is_show_spoilers = !is_show_spoilers),
    })
    let first_air_time_manager = create_time_manager({
      val: input?.season?.first_air_time,
      display_format: "calendar_date",
    })
    let last_air_time_manager = create_time_manager({
      val: input?.season?.last_air_time,
      display_format: "calendar_date",
    })
    season_prepped = {
      ...input?.season,
      get first_air_time_manager() {
        return first_air_time_manager
      },
      get last_air_time_manager() {
        return last_air_time_manager
      },
    }
    let episodes_prepped_loc = []
    if (Array.isArray(input?.episodes)) {
      for (let episode of input?.episodes) {
        let air_time_manager = create_time_manager({
          ...episode?.air_time,
          display_format: "calendar_date",
        })
        episodes_prepped_loc.push({
          ...episode,
          get air_time_manager() {
            return air_time_manager
          },
        })
      }
    }
    episodes_prepped = episodes_prepped_loc.sort((a, b) => a.episode_number - b.episode_number)
    let castaways_prepped_loc = []
    if (Array.isArray(input?.castaways)) {
      for (let castaway of input?.castaways) {
        let image_manager = create_image_manager({
          storage_path,
          storage_id: castaway?.image_storage_id,
          alt: `${castaway?.name} survivor profile image`,
          // image_width: 512,
          // image_height: 512,
          display_max_height: 400,
          display_max_width: 400,
          bg_img_blur: 20,
          bg_img_opacity: 0.2,
        })
        castaways_prepped_loc.push({
          ...castaway,
          get image_manager() {
            return image_manager
          },
        })
      }
    }
    castaways_prepped = castaways_prepped_loc
  }

  init(config)

  return {
    get view_seasons_button_manager() {
      return view_seasons_button_manager
    },
    get season_prepped() {
      return season_prepped
    },
    get episodes_prepped() {
      return episodes_prepped
    },
    get castaways_prepped() {
      return castaways_prepped
    },
    get is_show_spoilers_button_manager() {
      return is_show_spoilers_button_manager
    },
    get is_show_spoilers() {
      return is_show_spoilers
    },
  }
}
