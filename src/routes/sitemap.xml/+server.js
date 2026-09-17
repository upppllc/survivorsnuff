import { getSeasons, readTable } from "$lib/server/seasons"

export async function GET({ fetch }) {
  const base = "https://www.survivorsnuff.com"
  const [seasons, episodes] = await Promise.all([getSeasons(fetch), readTable(fetch, "episodes")])
  const paths = new Set(["", "/seasons"])
  for (const season of seasons) {
    const number = Number(season.season_number)
    if (Number.isInteger(number) && number > 0) paths.add(`/seasons/${number}`)
  }
  for (const episode of episodes ?? []) {
    const season = Number(episode.season_number)
    const number = Number(episode.episode_number)
    if (Number.isInteger(season) && season > 0 && Number.isInteger(number) && number > 0) paths.add(`/seasons/${season}/${number}`)
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...paths].map((path) => `  <url><loc>${base}${path}</loc></url>`).join("\n")}
</urlset>`
  return new Response(xml, { headers: { "content-type": "application/xml", "cache-control": "public, max-age=3600" } })
}
