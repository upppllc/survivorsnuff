import { predictionCastawayKey } from "./predictions.js"

const isPerson = (value) => value !== null && typeof value === "object" && !Array.isArray(value)

function personId(person) {
  const id = person.id
  if (typeof id === "string") return id === "" ? null : id
  return typeof id === "number" && Number.isFinite(id) ? String(id) : null
}

function publicName(person) {
  if (typeof person.name !== "string") return null
  return person.name.normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase() || null
}

function uniqueIndex(people, keyFor) {
  const index = new Map()
  for (const person of people) {
    const key = keyFor(person)
    if (key !== null) index.set(key, index.has(key) ? null : person)
  }
  return index
}

function validPlacement(value, castSize) {
  return Number.isInteger(castSize) && castSize > 0 && Number.isInteger(value) && value >= 1 && value <= castSize
    ? value
    : null
}

/** Match explicitly loaded results to the neutral cast without inferring placements. */
export function buildActualPlacements(castaways, resultCastaways) {
  const placements = {}
  if (!Array.isArray(castaways) || !Array.isArray(resultCastaways)) return placements

  const cast = castaways.filter(isPerson)
  const results = resultCastaways.filter(isPerson)
  const castIds = uniqueIndex(cast, personId)
  const resultIds = uniqueIndex(results, personId)
  const castNames = uniqueIndex(cast, publicName)
  const resultNames = uniqueIndex(results, publicName)
  const matches = new Map()
  const claimedResults = new Set()
  const unmatched = []

  // Claim all unambiguous ID matches before any name fallback can use them.
  for (const person of cast) {
    const id = personId(person)
    if (id !== null && castIds.get(id) !== person) continue
    if (id !== null && resultIds.has(id)) {
      const result = resultIds.get(id)
      if (result) {
        matches.set(person, result)
        claimedResults.add(result)
      }
    } else {
      unmatched.push(person)
    }
  }

  for (const person of unmatched) {
    const name = publicName(person)
    if (name === null || castNames.get(name) !== person) continue
    const result = resultNames.get(name)
    if (!result || claimedResults.has(result)) continue
    const resultId = personId(result)
    if (resultId !== null && resultIds.get(resultId) !== result) continue
    matches.set(person, result)
    claimedResults.add(result)
  }

  for (const [person, result] of matches) {
    const placement = Object.hasOwn(result, "result_order")
      ? validPlacement(result.result_order, castaways.length)
      : null
    if (placement !== null) placements[predictionCastawayKey(person)] = placement
  }
  return placements
}

/** Read only an explicitly provided placement for this prediction identity. */
export function actualPlacementFor(person, actualPlacements, castSize) {
  if (!isPerson(person)) return null
  const key = predictionCastawayKey(person)
  if (actualPlacements instanceof Map) return validPlacement(actualPlacements.get(key), castSize)
  if (!isPerson(actualPlacements) || !Object.hasOwn(actualPlacements, key)) return null
  return validPlacement(actualPlacements[key], castSize)
}
