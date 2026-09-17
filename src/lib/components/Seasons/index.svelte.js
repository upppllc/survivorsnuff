import { create_button_manager, create_icon_manager } from "sveltekit-ui"
import { formatSeasonDate, seasonDateTimestamp } from "$lib/season-dates.js"

export function create_seasons_manager(config) {
  const seasons = $derived.by(() => {
    const rows = typeof config?.seasons === "function" ? config.seasons() : config?.seasons
    return [...(rows ?? [])]
      .sort((a, b) => b.season_number - a.season_number)
      .map((season) => ({
        season_number: season.season_number,
        date_label: formatSeasonDate(season.first_air_time),
        premiere_label: seasonDateTimestamp(season.first_air_time) > Date.now() ? "Premieres" : "Premiered",
        visit_icon_manager: create_icon_manager({
          icon_id: "arrow_tailed",
          deg: -45,
          size: 2,
          sw: 45,
          color: "var(--snuff-text)",
        }),
        visit_button_manager: create_button_manager({
          href: `/seasons/${season.season_number}`,
          aria_label: `Visit Survivor ${season.season_number}`,
          type: "plain",
          text_align: "left",
          min_height: 0,
          pl: 0,
          pr: 0,
          pt: 0,
          pb: 0,
          font_size: 1.6,
          font_weight: 400,
          border_radius: 1.6,
          color: "var(--snuff-text)",
        }),
      }))
  })

  return {
    get seasons() { return seasons },
  }
}
