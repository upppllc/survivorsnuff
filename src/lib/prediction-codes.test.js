import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import test from "node:test"
import { predictionCodes } from "./data/prediction-codes.js"
import { castaways as season51Castaways } from "./data/season-51.js"
import { getPredictionCodes } from "./prediction-codes.js"
import { predictionCastawayKey } from "./predictions.js"

const castFor = (season) => predictionCodes[season].map(([, id, name]) => ({ id, name }))

test("the versioned registry contains only unique public identity triples and stable valid codes for all 51 seasons", () => {
  for (let season = 1; season <= 51; season++) assert.ok(Object.hasOwn(predictionCodes, String(season)))
  let count = 0
  for (const [season, entries] of Object.entries(predictionCodes)) {
    const codes = new Set()
    const ids = new Set()
    const names = new Set()
    for (const entry of entries) {
      assert.equal(entry.length, 3)
      const [code, id, name] = entry
      assert.match(code, /^[A-Za-z0-9]$/)
      assert.equal(typeof id, "string")
      assert.ok(id.trim().length > 0)
      assert.equal(typeof name, "string")
      assert.ok(name.trim().length > 0)
      const normalized = name.normalize("NFC").trim().replace(/\s+/g, " ")
      assert.ok(!codes.has(code), `Duplicate code in season ${season}`)
      assert.ok(!ids.has(id), `Duplicate ID in season ${season}`)
      assert.ok(!names.has(normalized), `Duplicate name in season ${season}`)
      codes.add(code)
      ids.add(id)
      names.add(normalized)
      count += 1
    }
    const mappings = getPredictionCodes(season, castFor(season))
    assert.ok(mappings)
    assert.equal(mappings.keyToCode.size, entries.length)
    assert.equal(mappings.codeToKey.size, entries.length)
    for (const [code, id] of entries) {
      assert.equal(mappings.keyToCode.get(`id:${id}`), code)
      assert.equal(mappings.codeToKey.get(code), `id:${id}`)
    }
  }
  assert.ok(count >= 938)
})

test("all original season 1–51 codes remain assigned to their original contestant IDs", () => {
  // This fixed scope excludes mutable names and permits appended codes/new seasons.
  // Never change these counts or the digest to accommodate reassigned existing codes.
  const initialCastSizes = [
    16, 16, 16, 16, 16, 16, 16, 18, 18, 20, 18, 16, 20, 19, 16, 20, 18,
    16, 20, 20, 20, 18, 18, 18, 18, 20, 20, 18, 18, 18, 20, 18, 20, 20,
    18, 20, 20, 18, 20, 20, 18, 18, 18, 18, 18, 18, 18, 18, 18, 24, 21,
  ]
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  const originalAssignments = initialCastSizes.flatMap((count, index) => {
    const season = index + 1
    const identities = new Map(predictionCodes[String(season)].map(([code, id]) => [code, id]))
    return [...alphabet.slice(0, count)].map((code) => {
      assert.ok(identities.has(code), `Missing permanent code ${code} from season ${season}`)
      return [season, code, identities.get(code)]
    })
  })
  const digest = createHash("sha256").update(JSON.stringify(originalAssignments)).digest("hex")
  assert.equal(digest, "63e597c9ec27b0aa7d86b4910de0d1b9c72d0e4ec838151b2195b3735e140b8b",
    "Restore the original code-to-ID assignments; do not update this digest to accept reassigned codes.")
})

test("codes stay fixed after source shuffles, predictions, and result metadata changes", () => {
  const original = castFor(1)
  const baseline = getPredictionCodes(1, original)
  const changed = Object.freeze([...original].reverse().map((person, index) => Object.freeze({
    ...person, result_order: index + 1, show_spoilers: index % 2 === 0, is_winner: index === 0, prediction_rank: index + 1,
  })))
  const actual = getPredictionCodes("1", changed)
  assert.deepEqual(actual.keyToCode, baseline.keyToCode)
  assert.deepEqual(actual.codeToKey, baseline.codeToKey)
  assert.deepEqual(original, castFor(1))
})

test("unique IDs preserve codes through renamed public names and take priority over another registered name", () => {
  const cast = castFor(1)
  const [first, second] = cast
  const mappings = getPredictionCodes(1, [
    { ...first, name: second.name },
    { ...second, name: "Renamed contestant" },
  ])
  assert.equal(mappings.keyToCode.get(predictionCastawayKey(first)), "A")
  assert.equal(mappings.keyToCode.get(predictionCastawayKey(second)), "B")
})

