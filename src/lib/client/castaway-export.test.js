import test from "node:test"
import assert from "node:assert/strict"
import { castawayImageSrc, sortCastawaysAlphabetically } from "../castaways.js"
import { castawayCanvasSize, measureCastawayImage, wrapImageText } from "./castaway-export.js"

const measure = (text, size = 1) => Array.from(text).length * size * 0.52
const season = { season_number: 51, title: "A new adventure" }
const castaways = Array.from({ length: 18 }, (_, index) => ({
  name: `Castaway ${index + 1}`,
  age: 20 + index,
  occupation: "Community organizer and wilderness guide",
  hometown: "A town with a particularly long name, California",
  current_residence: "Brooklyn, New York",
  traits: ["Thoughtful", "Competitive", "Curious"],
  why_applied: "To challenge myself and meet new people.",
  life_experience: "I have learned to listen carefully and stay patient.",
  unique_gameplay: "Build strong relationships and keep my options open.",
  summary: "An enthusiastic new castaway.",
  profile_spoiler_free: true,
  result_order: index + 1,
  is_on_jury: true,
}))

test("photo sources prioritize local assets and preserve the legacy name convention", () => {
  assert.equal(castawayImageSrc({ name: "Zoë O’Neil-Smith Jr.", image_url: "/cast/zoe.webp", image_storage_id: "old" }, 51), "/cast/zoe.webp")
  assert.equal(castawayImageSrc({ image_storage_id: "photo/id" }, 51), "/api/storage/photo%2Fid")
  assert.equal(castawayImageSrc({ name: "Zoë O’Neil-Smith Jr." }, 50), "/api/storage/ukkvrwvfuaqnotejkqua__s50__zoe_o_neil_smith_jr")
  assert.equal(castawayImageSrc({ image_url: "https://www.contibase.com/api/v1/storage/photo" }, 51), "/api/storage/photo")
  assert.equal(castawayImageSrc({ image_url: "https://www.survivorsnuff.com/cast/photo.webp" }, 51), "/cast/photo.webp")
})

test("long words, Unicode names, and paragraph breaks are wrapped without dropping content", () => {
  const content = "Zoë🙂".repeat(20)
  const lines = wrapImageText(content, 10, (text) => Array.from(text).length)
  assert.equal(lines.join(""), content)
  assert.ok(lines.every((line) => Array.from(line).length <= 10))
  assert.deepEqual(wrapImageText("One\n\nTwo", 10, (text) => text.length), ["One", "", "Two"])
})

test("the compact image always has three columns and includes every castaway", () => {
  const result = measureCastawayImage({ season, castaways, measure })
  assert.equal(result.cards.length, 18)
  assert.equal(result.operations.filter((operation) => operation.type === "photo").length, 18)
  assert.equal(new Set(result.cards.map((card) => card.x)).size, 3)
  assert.equal(new Set(result.cards.map((card) => card.y)).size, 6)
  assert.ok(result.cards[3].y >= result.cards[0].y + result.cards[0].height)
  assert.ok(result.operations.filter((operation) => operation.type === "text").every((operation) => {
    return operation.lines.every((line) => measure(line, operation.size) <= operation.width)
  }))
})

test("long detailed biographies grow the rows and never overlap following castaways", () => {
  const longBio = "A detailed life story with many experiences and perspectives. ".repeat(80)
  const people = castaways.map((castaway, index) => ({
    ...castaway,
    name: index === 0 ? "A very long name with several family names and a long nickname" : castaway.name,
    life_experience: `${longBio}\n\nA final paragraph that must remain visible.`,
  }))
  const result = measureCastawayImage({ season, castaways: people, layout: "details", measure })
  assert.equal(new Set(result.cards.map((card) => card.x)).size, 1)
  assert.equal(result.cards.length, people.length)
  for (let index = 0; index < result.cards.length; index++) {
    const card = result.cards[index]
    const nextCard = result.cards[index + 1]
    if (nextCard) assert.ok(nextCard.y > card.y + card.height)
    const start = result.operations.indexOf(card)
    const end = nextCard ? result.operations.indexOf(nextCard) : result.operations.length
    for (const operation of result.operations.slice(start + 1, end)) {
      if (operation.type === "text" && operation.y < card.y + card.height) {
        assert.ok(operation.y + operation.lines.length * operation.lineHeight <= card.y + card.height)
      }
    }
  }
  const renderedText = result.operations.flatMap((operation) => operation.lines ?? []).join(" ")
  assert.equal(renderedText.split("A final paragraph that must remain visible.").length - 1, people.length)
  assert.ok(renderedText.includes("CURRENT RESIDENCE"))
  assert.ok(renderedText.includes("TRAITS"))
  assert.ok(renderedText.includes("WHY THEY APPLIED"))
  assert.ok(renderedText.includes("THEIR GAME"))
  assert.ok(renderedText.includes("ABOUT"))
})

