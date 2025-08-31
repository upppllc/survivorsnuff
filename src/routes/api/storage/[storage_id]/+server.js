import { error } from "@sveltejs/kit"
import { CONTIBASE_ACCESS_TOKEN } from "$env/static/private"

export async function GET({ params, fetch }) {
  if (!params?.storage_id) {
    error(400, "storage_id requires")
  }
  const image_res = await fetch(`https://www.contibase.com/api/v1/storage/${params?.storage_id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${CONTIBASE_ACCESS_TOKEN}`,
    },
  })
  if (!image_res.ok) {
    error(400, "Error fetching image")
  }
  const image_data = await image_res.arrayBuffer()
  return new Response(image_data, {
    status: image_res.status,
    headers: {
      "Content-Type": image_res.headers.get("Content-Type"),
      "Content-Length": image_res.headers.get("Content-Length"),
    },
  })
}