test("season 51 preseason IDs use exact public name fallback to the permanent database identities", () => {
  const mappings = getPredictionCodes(51, season51Castaways)
  assert.ok(mappings)
  assert.equal(mappings.keyToCode.size, 21)
  for (const person of season51Castaways) {
    const [code, databaseId] = predictionCodes[51].find(([, , name]) => name === person.name)
    assert.notEqual(person.id, databaseId)
    assert.equal(mappings.keyToCode.get(predictionCastawayKey(person)), code)
    assert.equal(mappings.codeToKey.get(code), predictionCastawayKey(person))
  }
})

test("name fallback normalizes only Unicode and whitespace, preserving case, accents, and punctuation", () => {
  const [, , name] = predictionCodes[51][0]
  const person = { name: `  ${name.replace(" ", "\t\n")}  ` }
  const mappings = getPredictionCodes(51, [person])
  assert.equal(mappings.keyToCode.get(predictionCastawayKey(person)), "A")
  assert.equal(getPredictionCodes(51, [{ name: name.toLowerCase() }]), null)
  assert.equal(getPredictionCodes(51, [{ name: "Aaliyah" }]), null)
  const accentEntry = Object.entries(predictionCodes).flatMap(([season, entries]) => entries.map((entry) => [season, entry]))
    .find(([, [, , publicName]]) => publicName.normalize("NFD") !== publicName)
  assert.ok(accentEntry)
  const [season, [code, , publicName]] = accentEntry
  assert.equal(getPredictionCodes(season, [{ name: publicName.normalize("NFD") }]).keyToCode.get(`name:${publicName.normalize("NFD")}`), code)
  assert.equal(getPredictionCodes(season, [{ name: publicName.normalize("NFD").replace(/\p{M}/gu, "") }]), null)
})

test("duplicate IDs, names, identities, and competing code matches invalidate the complete cast", () => {
  const [first, second] = castFor(1)
  assert.equal(getPredictionCodes(1, [first, { ...second, id: first.id }]), null)
  assert.equal(getPredictionCodes(1, [first, { ...second, name: first.name }]), null)
  assert.equal(getPredictionCodes(1, [first, { ...second, name: ` ${first.name} ` }]), null)
  assert.equal(getPredictionCodes(1, [first, first]), null)
  assert.equal(getPredictionCodes(1, [{ ...first, name: "Renamed contestant" }, { id: "new-id", name: first.name }]), null)
  assert.equal(getPredictionCodes(1, [{ id: "new-id", name: first.name }, { ...first, name: "Renamed contestant" }]), null)
})

test("cast subsets expose only available codes without reassigning missing contestants", () => {
  const cast = castFor(1)
  const mappings = getPredictionCodes(1, [cast[2], cast[0]])
  assert.deepEqual(mappings.keyToCode, new Map([[predictionCastawayKey(cast[2]), "C"], [predictionCastawayKey(cast[0]), "A"]]))
  assert.deepEqual(mappings.codeToKey, new Map([["C", predictionCastawayKey(cast[2])], ["A", predictionCastawayKey(cast[0])]]))
  assert.equal(mappings.codeToKey.has("B"), false)
  assert.equal(mappings.codeToKey.has("P"), false)
  assert.equal(getPredictionCodes(1, [cast[0], { id: "unknown", name: "Unknown contestant" }]), null)
})

test("unknown or noncanonical seasons and empty or malformed casts return null", () => {
  const cast = castFor(1)
  for (const season of [undefined, null, {}, [], true, 0, -1, 1.5, Infinity, NaN, "01", "1.0", " 1", "1 ", "1e0", Number.MAX_SAFE_INTEGER, "toString", "__proto__"]) {
    assert.equal(getPredictionCodes(season, cast), null)
  }
  for (const invalid of [undefined, null, {}, "cast", [], [null], [undefined], ["name"], [[]], [{}], [{ id: cast[0].id }], [{ id: {}, name: cast[0].name }], [{ id: NaN, name: cast[0].name }], [{ id: " ", name: cast[0].name }]]) {
    assert.equal(getPredictionCodes(1, invalid), null)
  }
})
