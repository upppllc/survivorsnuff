import {
  CONTIBASE_ACCESS_TOKEN,
  CONTIBASE_SEASONS_TABLE_ID,
  CONTIBASE_EPISODES_TABLE_ID,
  CONTIBASE_CASTAWAYS_TABLE_ID,
} from "$env/static/private"
import { error } from "@sveltejs/kit"

export async function load({ fetch, params }) {
  const season_number = params?.season_number
  const season_filters = { field: "season_number", operator: "eq", value: season_number }
  const season_query = new URLSearchParams()
  season_query.set("filters", JSON.stringify(season_filters))
  const headers = { authorization: `Bearer ${CONTIBASE_ACCESS_TOKEN}` }
  const urls = {
    season: `https://www.contibase.com/api/v1/tables/${CONTIBASE_SEASONS_TABLE_ID}?${season_query}`,
    episodes: `https://www.contibase.com/api/v1/tables/${CONTIBASE_EPISODES_TABLE_ID}?${season_query}`,
    castaways: `https://www.contibase.com/api/v1/tables/${CONTIBASE_CASTAWAYS_TABLE_ID}?${season_query}`,
  }
  const [season_result, episodes_result, castaways_result] = await Promise.allSettled([
    fetch(urls.season, { headers }),
    fetch(urls.episodes, { headers }),
    fetch(urls.castaways, { headers }),
  ])
  function handle_fetch_result(result, label) {
    if (result.status === "rejected") {
      error(`failed to fetch ${label}: ${result.reason}`)
    }
    return result.value
  }
  const season_res = handle_fetch_result(season_result, "season")
  const episodes_res = handle_fetch_result(episodes_result, "episodes")
  const castaways_res = handle_fetch_result(castaways_result, "castaways")
  const [season_body, episodes_body, castaways_body] = await Promise.all([
    season_res.json(),
    episodes_res.json(),
    castaways_res.json(),
  ])
  if (season_res.status < 200 || season_res.status >= 300) {
    error(season_body?.message ?? "error getting season")
  }
  if (episodes_res.status < 200 || episodes_res.status >= 300) {
    error(episodes_body?.message ?? "error getting episodes")
  }
  if (castaways_res.status < 200 || castaways_res.status >= 300) {
    error(castaways_body?.message ?? "error getting castaways")
  }
  return {
    season: season_body?.rows?.[0],
    episodes: episodes_body?.rows ?? [],
    castaways: castaways_body?.rows ?? [],
  }
}
