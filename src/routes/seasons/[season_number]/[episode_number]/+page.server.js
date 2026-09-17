import { loadEpisode } from "./episode-data.js"

export async function load({ fetch, params, setHeaders }) {
  const data = await loadEpisode(fetch, params)
  setHeaders({ "cache-control": "private, max-age=0, must-revalidate" })
  return data
}
