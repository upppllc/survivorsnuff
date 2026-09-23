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
    assert.deepEqual(readPredictionUrl(url, 51, castaways), { order, authorName: "" })
    assert.equal(writePredictionUrl(url, 51, castaways, order).href, url.href)
  }
})

test("writing and clearing predictions preserve unrelated query values and the hash", () => {
  const source = new URL(base)
  const predicted = writePredictionUrl(source, 51, castaways, ["id:zoe"], "Jordan")
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
  assert.deepEqual(readPredictionUrl(encodedUrl(payload), 51, castaways), { order: ["id:zoe", "id:amy", "id:ben"], authorName: "" })
  const reset = writePredictionUrl(base, 51, castaways, [])
  assert.deepEqual(readPredictionUrl(reset, 51, castaways), { order: ["id:amy", "id:ben", "id:zoe"], authorName: "" })
  assert.deepEqual(readPredictionUrl(writePredictionUrl(base, 51, castaways, ["id:gone", "id:ben", "id:ben"]), 51, castaways), {
    order: ["id:ben", "id:amy", "id:zoe"],
    authorName: "",
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
  assert.deepEqual(readPredictionUrl(url, 51, renamed), { order, authorName: "" })
})

test("public castaway names preserve predictions when backend and fallback record IDs differ", () => {
  const order = ["id:zoe", "id:ben", "id:amy"]
  const url = writePredictionUrl(base, 51, castaways, order)
  const fallback = castaways.map((person) => ({ ...person, id: `fallback-${person.id}` }))
  assert.deepEqual(readPredictionUrl(url, 51, fallback), { order: ["id:fallback-zoe", "id:fallback-ben", "id:fallback-amy"], authorName: "" })
  const backToOriginal = writePredictionUrl(url, 51, fallback, readPredictionUrl(url, 51, fallback).order)
  assert.deepEqual(readPredictionUrl(backToOriginal, 51, castaways), { order, authorName: "" })
})

test("ambiguous fallback names cannot select a different contestant", () => {
  const people = [{ id: "a", name: "Same name" }, { id: "b", name: "Same name" }, { id: "c", name: "Zoe" }]
  const url = encodedUrl([1, "51", [["id:gone", "Same name"], ["id:c", "Zoe"]]])
  assert.deepEqual(readPredictionUrl(url, 51, people), { order: ["id:c", "id:a", "id:b"], authorName: "" })
})

test("actual outcomes and backend input order cannot change a neutral prediction URL", () => {
  const before = writePredictionUrl(base, 51, castaways, [])
  const changed = [...castaways].reverse().map((person) => ({ ...person, result_order: 30 - person.result_order, is_on_jury: true }))
  const after = writePredictionUrl(base, 51, changed, [])
  assert.equal(after.href, before.href)
  assert.doesNotMatch(after.search, /result_order|is_on_jury/)
})

test("the complete season 51 order fits a practical bookmark URL", () => {
  const url = writePredictionUrl(base, 51, season51Castaways, [], "Jordan")
  assert.equal(readPredictionUrl(url, 51, season51Castaways).order.length, season51Castaways.length)
  assert.ok(url.href.length < 2000, `URL length was ${url.href.length}`)
})

test("author names round-trip safely with Unicode and URL-sensitive characters", () => {
  const order = ["id:zoe", "id:amy", "id:ben"]
  const name = "  Zoë\n\t de   León 🏝️ & / ? # = + % \\\" <friends>  "
  const expected = "Zoë de León 🏝️ & / ? # = + % \\\" <friends>"
  const url = writePredictionUrl(base, 51, castaways, order, name)
  assert.deepEqual(readPredictionUrl(url, 51, castaways), { order, authorName: expected })
  assert.equal(url.hash, "#castaways")
  assert.equal(url.searchParams.get("source"), "friend")
  assert.deepEqual(url.searchParams.getAll("tag"), ["one", "two"])
  assert.equal(url.searchParams.size, 4)
  assert.equal(writePredictionUrl(url, 51, castaways, order, expected).href, url.href)
  assert.equal(readPredictionUrl(url, 50, castaways), null)
})

test("omitted, blank, and cleared names do not retain a previously named prediction", () => {
  const named = writePredictionUrl(base, 51, castaways, [], "Jordan")
  const omitted = writePredictionUrl(named, 51, castaways, [])
  assert.equal(readPredictionUrl(omitted, 51, castaways).authorName, "")
  for (const value of ["", " \n\t ", null, 42, { name: "Jordan" }]) {
    const cleared = writePredictionUrl(named, 51, castaways, [], value)
    assert.equal(readPredictionUrl(cleared, 51, castaways).authorName, "")
    assert.doesNotMatch(cleared.search, /Jordan/)
  }
  const exited = writePredictionUrl(named, 51, castaways, null, "Jordan")
  assert.equal(exited.href, base)
  assert.equal(readPredictionUrl(exited, 51, castaways), null)
})

test("author names are normalized and capped without splitting Unicode code points", () => {
  const name = `${"a".repeat(99)}🙂after the limit`
  const expected = `${"a".repeat(99)}🙂`
  const written = writePredictionUrl(base, 51, castaways, [], name)
  assert.equal(readPredictionUrl(written, 51, castaways).authorName, expected)
  const supplied = encodedUrl([2, "51", [], `  ${name}\n  `])
  assert.equal(readPredictionUrl(supplied, 51, castaways).authorName, expected)
  assert.equal(Array.from(readPredictionUrl(written, 51, castaways).authorName).length, 100)
  const trailingSpace = writePredictionUrl(base, 51, castaways, [], `${"a".repeat(99)} rest`)
  assert.equal(readPredictionUrl(trailingSpace, 51, castaways).authorName, "a".repeat(99))
})

test("legacy order-only links restore with an empty author name", () => {
  for (const entries of [["id:zoe", "id:ben"], [["id:zoe", "Zoë"], ["id:ben", "Ben"]]]) {
    const legacy = encodedUrl([1, "51", entries])
    assert.deepEqual(readPredictionUrl(legacy, 51, castaways), { order: ["id:zoe", "id:ben", "id:amy"], authorName: "" })
    assert.equal(readPredictionUrl(legacy, 50, castaways), null)
  }
})

test("malformed named payloads and unsupported versions never enable predictions", () => {
  for (const payload of [[2, "51", []], [2, "51", [], null], [2, "51", [], 42], [2, "51", [], {}], [2, "51", [], []], [2, "51", [], "Jordan", "extra"], [3, "51", [], "Jordan"], [1, "51", [], "Jordan"]]) {
    assert.equal(readPredictionUrl(encodedUrl(payload), 51, castaways), null)
  }
  assert.equal(readPredictionUrl("not a URL", 51, castaways), null)
})
