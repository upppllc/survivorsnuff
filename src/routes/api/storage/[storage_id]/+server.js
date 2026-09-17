import { error } from "@sveltejs/kit"
import { env } from "$env/dynamic/private"

export async function GET({ params, fetch }) {
  if (!/^[a-zA-Z0-9_.-]+$/.test(params.storage_id ?? "")) error(400, "Invalid image")
  let response
  try {
    response = await fetch(`https://www.contibase.com/api/v1/storage/${encodeURIComponent(params.storage_id)}`, {
      headers: { Authorization: `Bearer ${env.CONTIBASE_ACCESS_TOKEN}` },
      signal: AbortSignal.timeout(15000),
    })
  } catch {
    error(503, "The photo is temporarily unavailable")
  }
  if (!response.ok) error(response.status === 404 ? 404 : 502, "Photo unavailable")
  const contentType = response.headers.get("content-type") ?? ""
  if (!contentType.startsWith("image/")) error(502, "Invalid photo response")
  return new Response(response.body, {
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      "x-content-type-options": "nosniff",
    },
  })
}
