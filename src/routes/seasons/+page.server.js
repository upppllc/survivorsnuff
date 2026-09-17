import { getSeasons } from "$lib/server/seasons"
import { publicSeasonDate } from "$lib/season-public-data.js"

export async function load({ fetch }) {
  const seasons = await getSeasons(fetch)
  return {
    seasons: seasons.map((season) => ({
      season_number: season.season_number,
      first_air_time: publicSeasonDate(season.first_air_time),
    })),
  }
}
