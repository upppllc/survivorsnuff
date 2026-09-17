import { getSeason, LATEST_SEASON } from "$lib/server/seasons"

export async function load({ fetch, setHeaders }) {
  const data = await getSeason(fetch, LATEST_SEASON)
  setHeaders({ "cache-control": "private, max-age=0, must-revalidate" })
  return data
}
