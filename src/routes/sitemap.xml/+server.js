import { CONTIBASE_ACCESS_TOKEN } from "$env/static/private"

export async function GET({ fetch }) {
  const base_url = "https://www.survivorsnuff.com"
  const headers = { authorization: `Bearer ${CONTIBASE_ACCESS_TOKEN}` }
  const [seasons_res, episodes_res] = await Promise.all([
    fetch("https://www.contibase.com/api/v1/tables/mtuelwvmmoscrnuwpzml?limit=9000", { method: "get", headers }),
    fetch("https://www.contibase.com/api/v1/tables/dglmugnttgptblzbelap?limit=9000", { method: "get", headers }),
  ])
  if (!seasons_res.ok) throw new Error("error getting seasons")
  if (!episodes_res.ok) throw new Error("error getting episodes")
  const seasons_rows = (await seasons_res.json())?.rows ?? []
  const episodes_rows = (await episodes_res.json())?.rows ?? []
  const season_numbers = Array.from(
    new Set(
      seasons_rows
        .map((s) => s?.season_number)
        .filter((n) => Number.isFinite(Number(n)))
        .map((n) => Number(n))
    )
  ).sort((a, b) => a - b)
  const sorted_episodes = episodes_rows
    .filter((e) => Number.isFinite(Number(e?.season_number)) && Number.isFinite(Number(e?.episode_number)))
    .map((e) => ({ season_number: Number(e.season_number), episode_number: Number(e.episode_number) }))
    .sort((a, b) => a.season_number - b.season_number || a.episode_number - b.episode_number)
  const urls = [
    { loc: `${base_url}`, changefreq: "daily", priority: "1.0" },
    { loc: `${base_url}/seasons`, changefreq: "daily", priority: "0.9" },
    ...season_numbers.map((n) => ({
      loc: `${base_url}/seasons/${n}`,
      changefreq: "weekly",
      priority: "0.8",
    })),
    ...sorted_episodes.map((h) => ({
      loc: `${base_url}/seasons/${h.season_number}/${h.episode_number}`,
      changefreq: "weekly",
      priority: "0.7",
    })),
  ]
  const urls_xml = urls
    .map(
      (u) => `
  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join("")
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">${urls_xml}
</urlset>`.trim()

  return new Response(xml, { headers: { "content-type": "application/xml" } })
}
