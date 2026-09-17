import { getSeason } from "$lib/server/seasons"
import { publicSeasonData } from "$lib/season-public-data.js"

export async function load({ fetch, params, setHeaders }) {
  const data = await getSeason(fetch, params.season_number)
  setHeaders({ "cache-control": "private, max-age=0, must-revalidate" })
  return publicSeasonData(data)
}
