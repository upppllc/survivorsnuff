const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
})

function integer(value) {
  if (value === null || value === undefined || value === "") return null
  const number = Number(value)
  return Number.isInteger(number) ? number : null
}

function calendarDate(year, month, day, hour = 0, minute = 0, second = 0) {
  if (year === null || month === null || day === null || year < 1 || year > 9999) return null
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) return null
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, day)
  date.setUTCHours(hour, minute, second, 0)
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
  return date
}

function parseDate(value) {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? { date: value, timestamp: value.getTime() } : null
  if (typeof value === "string") {
    // Read the date in the supplied ISO representation, avoiding a date shift
    // between the server and a viewer in a different timezone.
    const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/)
    if (!match) return null
    const date = calendarDate(Number(match[1]), Number(match[2]), Number(match[3]))
    let iso = value.trim()
    if (iso.includes("T") && !/(?:Z|[+-]\d{2}:?\d{2})$/i.test(iso)) iso += "Z"
    const timestamp = Date.parse(iso)
    return date && Number.isFinite(timestamp) ? { date, timestamp } : null
  }
  if (!value || typeof value !== "object") return null
  const date = calendarDate(integer(value.year), integer(value.month), integer(value.day_of_month),
    integer(value.hour) ?? 0, integer(value.minute) ?? 0, integer(value.second) ?? 0)
  if (!date) return typeof value.datetime === "string" ? parseDate(value.datetime) : null
  // Some archive rows encode a missing timezone as the literal "/null" or ".null".
  const timezone = !value.timezone || /^[/.]?null$/i.test(value.timezone) ? "UTC" : value.timezone
  return { date, timezone }
}

/** Format a Contibase calendar-time object or ISO string; unknown dates are empty. */
export function formatSeasonDate(value) {
  const parsed = parseDate(value)
  return parsed ? dateFormatter.format(parsed.date) : ""
}

/** Milliseconds since the Unix epoch, or null for an unknown/invalid date. */
export function seasonDateTimestamp(value) {
  const parsed = parseDate(value)
  if (!parsed) return null
  if (parsed.timestamp !== undefined) return parsed.timestamp
  if (parsed.timezone === "UTC") return parsed.date.getTime()
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: parsed.timezone,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    })
    const wallTime = parsed.date.getTime()
    let timestamp = wallTime
    // A second pass handles a timezone offset crossing a daylight-saving boundary.
    for (let pass = 0; pass < 3; pass += 1) {
      const parts = Object.fromEntries(formatter.formatToParts(timestamp).map(({ type, value }) => [type, value]))
      const observed = calendarDate(Number(parts.year), Number(parts.month), Number(parts.day),
        Number(parts.hour), Number(parts.minute), Number(parts.second))
      const correction = wallTime - observed.getTime()
      if (correction === 0) return timestamp
      timestamp += correction
    }
    // Nonexistent local times during a DST jump cannot be compared accurately.
    return null
  } catch {
    return null
  }
}
