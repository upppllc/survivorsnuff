import { create_icon_manager } from "sveltekit-ui"

export function create_preview_card_manager(config) {
  const page = $derived(typeof config?.page === "function" ? config.page() : config?.page)
  const gotoPath = $derived(typeof config?.goto_path === "function" ? config.goto_path() : config?.goto_path)
  let failedImage = $state(null)
  const imageSource = $derived(page?.main_image?.attributes?.storage_id
    ? `/api/storage/${encodeURIComponent(page.main_image.attributes.storage_id)}`
    : null)
  const title = $derived(page?.title?.attributes?.content ?? "Episode details")

  const clock_icon_manager = create_icon_manager({
    icon_id: "clock",
    sw: 50,
    size: 1.4,
    mr: 0.2,
    mt: 0.1,
    color: "var(--g4-t)",
  })
  const view_icon_manager = create_icon_manager({
    icon_id: "arrow_tailed",
    size: 1.4,
    sw: 45,
    color: "currentColor",
  })

  return {
    get href() { return gotoPath ?? `/pages/${encodeURIComponent(page?.id ?? "")}` },
    get image_source() { return imageSource },
    get image_failed() { return failedImage === imageSource },
    get image_alt() { return page?.main_image?.attributes?.alt ?? title },
    get title() { return title },
    get description() { return page?.description?.attributes?.content },
    get read_minutes() { return page?.derived_view_time_mins },
    clock_icon_manager,
    view_icon_manager,
    handle_image_error: () => { failedImage = imageSource },
  }
}
