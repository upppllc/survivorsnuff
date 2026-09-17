import { create_button_manager } from "sveltekit-ui"

export function create_error_manager(config) {
  const status = $derived(typeof config?.status === "function" ? config.status() : config?.status)
  const message = $derived((typeof config?.message === "function" ? config.message() : config?.message) || "Please try again in a moment.")
  const buttonStyle = {
    type: "outlined",
    is_compressed: true,
    min_height: 4.2,
    pl: 1.6,
    pr: 1.6,
    pt: 1.2,
    pb: 1.2,
    font_size: 1.6,
    border_radius: .96,
    border_color: "var(--snuff-border)",
    color: "var(--snuff-text)",
  }
  const home_button_manager = create_button_manager({ ...buttonStyle, text: "Back to the cast", href: "/" })
  const seasons_button_manager = create_button_manager({ ...buttonStyle, text: "Browse seasons", href: "/seasons" })
  const retry_button_manager = create_button_manager({ ...buttonStyle, text: "Try again", on_click: () => location.reload() })

  return {
    get status() { return status },
    get message() { return message },
    get title() { return status === 404 ? "Page not found" : "Something went wrong" },
    get heading() { return status === 404 ? "That trail ends here." : "A little trouble on the island." },
    home_button_manager,
    seasons_button_manager,
    retry_button_manager,
  }
}
