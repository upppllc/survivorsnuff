import { CONTIBASE_ACCESS_TOKEN, CONTIBASE_SEASONS_TABLE_ID, CONTIBASE_EPISODES_TABLE_ID } from "$env/static/private"
import { error } from "@sveltejs/kit"

export async function load({ fetch, params }) {
  const season_number = params?.season_number
  const season_filters = { field: "season_number", operator: "eq", value: season_number }
  const season_query = new URLSearchParams()
  season_query.set("filters", JSON.stringify(season_filters))
  const get_seasons_res = await fetch(
    `https://www.contibase.com/api/v1/tables/${CONTIBASE_SEASONS_TABLE_ID}?${season_query.toString()}`,
    {
      method: "GET",
      headers: {
        authorization: `Bearer ${CONTIBASE_ACCESS_TOKEN}`,
      },
    }
  )
  const get_seasons_res_body = await get_seasons_res.json()
  if (get_seasons_res.status < 200 || get_seasons_res.status >= 300) {
    error(get_seasons_res_body?.message ?? "Error getting season")
  }
  const season = get_seasons_res_body?.rows?.[0]
  if (!season) {
    return { season: null, episodes: [], pitches: [], company_episode_updates: [] }
  }
  const get_episodes_res = await fetch(
    `https://www.contibase.com/api/v1/tables/${CONTIBASE_EPISODES_TABLE_ID}?${season_query.toString()}`,
    {
      method: "GET",
      headers: {
        authorization: `Bearer ${CONTIBASE_ACCESS_TOKEN}`,
      },
    }
  )
  const get_episodes_res_body = await get_episodes_res.json()
  if (get_episodes_res.status < 200 || get_episodes_res.status >= 300) {
    error(get_episodes_res_body?.message ?? "Error getting episodes")
  }
  const episodes = get_episodes_res_body?.rows ?? []
  if (episodes.length === 0) {
    return { season, episodes: [], pitches: [], company_episode_updates: [] }
  }
  return {
    season: season,
    episodes: episodes,
  }
}
