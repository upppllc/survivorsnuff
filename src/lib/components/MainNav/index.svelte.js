import { create_button_manager } from "sveltekit-ui"
import { page } from "$app/state"

export function create_main_nav_manager({ layout_manager }) {
  const links = [{ text: "Season 51", href: "/seasons/51" }, { text: "All seasons", href: "/seasons" }]
  const button_managers = links.map((link) => create_button_manager({
    ...link,
    type: "plain",
    color: "var(--snuff-text)",
    is_compressed: true,
    is_no_wrap: true,
    font_size: () => layout_manager.breakpoints.sm ? 1.3 : 1.5,
    font_weight: 600,
    pl: () => layout_manager.breakpoints.sm ? 0.7 : 1.1,
    pr: () => layout_manager.breakpoints.sm ? 0.7 : 1.1,
    selected_type: () => page.url.pathname === link.href ? "half_selected" : null,
  }))
  return { button_managers }
}
