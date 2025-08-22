import { error, json } from "@sveltejs/kit"
import { CONTIBASE_ACCESS_TOKEN, CONTIBASE_USERS_TABLE_ID } from "$env/static/private"

export async function POST({ request, fetch }) {
  console.log("start add user")
  const body = await request.json()
  const email_address = body?.email_address ?? null
  const first_name = body?.first_name ?? null
  const email_address_regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (!email_address_regex.test(email_address)) {
    error(400, "Email address does not meet format requirements")
  }
  const filters = {
    and: [{ field: "email_address", operator: "eq", value: email_address }],
  }
  const params = new URLSearchParams({
    filters: JSON.stringify(filters),
    limit: "1",
  })
  const check_if_email_address_already_used_res = await fetch(
    `https://www.contibase.com/api/v1/tables/${CONTIBASE_USERS_TABLE_ID}?${params.toString()}`,
    {
      method: "GET",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${CONTIBASE_ACCESS_TOKEN}`,
      },
    }
  )
  const check_if_email_address_already_used_res_body = await check_if_email_address_already_used_res.json()
  if (!check_if_email_address_already_used_res.ok) {
    return error(
      400,
      check_if_email_address_already_used_res_body?.message || "error checking for existing email_address"
    )
  }
  if (
    Array.isArray(check_if_email_address_already_used_res_body?.rows) &&
    check_if_email_address_already_used_res_body.rows.length > 0
  ) {
    return error(400, "email_address already exists")
  }
  const create_user_res = await fetch(`https://www.contibase.com/api/v1/tables/${CONTIBASE_USERS_TABLE_ID}/rows`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${CONTIBASE_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      row_data: {
        first_name: first_name,
        email_address: email_address,
        tags: ["all"],
      },
    }),
  })
  const create_user_res_body = await create_user_res.json()
  if (!create_user_res.ok) {
    error(400, create_user_res?.message || "Error adding user")
  }
  return json(create_user_res_body)
}
