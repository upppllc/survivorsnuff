import assert from "node:assert/strict"
import test from "node:test"
import { movePredictionCastaway, movePredictionCastawayTo, orderPredictionCastaways, predictionCastawayKey } from "./predictions.js"

const castaways = [
  { id: "zoe", name: "Zoe", result_order: 1, is_on_jury: false },
  { id: "emile", name: "Émile", result_order: 2, is_on_jury: true },
  { id: "amy", name: "Amy", result_order: 20, is_on_jury: false },
  { id: "ben", name: "Ben", result_order: 8, is_on_jury: true },
]
const keys = (people) => people.map(predictionCastawayKey)

test("prediction identities use stable IDs with a separate name fallback", () => {
  assert.equal(predictionCastawayKey({ id: "amy", name: "Amy" }), "id:amy")
  assert.equal(predictionCastawayKey({ id: "amy", name: "Updated name" }), "id:amy")
  assert.equal(predictionCastawayKey({ id: 0, name: "Amy" }), "id:0")
  assert.equal(predictionCastawayKey({ name: "amy" }), "name:amy")
  assert.equal(predictionCastawayKey({ id: "", name: "Amy" }), "name:Amy")
})

test("initial prediction order is alphabetical regardless of source order and actual results", () => {
  const expected = ["Amy", "Ben", "Émile", "Zoe"]
  assert.deepEqual(orderPredictionCastaways(castaways).map((person) => person.name), expected)
  const changedResults = [...castaways].reverse().map((person) => ({
    ...person, result_order: 30 - person.result_order, is_on_jury: !person.is_on_jury,
  }))
  assert.deepEqual(orderPredictionCastaways(changedResults).map((person) => person.name), expected)
})

test("stale and duplicate order keys preserve chosen ranks and append missing people alphabetically", () => {
  const order = ["id:removed", "id:zoe", "id:zoe", "id:ben", "id:removed"]
  assert.deepEqual(keys(orderPredictionCastaways(castaways, order)), ["id:zoe", "id:ben", "id:amy", "id:emile"])
  assert.deepEqual(movePredictionCastaway(castaways, order, "id:ben", -1), ["id:ben", "id:zoe", "id:amy", "id:emile"])
})

test("repeated moves keep every contestant exactly once and update their adjacent rank", () => {
  let order = movePredictionCastaway(castaways, [], "id:zoe", -1)
  assert.deepEqual(order, ["id:amy", "id:ben", "id:zoe", "id:emile"])
  order = movePredictionCastaway(castaways, order, "id:zoe", -1)
  order = movePredictionCastaway(castaways, order, "id:zoe", -1)
  assert.deepEqual(order, ["id:zoe", "id:amy", "id:ben", "id:emile"])
  order = movePredictionCastaway(castaways, order, "id:amy", 1)
  assert.deepEqual(order, ["id:zoe", "id:ben", "id:amy", "id:emile"])
  assert.deepEqual([...order].sort(), keys(castaways).sort())
  assert.equal(new Set(order).size, castaways.length)
})

test("bounds, unknown contestants, and invalid directions safely return normalized order", () => {
  const expected = ["id:amy", "id:ben", "id:emile", "id:zoe"]
  for (const [key, direction] of [["id:amy", -1], ["id:zoe", 1], ["id:missing", 1], ["id:ben", 0], ["id:ben", 2]]) {
    assert.deepEqual(movePredictionCastaway(castaways, ["id:missing"], key, direction), expected)
  }
  assert.deepEqual(orderPredictionCastaways(), [])
  assert.deepEqual(movePredictionCastaway([], ["id:missing"], "id:missing", -1), [])
})

test("ordering and moving do not mutate castaways, person objects, or the saved order", () => {
  const people = Object.freeze(castaways.map((person) => Object.freeze({ ...person })))
  const order = Object.freeze(["id:zoe", "id:amy"])
  const before = structuredClone(people)
  const result = orderPredictionCastaways(people, order)
  assert.equal(result[0], people[0])
  movePredictionCastaway(people, order, "id:amy", -1)
  assert.deepEqual(people, before)
  assert.deepEqual(order, ["id:zoe", "id:amy"])
  assert.notEqual(result, people)
})

test("dragging to a distant position preserves the complete order without mutating the draft", () => {
  const order = Object.freeze(["id:amy", "id:ben", "id:emile", "id:zoe"])
  assert.deepEqual(movePredictionCastawayTo(castaways, order, "id:amy", "id:emile"), ["id:ben", "id:emile", "id:amy", "id:zoe"])
  assert.deepEqual(movePredictionCastawayTo(castaways, order, "id:zoe", "id:amy"), ["id:zoe", "id:amy", "id:ben", "id:emile"])
  for (const [source, target] of [["id:amy", "id:amy"], ["missing", "id:amy"], ["id:amy", "missing"]]) {
    assert.deepEqual(movePredictionCastawayTo(castaways, order, source, target), order)
  }
  assert.deepEqual(order, ["id:amy", "id:ben", "id:emile", "id:zoe"])
  assert.deepEqual(movePredictionCastawayTo(castaways, ["id:zoe", "id:zoe", "missing"], "id:amy", "id:zoe"), ["id:amy", "id:zoe", "id:ben", "id:emile"])
})
