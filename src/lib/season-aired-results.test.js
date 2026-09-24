import assert from "node:assert/strict"
import test from "node:test"
import currentSeason from "./data/season-51.js"
import { applyAiredResults } from "./server/season-aired-results.js"
import { publicSeasonData } from "./season-public-data.js"

test("the reviewed aired result survives a backend outage without changing preseason data", () => {
  const original = structuredClone(currentSeason)
  const castaways = applyAiredResults(51, currentSeason.castaways)
  assert.equal(castaways.find((person) => person.name === "Aaliyah Puglia").result_order, 21)
  assert.equal(castaways.filter((person) => person.result_order != null).length, 1)
  assert.deepEqual(castaways.map((person) => person.name), original.castaways.map((person) => person.name))
  assert.deepEqual(currentSeason, original)
  assert.ok(currentSeason.castaways.every((person) => person.result_order == null))
})

test("reviewed placements apply to remote identities while preserving every unrelated value", () => {
  const castaways = Object.freeze([
    Object.freeze({ id: "remote-other", name: "Synthetic Player", season_number: 51, result_order: 10, extra: "retained" }),
    Object.freeze({ id: "remote-aaliyah", name: "Aaliyah Puglia", season_number: 51, result_order: null, image_storage_id: "photo" }),
  ])
  const result = applyAiredResults("51", castaways)
  assert.notEqual(result, castaways)
  assert.deepEqual(result, [castaways[0], { ...castaways[1], result_order: 21 }])
  assert.equal(castaways[1].result_order, null)
  assert.equal(applyAiredResults(51, [{ ...castaways[1], result_order: 1 }])[0].result_order, 21)
})

test("reviewed results never cross seasons, guess identities, or apply to ambiguous names", () => {
  const castaways = [
    { id: "aaliyah", name: "Aaliyah Puglia", season_number: 50, result_order: null },
    { id: "similar", name: "Aaliyah Puglia Jr.", season_number: 51, result_order: null },
    { id: "missing-season", name: "Aaliyah Puglia", result_order: null },
  ]
  assert.deepEqual(applyAiredResults(51, castaways), castaways)
  assert.deepEqual(applyAiredResults(50, castaways), castaways)
  assert.deepEqual(applyAiredResults(52, currentSeason.castaways), currentSeason.castaways)
  const duplicate = [1, 2].map((id) => ({ id, name: "Aaliyah Puglia", season_number: 51, result_order: null }))
  assert.deepEqual(applyAiredResults(51, duplicate), duplicate)
  assert.deepEqual(applyAiredResults(51), [])
})

test("default serialized season data is identical before and after adding aired results", () => {
  const withResults = { ...currentSeason, castaways: applyAiredResults(51, currentSeason.castaways) }
  const publicData = publicSeasonData(withResults)
  assert.deepEqual(publicData, publicSeasonData(currentSeason))
  const serialized = JSON.stringify(publicData)
  assert.ok(!serialized.includes("result_order"))
  assert.ok(!serialized.includes("tvline.com"))
  assert.equal(publicData.castaways.length, 21)
  assert.ok(publicData.castaways.every((person) => !("is_on_jury" in person)))
})
