import assert from "node:assert/strict"
import test from "node:test"
import { castaways as season51Castaways } from "./data/season-51.js"
import { readPredictionUrl, writePredictionUrl } from "./prediction-url.js"

const castaways = [
  { id: "zoe", name: "Zoë", result_order: 1 },
  { id: "amy", name: "Amy", result_order: 20 },
  { id: "ben", name: "Ben", result_order: 8 },
]
const base = "https://www.survivorsnuff.com/?source=friend&tag=one&tag=two#castaways"
function encodedUrl(payload) {
  const url = new URL(base)
  url.searchParams.set("prediction", JSON.stringify(payload))
  return url
}

test("prediction URL round-trips the chosen order on the home and season routes", () => {
  const order = ["id:ben", "id:zoe", "id:amy"]
  for (const path of ["/", "/seasons/51"]) {
    const url = writePredictionUrl(new URL(path, base), 51, castaways, order)
    assert.deepEqual(readPredictionUrl(url, 51, castaways), { order })
    assert.equal(writePredictionUrl(url, 51, castaways, order).href, url.href)
  }
})

test("writing and clearing predictions preserve unrelated query values and the hash", () => {
  const source = new URL(base)
  const predicted = writePredictionUrl(source, 51, castaways, ["id:zoe"])
  assert.equal(source.href, base, "the original URL is not mutated")
  assert.equal(predicted.searchParams.get("source"), "friend")
  assert.deepEqual(predicted.searchParams.getAll("tag"), ["one", "two"])
  assert.equal(predicted.hash, "#castaways")
  const cleared = writePredictionUrl(predicted, 51, castaways)
  assert.equal(cleared.href, base)
  assert.equal(readPredictionUrl(cleared, 51, castaways), null)
})

test("prediction URL normalization drops stale and duplicate keys and appends new people alphabetically", () => {
  const payload = [1, "51", ["id:gone", "id:zoe", "id:zoe", null, 7, { result: "winner" }]]
  assert.deepEqual(readPredictionUrl(encodedUrl(payload), 51, castaways), { order: ["id:zoe", "id:amy", "id:ben"] })
  const reset = writePredictionUrl(base, 51, castaways, [])
  assert.deepEqual(readPredictionUrl(reset, 51, castaways), { order: ["id:amy", "id:ben", "id:zoe"] })
  assert.deepEqual(readPredictionUrl(writePredictionUrl(base, 51, castaways, ["id:gone", "id:ben", "id:ben"]), 51, castaways), {
    order: ["id:ben", "id:amy", "id:zoe"],
  })
})

test("unrelated seasons, malformed payloads, repeated parameters, and unknown versions never enable predictions", () => {
  const predicted = writePredictionUrl(base, 51, castaways, [])
  assert.equal(readPredictionUrl(predicted, 50, castaways), null)
  assert.equal(readPredictionUrl(base, 51, castaways), null)
  for (const payload of [null, true, {}, [], [1, "51"], [2, "51", []], [1, 51, []], [1, "51", {}], [1, "51", [], "extra"], [1, "51", Array(201).fill("id:amy")]]) {
    assert.equal(readPredictionUrl(encodedUrl(payload), 51, castaways), null)
  }
  const malformed = new URL(base)
  for (const value of ["not-json", "[", "x".repeat(20_001)]) {
    malformed.searchParams.set("prediction", value)
    assert.equal(readPredictionUrl(malformed, 51, castaways), null)
  }
  predicted.searchParams.append("prediction", "anything")
  assert.equal(readPredictionUrl(predicted, 51, castaways), null)
})

test("stable identities survive renamed castaways and Unicode fallback names", () => {
  const people = [...castaways, { name: "Émile, Jr. / #1" }]
  const order = ["name:Émile, Jr. / #1", "id:zoe", "id:amy", "id:ben"]
  const url = writePredictionUrl(base, 51, people, order)
  const renamed = people.map((person) => person.id === "zoe" ? { ...person, name: "New public name" } : person)
  assert.deepEqual(readPredictionUrl(url, 51, renamed), { order })
})

test("public castaway names preserve predictions when backend and fallback record IDs differ", () => {
  const order = ["id:zoe", "id:ben", "id:amy"]
  const url = writePredictionUrl(base, 51, castaways, order)
  const fallback = castaways.map((person) => ({ ...person, id: `fallback-${person.id}` }))
  assert.deepEqual(readPredictionUrl(url, 51, fallback), { order: ["id:fallback-zoe", "id:fallback-ben", "id:fallback-amy"] })
  const backToOriginal = writePredictionUrl(url, 51, fallback, readPredictionUrl(url, 51, fallback).order)
  assert.deepEqual(readPredictionUrl(backToOriginal, 51, castaways), { order })
})

test("ambiguous fallback names cannot select a different contestant", () => {
  const people = [{ id: "a", name: "Same name" }, { id: "b", name: "Same name" }, { id: "c", name: "Zoe" }]
  const url = encodedUrl([1, "51", [["id:gone", "Same name"], ["id:c", "Zoe"]]])
  assert.deepEqual(readPredictionUrl(url, 51, people), { order: ["id:c", "id:a", "id:b"] })
})

test("actual outcomes and backend input order cannot change a neutral prediction URL", () => {
  const before = writePredictionUrl(base, 51, castaways, [])
  const changed = [...castaways].reverse().map((person) => ({ ...person, result_order: 30 - person.result_order, is_on_jury: true }))
  const after = writePredictionUrl(base, 51, changed, [])
  assert.equal(after.href, before.href)
  assert.doesNotMatch(after.search, /result_order|is_on_jury/)
})

test("the complete season 51 order fits a practical bookmark URL", () => {
  const url = writePredictionUrl(base, 51, season51Castaways, [])
  assert.equal(readPredictionUrl(url, 51, season51Castaways).order.length, season51Castaways.length)
  assert.ok(url.href.length < 2000, `URL length was ${url.href.length}`)
})
