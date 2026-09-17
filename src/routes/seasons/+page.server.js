import { getSeasons } from "$lib/server/seasons"

export async function load({ fetch }) {
  return { seasons: await getSeasons(fetch) }
}
