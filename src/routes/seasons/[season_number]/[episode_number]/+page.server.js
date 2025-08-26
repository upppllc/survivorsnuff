import { CONTIBASE_ACCESS_TOKEN } from "$env/static/private"
import { error } from "@sveltejs/kit"

export async function load({ fetch, params }) {
  const season_number = params?.season_number
  const episode_number = params?.episode_number
  const season_filters = { field: "season_number", operator: "eq", value: season_number }
  const season_query = new URLSearchParams()
  season_query.set("filters", JSON.stringify(season_filters))
  const get_seasons_res = await fetch(
    `https://www.contibase.com/api/v1/tables/gqcilfsvgggxouxxupzq?${season_query.toString()}`,
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
  const episodes_filters = {
    and: [
      { field: "season", operator: "eq", value: season.id },
      { field: "episode_number", operator: "eq", value: episode_number },
    ],
  }
  const episodes_query = new URLSearchParams()
  episodes_query.set("filters", JSON.stringify(episodes_filters))
  const get_episodes_res = await fetch(
    `https://www.contibase.com/api/v1/tables/cntgbyqsufjmyowtopvp?${episodes_query.toString()}`,
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
  const episode = get_episodes_res_body?.rows?.[0] ?? null
  const from_episode_query = new URLSearchParams()
  from_episode_query.set("filters", JSON.stringify({ field: "episode", operator: "eq", value: episode?.id }))
  const [get_pitches_res, get_updates_res, get_sharks_res] = await Promise.all([
    fetch(`https://www.contibase.com/api/v1/tables/wprtmhzqyutbudycanqq?${from_episode_query.toString()}`, {
      method: "GET",
      headers: {
        authorization: `Bearer ${CONTIBASE_ACCESS_TOKEN}`,
      },
    }),
    fetch(`https://www.contibase.com/api/v1/tables/lpxciutycfqjqzlatsco?${from_episode_query.toString()}`, {
      method: "GET",
      headers: {
        authorization: `Bearer ${CONTIBASE_ACCESS_TOKEN}`,
      },
    }),
    fetch(`https://www.contibase.com/api/v1/tables/fwzniuwaxgplzhakcpqx`, {
      method: "GET",
      headers: {
        authorization: `Bearer ${CONTIBASE_ACCESS_TOKEN}`,
      },
    }),
  ])
  const [get_pitches_res_body, get_updates_res_body, get_sharks_res_body] = await Promise.all([
    get_pitches_res.json(),
    get_updates_res.json(),
    get_sharks_res.json(),
  ])
  if (get_pitches_res.status < 200 || get_pitches_res.status >= 300) {
    error(get_pitches_res_body?.message ?? "Error getting pitches")
  }
  if (get_updates_res.status < 200 || get_updates_res.status >= 300) {
    error(get_updates_res_body?.message ?? "Error getting company episode updates")
  }
  if (get_sharks_res.status < 200 || get_sharks_res.status >= 300) {
    error(get_sharks_res_body?.message ?? "Error getting sharks")
  }
  const pitches = get_pitches_res_body?.rows ?? []
  const company_episode_updates = get_updates_res_body?.rows ?? []
  const sharks = get_sharks_res_body?.rows ?? []
  const company_updates_or_conditions = company_episode_updates.map((h) => ({
    field: "id",
    operator: "eq",
    value: h?.company,
  }))
  const companies_query = new URLSearchParams()
  companies_query.set("filters", JSON.stringify({ or: company_updates_or_conditions }))
  const get_companies_res = await fetch(
    `https://www.contibase.com/api/v1/tables/pmnytmzaetmeprhmsnzm?${companies_query.toString()}`,
    {
      method: "GET",
      headers: {
        authorization: `Bearer ${CONTIBASE_ACCESS_TOKEN}`,
      },
    }
  )
  const get_companies_res_body = await get_companies_res.json()
  if (get_companies_res.status < 200 || get_companies_res.status >= 300) {
    error(get_companies_res_body?.message ?? "Error getting companies")
  }
  let companies = get_companies_res_body?.rows
  return {
    sharks: sharks,
    season: season,
    episode: episode,
    pitches: pitches,
    companies: companies,
    company_episode_updates: company_episode_updates,
  }
}
