import assert from "node:assert/strict"
import test from "node:test"
import { actualPlacementFor, buildActualPlacements, sortCastawaysByActualPlacement } from "./prediction-results.js"

test("unique IDs take priority over conflicting names and do not share their result with a name fallback", () => {
  const cast = [{ id: "a", name: "Ada" }, { id: "b", name: "Bea" }, { id: "c", name: "Cora" }]
  const results = [
    { id: "a", name: "Bea", result_order: 1 },
    { id: "new-a", name: "Ada", result_order: 2 },
    { id: "c", name: "Updated Cora", result_order: 3 },
  ]
  assert.deepEqual(buildActualPlacements(cast, results), { "id:a": 1, "id:c": 3 })
  assert.deepEqual(buildActualPlacements([...cast].reverse(), results), { "id:c": 3, "id:a": 1 })
})

test("different IDs can match unique public names with whitespace, case, and canonical Unicode normalization", () => {
  const cast = [
    { id: "preseason-1", name: "Émile   Smith" },
    { name: "  Ada Jones " },
    { id: 0, name: "Bea" },
  ]
  const results = [
    { id: "backend-1", name: "  E\u0301MILE\tSMITH  ", result_order: 2 },
    { id: "backend-2", name: "ada\n jones", result_order: 3 },
    { id: "0", name: "Changed Bea", result_order: 1 },
  ]
  assert.deepEqual(buildActualPlacements(cast, results), {
    "id:preseason-1": 2,
    "name:  Ada Jones ": 3,
    "id:0": 1,
  })
  assert.deepEqual(buildActualPlacements([{ name: "Émile" }], [{ name: "Emile", result_order: 1 }]), {})
  assert.deepEqual(buildActualPlacements([{ name: "Ada Jones" }], [{ name: "Ada", result_order: 1 }]), {})
})

test("duplicate IDs skip safely even when a unique name could otherwise match", () => {
  assert.deepEqual(buildActualPlacements(
    [{ id: "same", name: "Ada" }, { id: "same", name: "Bea" }],
    [{ id: "same", name: "Ada", result_order: 1 }, { id: "other", name: "Bea", result_order: 2 }],
  ), {})
  assert.deepEqual(buildActualPlacements(
    [{ id: "same", name: "Ada" }, { id: "preseason-bea", name: "Bea" }],
    [{ id: "same", name: "Ada", result_order: 1 }, { id: "same", name: "Bea", result_order: 2 }],
  ), {})
})

test("name fallbacks must be unique in both casts while unique ID matches remain usable", () => {
  const cast = [{ id: "a", name: "Ada" }, { id: "b", name: " ada " }, { id: "c", name: "Cora" }]
  assert.deepEqual(buildActualPlacements(cast, [
    { id: "a", name: "Ada", result_order: 1 },
    { id: "new-b", name: "Ada", result_order: 2 },
    { id: "new-c", name: "Cora", result_order: 3 },
  ]), { "id:a": 1, "id:c": 3 })
  assert.deepEqual(buildActualPlacements([{ name: "Ada" }], [
    { name: "Ada", result_order: 1 },
    { name: " ADA ", result_order: 1 },
  ]), {})
  assert.deepEqual(buildActualPlacements([{ name: "Ada" }, { name: " ADA " }], [
    { name: "Ada", result_order: 1 },
  ]), {})
})

test("only explicit integer placements in cast bounds are recorded, without status or spoiler-flag inference", () => {
  const invalid = [undefined, null, "1", "", false, 0, -1, 1.5, NaN, Infinity, 3]
  for (const result_order of invalid) {
    assert.deepEqual(buildActualPlacements(
      [{ id: "a", name: "Ada", result_order: 1 }, { id: "b", name: "Bea" }],
      [{ id: "a", result_order, show_spoilers: true, is_winner: true, is_on_jury: true, status: "Winner" }],
    ), {})
  }
  assert.deepEqual(buildActualPlacements([{ id: "a" }], [
    { id: "a", result_order: 1, show_spoilers: false },
  ]), { "id:a": 1 })
  assert.deepEqual(buildActualPlacements([{ id: "a" }], [Object.assign(Object.create({ result_order: 1 }), { id: "a" })]), {})
})

test("malformed input is harmless and source arrays and records remain unchanged", () => {
  for (const value of [undefined, null, {}, "cast", 1]) {
    assert.deepEqual(buildActualPlacements(value, []), {})
    assert.deepEqual(buildActualPlacements([], value), {})
  }
  assert.deepEqual(buildActualPlacements([null, undefined, "Ada", [], {}], [null, 1, [], {}]), {})
  const cast = Object.freeze([Object.freeze({ id: "a", name: "Ada" })])
  const results = Object.freeze([Object.freeze({ id: "a", result_order: 1 })])
  assert.deepEqual(buildActualPlacements(cast, results), { "id:a": 1 })
  assert.deepEqual(cast, [{ id: "a", name: "Ada" }])
  assert.deepEqual(results, [{ id: "a", result_order: 1 }])
})