test("results are omitted unless explicitly requested in either layout", () => {
  for (const layout of ["grid", "details"]) {
    const without = measureCastawayImage({ season, castaways, layout, measure })
    const withResults = measureCastawayImage({ season, castaways, layout, measure, showSpoilers: true })
    const textWithout = without.operations.flatMap((operation) => operation.lines ?? []).join(" ")
    const textWith = withResults.operations.flatMap((operation) => operation.lines ?? []).join(" ")
    assert.doesNotMatch(textWithout, /Jury member|INCLUDES SEASON RESULTS/i)
    assert.match(textWith, /Jury member/)
    assert.match(textWith, /INCLUDES SEASON RESULTS/)
  }
})

test("outcome-ordered input is alphabetized without changing names or photo associations", () => {
  const people = [
    { name: "Zoë Example", image_url: "/cast/zoe.jpg", result_order: 1 },
    { name: "Brady Example", image_url: "/cast/brady.jpg", result_order: 2 },
    { name: "Ana Example", image_url: "/cast/ana.jpg", result_order: 3 },
  ]
  const ordered = sortCastawaysAlphabetically(people)
  assert.deepEqual(ordered.map((person) => person.name), ["Ana Example", "Brady Example", "Zoë Example"])
  assert.equal(people[0].name, "Zoë Example", "sorting does not mutate input data")
  for (const layout of ["grid", "details"]) {
    const result = measureCastawayImage({ season, castaways: people, layout, measure })
    assert.deepEqual(result.orderedCastaways.map((person) => person.image_url), ["/cast/ana.jpg", "/cast/brady.jpg", "/cast/zoe.jpg"])
    const photos = result.operations.filter((operation) => operation.type === "photo")
    for (const photo of photos) {
      const person = result.orderedCastaways[photo.index]
      const nextText = result.operations.slice(result.operations.indexOf(photo) + 1).find((operation) => operation.type === "text")
      assert.equal(nextText.lines.join(" "), person.name)
    }
  }
})

test("spoiler-free exports are identical when results, narratives, tribe assignments, and input order change", () => {
  const people = [
    { name: "Ana Example", age: 32, occupation: "Teacher", hometown: "Boston", image_url: "/cast/ana.jpg" },
    { name: "Zoë Example", age: 27, occupation: "Chef", hometown: "Austin", image_url: "/cast/zoe.jpg" },
  ]
  const withOutcomes = people.map((person, index) => ({
    ...person,
    result_order: index + 1,
    is_on_jury: true,
    tribe: "Merged Tribe",
    traits: ["Sole Survivor"],
    summary: "Won the final vote.",
    bio: "Reached the finale.",
    why_applied: "An unverified retrospective answer.",
    life_experience: "Won a previous season.",
    unique_gameplay: "Played the decisive idol at final five.",
  })).reverse()
  for (const layout of ["grid", "details"]) {
    const before = measureCastawayImage({ season, castaways: people, layout, measure })
    const after = measureCastawayImage({ season, castaways: withOutcomes, layout, measure })
    assert.deepEqual(after.operations, before.operations)
    assert.deepEqual(after.cards, before.cards)
    assert.equal(after.height, before.height)
    const revealed = measureCastawayImage({ season, castaways: withOutcomes, layout, measure, showSpoilers: true })
    const revealedText = revealed.operations.flatMap((operation) => operation.lines ?? []).join(" ")
    assert.match(revealedText, /Merged Tribe/)
    assert.match(revealedText, /Jury member/)
    if (layout === "details") assert.match(revealedText, /Won the final vote/)
  }
})

test("canvas dimensions stay within the pixel and browser dimension budgets for long exports", () => {
  for (const height of [3000, 8000, 16000, 48000, 100000]) {
    const dimensions = castawayCanvasSize(1440, height)
    assert.ok(dimensions.width * dimensions.height <= 16_000_000)
    assert.ok(dimensions.height <= 16_384)
    assert.ok(dimensions.width <= 16_384)
    assert.ok(dimensions.scale <= 1.5)
  }
})
