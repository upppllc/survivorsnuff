import { getSeason, LATEST_SEASON } from "$lib/server/seasons"
import { publicSeasonData } from "$lib/season-public-data.js"

export async function load({ fetch, setHeaders }) {
  const data = await getSeason(fetch, LATEST_SEASON)
  setHeaders({ "cache-control": "private, max-age=0, must-revalidate" })
  return publicSeasonData(data)
}