test("placement lookups support objects and Maps by identity after prediction reordering", () => {
  const cast = [{ id: "a", name: "Ada" }, { id: "b", name: "Bea" }, { name: "Cora" }]
  const placements = buildActualPlacements(cast, [
    { name: "Cora", result_order: 2 },
    { id: "b", result_order: 1 },
    { id: "a", result_order: 3 },
  ])
  const order = [cast[2], cast[0], cast[1]]
  for (const lookup of [placements, new Map(Object.entries(placements))]) {
    assert.deepEqual(order.map((person) => actualPlacementFor(person, lookup, cast.length)), [2, 3, 1])
    assert.equal(actualPlacementFor({ id: "a", name: "Renamed Ada" }, lookup, cast.length), 3)
    assert.equal(actualPlacementFor({ id: "missing", result_order: 1 }, lookup, cast.length), null)
  }
})

test("lookups validate bounds and ignore inherited entries or contestant result fields", () => {
  const person = { id: "a", result_order: 1, show_spoilers: true }
  for (const lookup of [undefined, null, [], "a", Object.create({ "id:a": 1 }), {}]) {
    assert.equal(actualPlacementFor(person, lookup, 2), null)
  }
  for (const value of [undefined, null, "1", false, 0, -1, 3, 1.5, NaN, Infinity]) {
    assert.equal(actualPlacementFor(person, { "id:a": value }, 2), null)
    assert.equal(actualPlacementFor(person, new Map([["id:a", value]]), 2), null)
  }
  for (const castSize of [undefined, null, "2", 0, -1, 1.5, Infinity]) {
    assert.equal(actualPlacementFor(person, { "id:a": 1 }, castSize), null)
  }
  assert.equal(actualPlacementFor(null, { "id:a": 1 }, 2), null)
  assert.equal(actualPlacementFor(person, Object.assign(Object.create(null), { "id:a": 2 }), 2), 2)
})

test("actual order keeps unrecorded castaways alphabetically first and sorts recorded finishes ascending", () => {
  const cast = [
    { id: "z", name: "Zoë" }, { id: "c", name: "Cora" }, { id: "b", name: "Bea" },
    { id: "e", name: "Émile" }, { id: "a", name: "Ada" },
  ]
  const placements = { "id:z": 4, "id:b": 5 }
  for (const people of [cast, [...cast].reverse(), [...cast.slice(2), ...cast.slice(0, 2)]]) {
    assert.deepEqual(sortCastawaysByActualPlacement(people, placements).map((person) => person.name), ["Ada", "Cora", "Émile", "Zoë", "Bea"])
  }
  const cast21 = Array.from({ length: 21 }, (_, index) => ({ id: String(index), name: `Castaway ${index + 1}` }))
  const ordered21 = sortCastawaysByActualPlacement([...cast21].reverse(), { "id:0": 21, "id:1": 20 })
  assert.equal(ordered21.length, 21)
  assert.deepEqual(ordered21.slice(-2).map((person) => person.id), ["1", "0"])
})

test("a complete season starts with the winner and repeated placements use alphabetical ties", () => {
  const cast = [{ id: "c", name: "Cora" }, { id: "b", name: "Bea" }, { id: "a", name: "Ada" }]
  assert.deepEqual(sortCastawaysByActualPlacement(cast, { "id:c": 1, "id:a": 2, "id:b": 3 }).map((person) => person.name), ["Cora", "Ada", "Bea"])
  for (const placements of [{ "id:a": 2, "id:b": 2, "id:c": 3 }, new Map([["id:a", 2], ["id:b", 2], ["id:c", 3]])]) {
    assert.deepEqual(sortCastawaysByActualPlacement(cast, placements).map((person) => person.name), ["Ada", "Bea", "Cora"])
  }
})

test("invalid or absent explicit placements remain unrecorded without trusting raw result fields", () => {
  const cast = [
    { id: "c", name: "Cora", result_order: 1, is_winner: true },
    { id: "b", name: "Bea", result_order: 2, is_on_jury: true },
    { id: "a", name: "Ada", result_order: 3, show_spoilers: true },
  ]
  for (const placements of [undefined, null, {}, Object.create({ "id:c": 1 }), { "id:c": "1", "id:b": 4, "id:a": 0 }, new Map([["id:c", NaN], ["id:b", -1], ["id:a", 1.5]])]) {
    assert.deepEqual(sortCastawaysByActualPlacement(cast, placements).map((person) => person.name), ["Ada", "Bea", "Cora"])
  }
  assert.deepEqual(sortCastawaysByActualPlacement(cast, { "id:c": null, "id:a": Infinity, "id:b": 3 }).map((person) => person.name), ["Ada", "Cora", "Bea"])
  assert.deepEqual(sortCastawaysByActualPlacement(), [])
})

test("actual sorting preserves every object and prediction rank without mutating cast or placements", () => {
  const cast = Object.freeze([
    Object.freeze({ id: "c", name: "Cora", prediction_rank: 1 }),
    Object.freeze({ id: "b", name: "Bea", prediction_rank: 2 }),
    Object.freeze({ id: "a", name: "Ada", prediction_rank: 3 }),
  ])
  const placements = Object.freeze({ "id:c": 3, "id:b": 2 })
  const sorted = sortCastawaysByActualPlacement(cast, placements)
  assert.deepEqual(sorted, [cast[2], cast[1], cast[0]])
  assert.equal(sorted[0], cast[2])
  assert.equal(sorted[1], cast[1])
  assert.equal(sorted[2], cast[0])
  assert.deepEqual(sorted.map((person) => person.prediction_rank), [3, 2, 1])
  assert.deepEqual(cast.map((person) => person.id), ["c", "b", "a"])
  assert.deepEqual(placements, { "id:c": 3, "id:b": 2 })
  assert.notEqual(sorted, cast)
})
