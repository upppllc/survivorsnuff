import { sortCastawaysAlphabetically } from "./castaways.js"
import { formatSeasonDate, seasonDateTimestamp } from "./season-dates.js"

const seasonFields = [
  "id", "season_number", "title", "location", "contestant_count", "photo_credit", "photo_source_url", "source_url",
]
const castawayFields = [
  "id", "season_number", "name", "age", "occupation", "hometown", "current_residence", "residence",
  "image_url", "image_storage_id", "photo_source_url", "photo_credit", "image_credit", "source_url", "age_basis",
]
const episodeFields = ["episode_number", "season_number"]
const dateNumberFields = ["year", "month", "day_of_month", "hour", "minute", "second"]
const dateGranularities = new Set(["year", "month", "week", "day", "hour", "minute", "second"])
const isoDate = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/

function pickScalars(value, fields) {
  const result = {}
  for (const field of fields) {
    const item = value?.[field]
    if (item === null || typeof item === "string" || (typeof item === "number" && Number.isFinite(item))) {
      result[field] = item
    }
  }
  return result
}

/** Keep date values without accidentally carrying a nested synopsis or free text. */
export function publicSeasonDate(value) {
  if (typeof value === "string") {
    const date = value.trim()
    return isoDate.test(date) && seasonDateTimestamp(date) !== null ? date : null
  }
  if (!value || typeof value !== "object") return null
  const date = {}
  for (const field of dateNumberFields) {
    const item = value[field]
    if (item !== null && item !== undefined && item !== "" && Number.isInteger(Number(item))) {
      date[field] = Number(item)
    }
  }
  if (!formatSeasonDate(date)) return publicSeasonDate(typeof value.datetime === "string" ? value.datetime : null)
  if (dateGranularities.has(value.granularity)) date.granularity = value.granularity
  if (typeof value.timezone === "string" && value.timezone.trim()) {
    try {
      // Canonicalize valid zones and discard legacy null markers or arbitrary text.
      date.timezone = new Intl.DateTimeFormat("en-US", { timeZone: value.timezone }).resolvedOptions().timeZone
    } catch {
      // Unknown timezone does not make an otherwise known calendar date disappear.
    }
  }
  return date
}

/** The default browser payload contains cast facts and schedules only. */
export function publicSeasonData(data) {
  const season = pickScalars(data?.season, seasonFields)
  if (data?.season?.first_air_time !== undefined) season.first_air_time = publicSeasonDate(data.season.first_air_time)
  const castaways = sortCastawaysAlphabetically(
    (Array.isArray(data?.castaways) ? data.castaways : []).map((row) => pickScalars(row, castawayFields))
  )
  const episodes = (Array.isArray(data?.episodes) ? data.episodes : [])
    .map((row) => ({ ...pickScalars(row, episodeFields), air_time: publicSeasonDate(row?.air_time) }))
    .sort((a, b) => a.episode_number - b.episode_number)
  return { season, castaways, episodes }
}
