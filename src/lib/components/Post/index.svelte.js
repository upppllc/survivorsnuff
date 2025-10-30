import {
  create_button_manager,
  create_qr_manager,
  create_content_manager,
  create_icon_manager,
  copy_to_clipboard,
} from "sveltekit-ui"
import { page } from "$app/state"
import { PUBLIC_APPLE_MAPKIT_JS_API_KEY } from "$env/static/public"

export function create_post_manager(config) {
  const storage_path = "/api/storage/{storage_id}"
  let season_number = $state(null)
  let episode_number = $state(null)
  let post = $state(null)
  let clock_icon_manager = $state(null)
  let copy_link_button_manager = $state(null)
  let share_button_manager = $state(null)
  let share_qr_manager = $state(null)
  let main_content_manager = $state(null)
  let main_image_content_manager = $state(null)

  function copy_to_share_on_twitter() {
    const markdown = `
${post?.title?.attributes?.content}
https://www.survivorsnuff.com/seasons/${season_number}/${episode_number}`
    copy_to_clipboard(markdown)
    share_button_manager.set_text("Copied Tweet")
    setTimeout(() => {
      share_button_manager.set_text("Copy Tweet")
    }, 1800)
  }

  function init(input) {
    season_number = input?.season_number
    episode_number = input?.episode_number
    post = input?.post
    clock_icon_manager = create_icon_manager({
      icon_id: "clock",
      size: 1.6,
      sw: 50,
      color: "var(--g8-t)",
    })
    copy_link_button_manager = create_button_manager({
      text: "Copy Link",
      support_icon: "share",
      is_success_animation: true,
      fixed_width: 14,
      text_align: "left",
      icon_bg_tint: true,
      hover_shadow_color: "oklch(var(--l6-t) var(--c3) var(--h3) / var(--o7))",
      hover_shadow_size: 1,
      h: 11,
      l: 1,
      c: 1,
      on_click: () => {
        copy_link_button_manager.set_text("Copied URL")
        copy_to_clipboard(page?.url?.href)
        setTimeout(() => {
          copy_link_button_manager.set_text("Copy Link")
        }, 1800)
      },
    })
    share_button_manager = create_button_manager({
      text: "Copy Tweet",
      support_icon: "share",
      is_success_animation: true,
      fixed_width: 14,
      text_align: "left",
      icon_bg_tint: true,
      hover_shadow_color: "oklch(var(--l6-t) var(--c3) var(--h3) / var(--o7))",
      hover_shadow_size: 1,
      h: 11,
      l: 1,
      c: 1,
      on_click: () => copy_to_share_on_twitter(),
    })
    share_qr_manager = create_qr_manager({
      margin: 0,
      size: 200,
      image_size: 1,
      type_number: 0,
      color: "oklch(var(--l8-t) var(--c4) var(--primary-h))",
      corner_color: "oklch(var(--l12-t) var(--c2) var(--primary-h))",
      border_color: "transparent",
      background_color: "var(--bg)",
      border_radius: null,
      border_r: null,
      border_radius: null,
      error_correction_level: "M",
      data: `https://www.survivorsnuff.com/seasons/${season_number}/${episode_number}`,
      image: "/favicon.svg",
    })
    main_content_manager = create_content_manager({
      val: post?.segments?.main?.val,
      storage_path,
      mapkit_js_token: PUBLIC_APPLE_MAPKIT_JS_API_KEY,
    })
    let main_image = post?.main_image
    if (main_image && typeof main_image == "object") {
      main_image.attributes = {
        ...main_image?.attributes,
        alt: main_image?.attributes?.alt || post?.title?.attributes?.content,
        display_max_height: 500,
        border_radius: 1,
        bg_img_blur: 20,
        bg_img_opacity: 0.2,
        storage_path,
      }
    }
    main_image_content_manager = create_content_manager({
      val: main_image,
      storage_path,
    })
  }

  init(config)

  return {
    get season_number() {
      return season_number
    },
    get episode_number() {
      return episode_number
    },
    get post() {
      return post
    },
    get clock_icon_manager() {
      return clock_icon_manager
    },
    get copy_link_button_manager() {
      return copy_link_button_manager
    },
    get share_button_manager() {
      return share_button_manager
    },
    get share_qr_manager() {
      return share_qr_manager
    },
    get main_content_manager() {
      return main_content_manager
    },
    get main_image_content_manager() {
      return main_image_content_manager
    },
  }
}
