// import { error, json } from "@sveltejs/kit"
// import { CONTIBASE_API_KEY, CONTIBASE_USERS_TABLE_ID } from "$env/static/private"

export async function handle({ event, resolve }) {
  // let access_token = event.cookies.get("cb_access_token")
  // if (access_token && access_token.match(/^[a-z]{20}$/)) {
  //   const filters_obj = {
  //     and: [{ field: "access_token", operator: "eq", value: access_token }],
  //   }
  //   const filters = JSON.stringify(filters_obj)
  //   const get_user_row_res = await fetch(
  //     `https://www.contibase.com/api/v1/tables/${CONTIBASE_USERS_TABLE_ID}?filters=${encodeURIComponent(filters)}`,
  //     {
  //       method: "GET",
  //       headers: {
  //         "content-type": "application/json",
  //         authorization: `Bearer ${CONTIBASE_API_KEY}`,
  //       },
  //     }
  //   )
  //   const get_user_row_res_body = await get_user_row_res.json()
  //   if (!get_user_row_res.ok) {
  //     error("Error getting user from Contibase:", get_user_row_res_body?.message)
  //   }
  //   const user = get_user_row_res_body?.rows?.[0]
  //   event.locals.account = user
  //   event.locals.access_token = access_token
  // }
  const theme = event.cookies.get("theme") ?? "dark"
  const response = await resolve(event, {
    transformPageChunk: ({ html }) => html.replace('data-theme=""', `data-theme="${theme}"`),
  })
  return response
}
