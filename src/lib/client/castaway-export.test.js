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

test("the compact image defaults to four columns and includes every castaway", () => {
  const result = measureCastawayImage({ season, castaways, measure })
  assert.equal(result.cards.length, 18)
  assert.equal(result.operations.filter((operation) => operation.type === "photo").length, 18)
  assert.equal(new Set(result.cards.map((card) => card.x)).size, 4)
  assert.equal(new Set(result.cards.map((card) => card.y)).size, 5)
  assert.ok(result.cards[4].y >= result.cards[0].y + result.cards[0].height)
  assert.ok(result.operations.filter((operation) => operation.type === "text").every((operation) => {
    return operation.lines.every((line) => measure(line, operation.size) <= operation.width)
  }))
})

test("five-column images retain all 21 castaways, fit their text, and keep prediction badges with the chosen photos", () => {
  const people = Array.from({ length: 21 }, (_, index) => ({
    ...castaways[index % castaways.length],
    name: `Castaway ${String(21 - index).padStart(2, "0")} With A Long Surname`,
    image_url: `/cast/person-${21 - index}.webp`,
  }))
  for (const prediction of [false, true]) {
    const result = measureCastawayImage({ season, castaways: people, gridColumns: 5, prediction, measure })
    const ordered = prediction ? people : sortCastawaysAlphabetically(people)
    assert.equal(result.cards.length, 21)
    assert.deepEqual(result.orderedCastaways, ordered)
    assert.equal(new Set(result.cards.map((card) => card.x)).size, 5)
    assert.equal(new Set(result.cards.map((card) => card.y)).size, 5)
    assert.equal(result.cards[20].x, result.cards[0].x)
    assert.ok(result.cards[20].y > result.cards[19].y + result.cards[19].height)
    for (const [index, card] of result.cards.entries()) {
      assert.ok(card.x >= 0 && card.x + card.width <= result.width)
      const right = index % 5 < 4 ? result.cards[index + 1] : null
      if (right) assert.ok(right.x > card.x + card.width)
      const below = result.cards[index + 5]
      if (below) assert.ok(below.y > card.y + card.height)
      const start = result.operations.indexOf(card) + 1
      const end = result.cards[index + 1] ? result.operations.indexOf(result.cards[index + 1]) : result.operations.length
      const cardOperations = result.operations.slice(start, end)
      const photo = cardOperations.find((operation) => operation.type === "photo")
      assert.equal(result.orderedCastaways[photo.index].image_url, ordered[index].image_url)
      const name = cardOperations.find((operation) => operation.type === "text")
      assert.equal(name.lines.join(" "), ordered[index].name)
      for (const operation of cardOperations.filter((operation) => operation.type === "text" && operation.y < card.y + card.height)) {
        assert.ok(operation.x >= card.x && operation.x + operation.width <= card.x + card.width)
        assert.ok(operation.y + operation.lines.length * operation.lineHeight <= card.y + card.height)
        assert.ok(operation.lines.every((line) => measure(line, operation.size) <= operation.width))
      }
      const badge = cardOperations.find((operation) => operation.type === "prediction_badge")
      if (prediction) {
        assert.equal(badge.rank, index + 1)
        assert.equal(badge.index, photo.index)
        assert.ok(badge.x >= photo.x && badge.x + badge.width <= photo.x + photo.width)
        assert.ok(badge.y >= photo.y && badge.y + badge.height <= photo.y + photo.height)
      } else assert.equal(badge, undefined)
    }
  }
})

test("grid columns default to four", () => {
  for (const prediction of [false, true]) {
    const original = measureCastawayImage({ season, castaways, prediction, measure })
    for (const gridColumns of [4, 0, 2, 6, "5", null]) {
      assert.deepEqual(measureCastawayImage({ season, castaways, gridColumns, prediction, measure }), original)
    }
  }
})

test("all castaway details and long biographies fit inside grid cards without overlapping following rows", () => {
  const longBio = "A detailed life story with many experiences and perspectives. ".repeat(80)
  const people = castaways.map((castaway, index) => ({
    ...castaway,
    name: index === 0 ? "A very long name with several family names and a long nickname" : castaway.name,
    life_experience: `${longBio}\n\nA final paragraph that must remain visible.`,
  }))
  for (const gridColumns of [3, 4, 5]) {
    const result = measureCastawayImage({ season, castaways: people, gridColumns, measure, showSpoilers: true })
    assert.equal(new Set(result.cards.map((card) => card.x)).size, gridColumns)
    assert.equal(result.cards.length, people.length)
    for (let index = 0; index < result.cards.length; index++) {
      const card = result.cards[index]
      const below = result.cards[index + gridColumns]
      if (below) assert.ok(below.y > card.y + card.height)
      const nextCard = result.cards[index + 1]
      const start = result.operations.indexOf(card)
      const end = nextCard ? result.operations.indexOf(nextCard) : result.operations.length
      for (const operation of result.operations.slice(start + 1, end)) {
        if (operation.type === "text" && operation.y < card.y + card.height) {
          assert.ok(operation.y + operation.lines.length * operation.lineHeight <= card.y + card.height)
          assert.ok(operation.lines.every((line) => measure(line, operation.size) <= operation.width))
        }
      }
    }
    const renderedText = result.operations.flatMap((operation) => operation.lines ?? []).join(" ")
    assert.equal(renderedText.split("A final paragraph that must remain visible.").length - 1, people.length)
    assert.match(renderedText, /Age: 20/)
    assert.match(renderedText, /Occupation: Community organizer and wilderness guide/)
    assert.match(renderedText, /Hometown: A town with a particularly long name, California/)
    assert.match(renderedText, /Current residence: Brooklyn, New York/)
    assert.match(renderedText, /Traits: Thoughtful, Competitive, Curious/)
    assert.match(renderedText, /Why they applied: To challenge myself and meet new people\./)
    assert.match(renderedText, /Their game: Build strong relationships and keep my options open\./)
    assert.match(renderedText, /About: An enthusiastic new castaway\./)
  }
})

