import { predictionCodes } from "./data/prediction-codes.js"
import { predictionCastawayKey } from "./predictions.js"

function normalizedName(name) {
  return typeof name === "string" ? name.normalize("NFC").trim().replace(/\s+/g, " ") : ""
}

/** Resolve only permanent public contestant codes; unavailable or ambiguous casts fail closed. */
export function getPredictionCodes(seasonNumber, castaways) {
  if ((typeof seasonNumber !== "string" && typeof seasonNumber !== "number")
    || !/^[1-9]\d*$/.test(String(seasonNumber)) || !Number.isSafeInteger(Number(seasonNumber))
    || !Object.hasOwn(predictionCodes, String(seasonNumber))
    || !Array.isArray(castaways) || castaways.length === 0) return null

  const registry = predictionCodes[String(seasonNumber)]
  if (!Array.isArray(registry) || registry.length === 0) return null
  const codes = new Set()
  const byId = new Map()
  const byName = new Map()
  for (const entry of registry) {
    if (!Array.isArray(entry) || entry.length !== 3) return null
    const [code, id, name] = entry
    const publicName = normalizedName(name)
    if (typeof code !== "string" || !/^[A-Za-z0-9]$/.test(code)
      || typeof id !== "string" || id.trim() === "" || publicName === ""
      || codes.has(code) || byId.has(id) || byName.has(publicName)) return null
    codes.add(code)
    byId.set(id, code)
    byName.set(publicName, code)
  }

  const currentIds = new Set()
  const currentNames = new Set()
  const keyToCode = new Map()
  const codeToKey = new Map()
  for (const person of castaways) {
    if (!person || typeof person !== "object" || Array.isArray(person)) return null
    const name = normalizedName(person.name)
    const rawId = person.id
    const hasId = rawId != null && rawId !== ""
    if (hasId && typeof rawId !== "string" && (typeof rawId !== "number" || !Number.isFinite(rawId))) return null
    const id = hasId ? String(rawId) : null
    if (!name || currentNames.has(name) || (id !== null && (id.trim() === "" || currentIds.has(id)))) return null
    currentNames.add(name)
    if (id !== null) currentIds.add(id)

    const code = byId.get(id) ?? byName.get(name)
    const key = predictionCastawayKey(person)
    if (code === undefined || keyToCode.has(key) || codeToKey.has(code)) return null
    keyToCode.set(key, code)
    codeToKey.set(code, key)
  }
  return { keyToCode, codeToKey }
}
