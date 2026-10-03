import { afterNavigate } from "$app/navigation"
import { page } from "$app/state"
import { dev } from "$app/env"
import { inject, pageview } from "@vercel/analytics"
import { public_page_analytics } from "./analytics.js"

export function register_site_analytics() {
  let initialized = false
  afterNavigate(() => {
    if (!public_page_analytics({ type: "pageview", url: page.url.href })) return
    if (!initialized) {
      inject({ mode: dev ? "development" : "production", framework: "sveltekit", beforeSend: public_page_analytics, disableAutoTrack: true })
      initialized = true
    }
    // Queue the real pathname; beforeSend groups dynamic paths exactly once.
    pageview({ route: page.route.id, path: page.url.pathname })
  })
}
