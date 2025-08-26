import { CONTIBASE_ACCESS_TOKEN, CONTIBASE_SEASONS_TABLE_ID } from "$env/static/private"

export async function load({ fetch }) {
  const get_seasons_res = await fetch(
    `https://www.contibase.com/api/v1/tables/${CONTIBASE_SEASONS_TABLE_ID}?limit=9000`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${CONTIBASE_ACCESS_TOKEN}`,
      },
    }
  )
  const get_seasons_res_body = await get_seasons_res.json()
  if (get_seasons_res.status < 200 || get_seasons_res.status >= 300) {
    throw new Error(get_seasons_res_body?.message ?? "Error getting events")
  }
  const events = get_seasons_res_body?.rows

  return {
    seasons: events,
  }
}
