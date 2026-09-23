import { orderPredictionCastaways, predictionCastawayKey } from "./predictions.js"

const PARAMETER = "prediction"
const VERSION = 2
const MAX_PAYLOAD_LENGTH = 20_000
const MAX_ORDER_LENGTH = 200

function normalizedAuthorName(value) {
  if (typeof value !== "string") return ""
  return Array.from(value.trim().replace(/\s+/g, " ")).slice(0, 100).join("").trim()
}

function normalizedOrder(castaways, order) {
  return [...new Set(orderPredictionCastaways(castaways, order).map(predictionCastawayKey))]
}

function resolveOrder(castaways, entries) {
  const knownKeys = new Set(castaways.map(predictionCastawayKey))
  const names = new Map()
  for (const person of castaways) {
    const name = String(person.name ?? "")
    names.set(name, names.has(name) ? null : predictionCastawayKey(person))
  }
  return entries.flatMap((entry) => {
    if (typeof entry === "string") return knownKeys.has(entry) ? [entry] : []
    if (!Array.isArray(entry) || entry.length !== 2 || typeof entry[0] !== "string" || typeof entry[1] !== "string") return []
    if (knownKeys.has(entry[0])) return [entry[0]]
    const fallback = names.get(entry[1])
    return fallback ? [fallback] : []
  })
}

/** Read only explicitly versioned personal predictions for the current season. */
export function readPredictionUrl(url, seasonNumber, castaways = []) {
  try {
    const parameters = new URL(url).searchParams
    const values = parameters.getAll(PARAMETER)
    if (values.length !== 1 || values[0].length > MAX_PAYLOAD_LENGTH) return null
    const payload = JSON.parse(values[0])
    if (!Array.isArray(payload)) return null
    const legacy = payload[0] === 1 && payload.length === 3
    const named = payload[0] === VERSION && payload.length === 4 && typeof payload[3] === "string"
    if ((!legacy && !named) || !/^[1-9]\d*$/.test(String(seasonNumber)) || payload[1] !== String(seasonNumber)
      || !Array.isArray(payload[2]) || payload[2].length > MAX_ORDER_LENGTH) return null
    return {
      order: normalizedOrder(castaways, resolveOrder(castaways, payload[2])),
      authorName: legacy ? "" : normalizedAuthorName(payload[3]),
    }
  } catch {
    return null
  }
}

/** Clone the URL, preserving unrelated parameters and hash; null exits prediction mode. */
export function writePredictionUrl(url, seasonNumber, castaways = [], order = null, authorName = "") {
  const next = new URL(url)
  next.searchParams.delete(PARAMETER)
  if (order !== null && /^[1-9]\d*$/.test(String(seasonNumber))) {
    const people = new Map(castaways.map((person) => [predictionCastawayKey(person), person]))
    // Public names keep bookmarks usable when backend IDs differ from fallback source IDs.
    const entries = normalizedOrder(castaways, order).map((key) => [key, String(people.get(key)?.name ?? "")])
    next.searchParams.set(PARAMETER, JSON.stringify([VERSION, String(seasonNumber), entries, normalizedAuthorName(authorName)]))
  }
  return next
}
