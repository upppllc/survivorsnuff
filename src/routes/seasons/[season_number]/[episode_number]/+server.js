import { json } from "@sveltejs/kit"
import { loadEpisode } from "./episode-data.js"

// Browsers request this only after the visitor presses Show spoilers.
// GET responses and SvelteKit's navigation preloads remain spoiler-free.
export async function POST({ fetch, params }) {
  const data = await loadEpisode(fetch, params, true)
  return json(data, {
    headers: {
      "cache-control": "private, no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  })
}
