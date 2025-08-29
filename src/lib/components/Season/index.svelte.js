import { create_button_manager, create_image_manager, create_time_manager } from "sveltekit-ui"
import { goto } from "$app/navigation"

export function create_season_manager(config) {
  let season_prepped = $state(null)
  let episodes_prepped = $state(null)
  let castaways_prepped = $state(null)
  let view_seasons_button_manager = $state(null)

  const storage_path = "/api/v1/storage/cb/{storage_id}"

  function init(input) {
    view_seasons_button_manager = create_button_manager({
      text: "View Seasons",
      support_icon: "arrow_tailed",
      icon_pos: "left",
      icon_deg: 180,
      is_compressed: true,
      on_click: () => goto("/seasons"),
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
    castaways_prepped = input?.castaways
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
  }
}
