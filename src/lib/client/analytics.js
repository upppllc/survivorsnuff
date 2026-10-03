const public_paths = new Set(["/", "/seasons"])
const dynamic_paths = [[/^\/seasons\/\d+$/u, "/seasons/[season_number]"],
  [/^\/seasons\/\d+\/\d+$/u, "/seasons/[season_number]/[episode_number]"]]

// Do not send query strings, auth links, private pages, or user-entered data.
export function public_page_analytics(event) {
  if (event?.type !== "pageview") return null
  let url
  try { url = new URL(event.url) } catch { return null }
  if (!['https:', 'http:'].includes(url.protocol)) return null
  const path = public_paths.has(url.pathname)
    ? url.pathname
    : dynamic_paths.find(([pattern]) => pattern.test(url.pathname))?.[1]
  if (!path) return null
  url.pathname = path
  url.search = ""
  url.hash = ""
  return { ...event, url: url.href }
}
