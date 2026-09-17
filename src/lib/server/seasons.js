import { env } from "$env/dynamic/private"
import { error } from "@sveltejs/kit"
import currentSeason from "$lib/data/season-51.js"

export const LATEST_SEASON = 51

export async function readTable(fetch, table, filters) {
  const id = env[`CONTIBASE_${table.toUpperCase()}_TABLE_ID`]
  if (!id || !env.CONTIBASE_ACCESS_TOKEN) return null
  const query = new URLSearchParams({ limit: "9000" })
  if (filters) query.set("filters", JSON.stringify(filters))
  try {
    const response = await fetch(`https://www.contibase.com/api/v1/tables/${id}?${query}`, {
      headers: { authorization: `Bearer ${env.CONTIBASE_ACCESS_TOKEN}` },
      signal: AbortSignal.timeout(12000),
    })
    if (!response.ok) return null
    const body = await response.json()
    return Array.isArray(body.rows) ? body.rows : null
  } catch {
    return null
  }
}

export async function getSeasons(fetch) {
  const rows = await readTable(fetch, "seasons")
  const seasons = rows ?? []
  const current = seasons.find((season) => Number(season.season_number) === LATEST_SEASON)
  return [
    ...seasons.filter((season) => Number(season.season_number) !== LATEST_SEASON),
    { ...currentSeason.season, ...current },
  ].sort((a, b) => b.season_number - a.season_number)
}

function mergeRows(baseline, remote, key) {
  const rows = new Map(baseline.map((row) => [String(row[key]), row]))
  for (const row of remote ?? []) rows.set(String(row[key]), { ...rows.get(String(row[key])), ...row })
  return [...rows.values()]
}

export async function getSeason(fetch, seasonNumber) {
  const number = Number(seasonNumber)
  if (!Number.isInteger(number) || number < 1) error(404, "Season not found")
  const filters = { field: "season_number", operator: "eq", value: number }
  const [seasons, episodes, castaways] = await Promise.all([
    readTable(fetch, "seasons", filters),
    readTable(fetch, "episodes", filters),
    readTable(fetch, "castaways", filters),
  ])
  if (number === LATEST_SEASON) {
    return {
      season: { ...currentSeason.season, ...seasons?.[0] },
      episodes: mergeRows(currentSeason.episodes, episodes, "episode_number"),
      castaways: mergeRows(currentSeason.castaways, castaways, "name"),
    }
  }
  if (!seasons || !episodes || !castaways) error(503, "The season archive is temporarily unavailable. Please try again shortly.")
  if (!seasons.length) error(404, "Season not found")
  return { season: seasons[0], episodes, castaways }
}
