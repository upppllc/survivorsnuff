import { env } from "$env/dynamic/private"
import { error } from "@sveltejs/kit"
import { getSeason } from "$lib/server/seasons"
import { publicSeasonDate } from "$lib/season-public-data.js"

export async function loadEpisode(fetch, params, includeSpoilers = false) {
  const episodeNumber = Number(params.episode_number)
  if (!Number.isSafeInteger(episodeNumber) || episodeNumber < 1) error(404, "Episode not found")

  const { season, episodes } = await getSeason(fetch, params.season_number)
  const episode = episodes.find((item) => Number(item.episode_number) === episodeNumber)
  if (!episode) error(404, "Episode not found")

  // Only numbers and the air date may be serialized before an explicit reveal.
  const safeSeason = { season_number: season.season_number }
  if (!includeSpoilers) {
    return {
      season: safeSeason,
      episode: {
        season_number: season.season_number,
        episode_number: episode.episode_number,
        air_time: publicSeasonDate(episode.air_time),
      },
    }
  }

  let post = null
  if (episode.post_id && env.CONTIBASE_ACCESS_TOKEN) {
    try {
      const response = await fetch(`https://www.contibase.com/api/v1/pages/${encodeURIComponent(episode.post_id)}`, {
        headers: { authorization: `Bearer ${env.CONTIBASE_ACCESS_TOKEN}` },
        signal: AbortSignal.timeout(12000),
      })
      if (response.ok) {
        const body = await response.json()
        if (body?.id) post = body
      }
    } catch {
      // Episode details remain available if the optional archived article is unavailable.
    }
  }

  return { season: safeSeason, episode, post, postUnavailable: Boolean(episode.post_id && !post) }
}
