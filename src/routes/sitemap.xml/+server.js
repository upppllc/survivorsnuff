const site = "https://www.survivorsnuff.com"

export async function GET() {
  const seasons_urls = Array.from({ length: 49 }, (_, i) => {
    const n = i + 1
    return `
  <url>
    <loc>${site}/seasons/${n}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
  }).join("")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${site}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${site}/seasons</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>${seasons_urls}
</urlset>`.trim()

  return new Response(xml, { headers: { "content-type": "application/xml" } })
}
