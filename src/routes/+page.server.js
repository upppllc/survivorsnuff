import { CONTIBASE_ACCESS_TOKEN } from "$env/static/private"
import { error } from "@sveltejs/kit"

export async function load({ fetch }) {
  const latest_season_number = 49
  const season_filters = { field: "season_number", operator: "eq", value: latest_season_number }
  const season_query = new URLSearchParams()
  season_query.set("filters", JSON.stringify(season_filters))
  const get_episodes_res = await fetch(
    `https://www.contibase.com/api/v1/tables/dglmugnttgptblzbelap?${season_query.toString()}`,
    {
      method: "GET",
      headers: { authorization: `Bearer ${CONTIBASE_ACCESS_TOKEN}` },
    }
  )
  const get_episodes_res_body = await get_episodes_res.json()
  if (get_episodes_res.status < 200 || get_episodes_res.status >= 300) {
    error(get_episodes_res_body?.message ?? "error getting season")
  }
  const episodes = get_episodes_res_body?.rows ?? []
  const post_promises = episodes
    .filter((e) => e?.post_id)
    .map(async (e) => {
      try {
        const res = await fetch(`https://www.contibase.com/api/v1/pages/${e.post_id}`, {
          headers: { authorization: `Bearer ${CONTIBASE_ACCESS_TOKEN}` },
        })
        const body = await res.json()
        return { episode: e, post: body?.id ? body : null }
      } catch {
        return { episode: e, post: null }
      }
    })
  const results = await Promise.allSettled(post_promises)
  const episodes_cleaned = results.map((r) => {
    if (r.status === "fulfilled") {
      const { episode, post } = r.value
      return { ...episode, post }
    } else {
      return { ...r.reason?.episode, post: null }
    }
  })

  return {
    season_number: latest_season_number,
    episodes: episodes_cleaned,
  }
}
