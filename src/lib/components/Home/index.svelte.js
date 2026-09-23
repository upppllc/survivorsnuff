import { create_button_manager } from "sveltekit-ui"
import { create_season_manager } from "$lib/components/Season/index.svelte.js"

export function create_home_manager(config) {
  const season_manager = create_season_manager(config)
  const season = season_manager.season_prepped
  const castaway_count = season_manager.castaways_prepped.length

  function archive_button(text, font_size) {
    return create_button_manager({
      type: "plain",
      text,
      href: "/seasons",
      support_icon: "arrow_tailed",
      icon_size: 1.6,
      icon_deg: 0,
      is_compressed: true,
      is_no_wrap: true,
      min_height: 0,
      pl: 0,
      pr: .8,
      pt: 0,
      pb: 0,
      border_radius: 0,
      color: "var(--snuff-text)",
      font_size,
      line_height: 1.5,
      font_weight: 600,
    })
  }

  return {
    season_manager,
    castaway_count,
    season_number: season.season_number,
    season_title: season.title,
    season_label: [`SURVIVOR ${season.season_number}`, season.title?.toUpperCase()].filter(Boolean).join(" · "),
    page_title: `Survivor ${season.season_number} Cast & Printable Cast Sheets | Survivor Snuff`,
    page_description: `Meet all ${castaway_count} Survivor ${season.season_number} castaways. Browse photos and full profiles, then preview and save your cast grid or personal prediction.`,
    explore_seasons_button_manager: archive_button("Explore past seasons", 1.44),
    browse_archive_button_manager: archive_button("Browse the season archive", 1.52),
  }
}
