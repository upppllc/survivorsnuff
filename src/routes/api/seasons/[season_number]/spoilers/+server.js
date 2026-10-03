
import { getSeason } from "#lib/server/seasons.js"

// Full details are fetched only after an explicit opt-in; normal page loads use
// publicSeasonData. Export no GET handler so link prefetching cannot request them.
export async function POST({ fetch, params, setHeaders }) {
  setHeaders({ "cache-control": "private, no-store" })
  return Response.json(await getSeason(fetch, params.season_number))
}
