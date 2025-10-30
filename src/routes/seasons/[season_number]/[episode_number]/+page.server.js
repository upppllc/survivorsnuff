import { CONTIBASE_ACCESS_TOKEN } from "$env/static/private"
import { error } from "@sveltejs/kit"

export async function load({ fetch, params }) {
  const season_number = Number(params?.season_number)
  const episode_number = Number(params?.episode_number)
  if (!season_number) {
    error(400, "missing season_number")
  }
  if (!episode_number) {
    error(400, "missing episode_number")
  }
  const season_filters = { field: "season_number", operator: "eq", value: season_number }
  const season_query = new URLSearchParams()
  season_query.set("filters", JSON.stringify(season_filters))
  const episodes_filters = {
    and: [
      { field: "season_number", operator: "eq", value: season_number },
      { field: "episode_number", operator: "eq", value: episode_number },
    ],
  }
  const episodes_query = new URLSearchParams()
  episodes_query.set("filters", JSON.stringify(episodes_filters))

  console.log("episodes_filters", episodes_filters)
  const [get_season_res, get_episode_res] = await Promise.all([
    fetch(`https://www.contibase.com/api/v1/tables/mtuelwvmmoscrnuwpzml?${season_query.toString()}`, {
      method: "GET",
      headers: {
        authorization: `Bearer ${CONTIBASE_ACCESS_TOKEN}`,
      },
    }),
    fetch(`https://www.contibase.com/api/v1/tables/dglmugnttgptblzbelap?${episodes_query.toString()}`, {
      method: "GET",
      headers: {
        authorization: `Bearer ${CONTIBASE_ACCESS_TOKEN}`,
      },
    }),
  ])
  const get_season_res_body = await get_season_res.json()
  if (get_season_res.status < 200 || get_season_res.status >= 300) {
    error(get_season_res_body?.message ?? "Error getting season")
  }
  const season = get_season_res_body?.rows?.[0]
  const get_episode_res_body = await get_episode_res.json()
  if (get_episode_res.status < 200 || get_episode_res.status >= 300) {
    error(get_episode_res_body?.message ?? "Error getting episode")
  }
  console.log("epi_rows_len", get_episode_res_body?.rows.length)
  const episode = get_episode_res_body?.rows?.[0]
  let post = null
  console.log("episode_number", { episode_number, en2: episode?.episode_number })
  console.log("episodost_id44", episode?.post_id)
  if (episode?.post_id) {
    const post_res = await fetch(`https://www.contibase.com/api/v1/pages/${episode?.post_id}`, {
      method: "GET",
      headers: { authorization: `Bearer ${CONTIBASE_ACCESS_TOKEN}` },
    })
    const post_res_body = await post_res.json()
    if (post_res_body?.id) {
      post = post_res_body
    }
  }
  console.log("epi_post33", post?.id)
  return {
    season: season,
    episode: episode,
    post: post,
  }
}
