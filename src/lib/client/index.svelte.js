import { create_layout_manager, create_button_manager } from "sveltekit-ui"
import { create_main_nav_manager } from "$lib/components/MainNav/index.svelte.js"

export function create_global_manager() {
  const layout_manager = create_layout_manager({
    is_dark_theme: false,
    is_show_hamburger: false,
    is_full_nav_prevented: true,
    nav_main_padding_y: 1.4,
    nav_main_padding_x: 2.4,
    favicons: { favicon: "/favicon.svg", favicon_inactive: "/favicon-inactive.svg" },
  })
  const main_nav_manager = create_main_nav_manager({ layout_manager })
  const footer_button_config = { type: "plain", is_compressed: true, font_size: 1.4, font_weight: 600, color: "var(--snuff-text)" }
  return {
    layout_manager,
    main_nav_manager,
    footer_home_button_manager: create_button_manager({ ...footer_button_config, text: "Survivor Snuff", href: "/", font_size: 1.7, font_weight: 750, pl: 0, pr: 0 }),
    footer_archive_button_manager: create_button_manager({ ...footer_button_config, text: "Season archive", href: "/seasons" }),
    footer_follow_button_manager: create_button_manager({ ...footer_button_config, text: "Follow on X ↗", href: "https://x.com/SurvivorSnuff", target: "_blank" }),
  }
}