test("results are omitted unless explicitly requested with each column count", () => {
  for (const gridColumns of [3, 4, 5]) {
    const without = measureCastawayImage({ season, castaways, gridColumns, measure })
    const withResults = measureCastawayImage({ season, castaways, gridColumns, measure, showSpoilers: true })
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
  for (const gridColumns of [3, 4, 5]) {
    const result = measureCastawayImage({ season, castaways: people, gridColumns, measure })
    assert.equal(result.operations.filter((operation) => operation.type === "prediction_badge").length, 0)
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
    profile_spoiler_free: true,
  })).reverse()
  for (const gridColumns of [3, 4, 5]) {
    const before = measureCastawayImage({ season, castaways: people, gridColumns, measure })
    const after = measureCastawayImage({ season, castaways: withOutcomes, gridColumns, measure })
    assert.deepEqual(after.operations, before.operations)
    assert.deepEqual(after.cards, before.cards)
    assert.equal(after.height, before.height)
    const revealed = measureCastawayImage({ season, castaways: withOutcomes, gridColumns, measure, showSpoilers: true })
    const revealedText = revealed.operations.flatMap((operation) => operation.lines ?? []).join(" ")
    assert.match(revealedText, /Merged Tribe/)
    assert.match(revealedText, /Jury member/)
    assert.match(revealedText, /Won the final vote/)
  }
})

test("prediction exports preserve the chosen order and associate numbered badges with each photo with each column count", () => {
  const people = [
    { name: "Zoë Example", image_url: "/cast/zoe.webp" },
    { name: "Ana Example", image_url: "/cast/ana.webp" },
    { name: "Brady Example", image_url: "/cast/brady.webp" },
  ]
  for (const gridColumns of [3, 4, 5]) {
    const result = measureCastawayImage({ season, castaways: people, gridColumns, prediction: true, measure })
    assert.deepEqual(result.orderedCastaways, people)
    assert.notEqual(result.orderedCastaways, people, "the layout owns its array without mutating the chosen order")
    const badges = result.operations.filter((operation) => operation.type === "prediction_badge")
    assert.deepEqual(badges.map((badge) => badge.rank), [1, 2, 3])
    const photos = result.operations.filter((operation) => operation.type === "photo")
    for (const [index, photo] of photos.entries()) {
      assert.equal(photo.index, index)
      const badge = badges[index]
      assert.equal(badge.index, photo.index)
      assert.ok(badge.x >= photo.x && badge.x + badge.width <= photo.x + photo.width)
      assert.ok(badge.y >= photo.y && badge.y + badge.height <= photo.y + photo.height)
      assert.equal(badge.width, badge.height)
      const nextText = result.operations.slice(result.operations.indexOf(photo) + 1).find((operation) => operation.type === "text")
      assert.equal(nextText.lines.join(" "), people[index].name)
      assert.equal(result.orderedCastaways[photo.index].image_url, people[index].image_url)
    }
    const renderedText = result.operations.flatMap((operation) => operation.lines ?? []).join(" ")
    assert.match(renderedText, /MY ELIMINATION PREDICTION/)
    assert.match(renderedText, /1 = predicted winner/)
    assert.match(renderedText, /3 = first eliminated/)
    assert.match(renderedText, /NOT ACTUAL RESULTS/)
    assert.doesNotMatch(renderedText, /Alphabetical by name/)
  }
  assert.equal(people[0].name, "Zoë Example")
})

test("prediction exports suppress real results and retrospective narratives even when spoilers are requested", () => {
  const people = [
    { name: "Zoë Example", age: 27, occupation: "Chef", hometown: "Austin", image_url: "/cast/zoe.webp" },
    { name: "Ana Example", age: 32, occupation: "Teacher", hometown: "Boston", image_url: "/cast/ana.webp" },
  ]
  const withOutcomes = people.map((person, index) => ({
    ...person,
    result_order: people.length - index,
    is_on_jury: true,
    tribe: "Merged Tribe",
    traits: ["Sole Survivor"],
    summary: "Won the final vote.",
    bio: "Reached the finale.",
    why_applied: "An unverified retrospective answer.",
    life_experience: "Won a previous season.",
    unique_gameplay: "Played the decisive idol at final five.",
    profile_spoiler_free: true,
  }))
  for (const gridColumns of [3, 4, 5]) {
    const before = measureCastawayImage({ season, castaways: people, gridColumns, prediction: true, measure })
    const after = measureCastawayImage({ season, castaways: withOutcomes, gridColumns, prediction: true, showSpoilers: true, measure })
    assert.deepEqual(after.operations, before.operations)
    assert.deepEqual(after.cards, before.cards)
    assert.equal(after.height, before.height)
    const renderedText = after.operations.flatMap((operation) => operation.lines ?? []).join(" ")
    assert.doesNotMatch(renderedText, /Merged Tribe|Sole Survivor|Jury member|final vote|finale|unverified retrospective|previous season|decisive idol|INCLUDES SEASON RESULTS/i)
    assert.deepEqual(after.operations.filter((operation) => operation.type === "prediction_badge").map((badge) => badge.rank), [1, 2])
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
