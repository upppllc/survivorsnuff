import assert from "node:assert/strict"
import test from "node:test"
import currentSeason from "./data/season-51.js"
import { applyAiredResults } from "./server/season-aired-results.js"
import { publicSeasonData } from "./season-public-data.js"

const reviewedResults = [
  { name: "Aaliyah Puglia", result_order: 21, departure_reason: "voted_out" },
  { name: "Ana Sani", result_order: 20, departure_reason: "voted_out" },
  { name: "Rob Antonson", result_order: 19, departure_reason: "quit" },
  { name: "Patt Cannaday", result_order: 18, departure_reason: "voted_out" },
]

test("the four reviewed departures survive a backend outage without changing preseason data", () => {
  const original = structuredClone(currentSeason)
  const castaways = applyAiredResults(51, currentSeason.castaways)
  for (const expected of reviewedResults) {
    const person = castaways.find((person) => person.name === expected.name)
    assert.equal(person.result_order, expected.result_order)
    assert.equal(person.departure_reason, expected.departure_reason)
  }
  assert.equal(castaways.filter((person) => person.result_order != null).length, 4)
  assert.equal(castaways.filter((person) => person.departure_reason != null).length, 4)
  assert.deepEqual(castaways.map((person) => person.name), original.castaways.map((person) => person.name))
  assert.deepEqual(currentSeason, original)
  assert.ok(currentSeason.castaways.every((person) => person.result_order == null && person.departure_reason == null))
})

test("reviewed departures override immutable remote records while preserving every unrelated value", () => {
  const castaways = Object.freeze([
    Object.freeze({ id: "remote-other", name: "Synthetic Player", season_number: 51, result_order: 10, departure_reason: "medical_evacuation", extra: "retained" }),
    ...reviewedResults.map((person, index) => Object.freeze({
      id: `remote-${index}`, name: person.name, season_number: 51,
      result_order: 1, departure_reason: "medical_evacuation", image_storage_id: `photo-${index}`,
    })),
  ])
  const result = applyAiredResults("51", castaways)
  assert.notEqual(result, castaways)
  assert.equal(result[0], castaways[0])
  assert.deepEqual(result, [castaways[0], ...reviewedResults.map((expected, index) => ({ ...castaways[index + 1], ...expected }))])
  assert.ok(castaways.slice(1).every((person) => person.result_order === 1 && person.departure_reason === "medical_evacuation"))
})

test("reviewed results never cross seasons, guess identities, or apply to ambiguous names", () => {
  const castaways = reviewedResults.flatMap(({ name }, index) => [
    { id: `other-season-${index}`, name, season_number: 50, result_order: null },
    { id: `similar-${index}`, name: `${name} Jr.`, season_number: 51, result_order: null },
    { id: `missing-season-${index}`, name, result_order: null },
  ])
  assert.deepEqual(applyAiredResults(51, castaways), castaways)
  assert.deepEqual(applyAiredResults(50, castaways), castaways)
  assert.deepEqual(applyAiredResults(52, currentSeason.castaways), currentSeason.castaways)
  const duplicate = reviewedResults.flatMap(({ name }, index) => [1, 2].map((copy) => ({
    id: `${index}-${copy}`, name, season_number: 51, result_order: null,
  })))
  assert.deepEqual(applyAiredResults(51, duplicate), duplicate)
  assert.deepEqual(applyAiredResults(51), [])
})

test("default serialized season data is identical before and after adding aired results", () => {
  const withResults = { ...currentSeason, castaways: applyAiredResults(51, currentSeason.castaways) }
  const publicData = publicSeasonData(withResults)
  assert.deepEqual(publicData, publicSeasonData(currentSeason))
  const serialized = JSON.stringify(publicData)
  assert.ok(!serialized.includes("result_order"))
  assert.ok(!serialized.includes("departure_reason"))
  assert.ok(!serialized.includes("voted_out"))
  assert.ok(!serialized.includes('"quit"'))
  assert.ok(!serialized.includes("tvline.com"))
  assert.equal(publicData.castaways.length, 21)
  assert.ok(publicData.castaways.every((person) => !("is_on_jury" in person)))
})
