import test from "node:test"
import assert from "node:assert/strict"
import { castawayImageSrc, sortCastawaysAlphabetically } from "../castaways.js"
import { predictionCastawayKey } from "../predictions.js"
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

test("the compact image defaults to seven columns and includes every castaway", () => {
  const result = measureCastawayImage({ season, castaways, measure })
  assert.equal(result.cards.length, 18)
  assert.equal(result.operations.filter((operation) => operation.type === "photo").length, 18)
  assert.equal(new Set(result.cards.map((card) => card.x)).size, 7)
  assert.equal(new Set(result.cards.map((card) => card.y)).size, 3)
  assert.ok(result.cards[7].y >= result.cards[0].y + result.cards[0].height)
  assert.ok(result.operations.filter((operation) => operation.type === "text").every((operation) => {
    return operation.lines.every((line) => measure(line, operation.size) <= operation.width)
  }))
})

test("three- through eight-column images retain all 21 castaways, legible card widths, and matching prediction badges", () => {
  const people = Array.from({ length: 21 }, (_, index) => ({
    ...castaways[index % castaways.length],
    name: `Castaway ${String(21 - index).padStart(2, "0")} With A Long Surname`,
    image_url: `/cast/person-${21 - index}.webp`,
  }))
  for (const gridColumns of [3, 4, 5, 6, 7, 8]) {
    for (const prediction of [false, true]) {
      const result = measureCastawayImage({ season, castaways: people, gridColumns, prediction, measure })
      const ordered = prediction ? people : sortCastawaysAlphabetically(people)
      assert.equal(result.cards.length, 21)
      if (gridColumns <= 5) assert.equal(result.width, 1440)
      else assert.ok(result.width > 1440)
      assert.ok(result.cards.every((card) => card.width >= 244.8))
      assert.deepEqual(result.orderedCastaways, ordered)
      assert.equal(new Set(result.cards.map((card) => card.x)).size, gridColumns)
      assert.equal(new Set(result.cards.map((card) => card.y)).size, Math.ceil(21 / gridColumns))
      assert.equal(result.cards[20].x, result.cards[20 % gridColumns].x)
      assert.ok(result.cards[20].y > result.cards[20 - gridColumns].y + result.cards[20 - gridColumns].height)
      for (const [index, card] of result.cards.entries()) {
        assert.ok(card.x >= 0 && card.x + card.width <= result.width)
        const right = index % gridColumns < gridColumns - 1 ? result.cards[index + 1] : null
        if (right) assert.ok(right.x > card.x + card.width)
        const below = result.cards[index + gridColumns]
        if (below) assert.ok(below.y > card.y + card.height)
        const start = result.operations.indexOf(card) + 1
        const end = result.cards[index + 1] ? result.operations.indexOf(result.cards[index + 1]) : result.operations.length
        const cardOperations = result.operations.slice(start, end)
        const photo = cardOperations.find((operation) => operation.type === "photo")
        assert.equal(result.orderedCastaways[photo.index].image_url, ordered[index].image_url)
        const name = cardOperations.find((operation) => operation.type === "text")
        assert.equal(name.lines.join(" "), ordered[index].name)
        for (const operation of cardOperations.filter((operation) => operation.type === "text" && operation.y < card.y + card.height)) {
          assert.equal(operation.x, photo.x)
          assert.equal(operation.width, photo.width)
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
  }
})

test("grid columns default to seven", () => {
  for (const prediction of [false, true]) {
    const original = measureCastawayImage({ season, castaways, prediction, measure })
    for (const gridColumns of [7, 0, 2, 9, 5.5, "5", null]) {
      assert.deepEqual(measureCastawayImage({ season, castaways, gridColumns, prediction, measure }), original)
    }
  }
})

test("optional prediction names stay on one line at the top right without overlapping the header or cast", () => {
  for (const prediction of [false, true]) {
    const original = measureCastawayImage({ season, castaways, prediction, measure })
    for (const authorName of ["", " \n\t ", null, undefined, 42, { name: "Jordan" }]) {
      assert.deepEqual(measureCastawayImage({ season, castaways, prediction, authorName, measure }), original)
    }
    const named = measureCastawayImage({ season, castaways, prediction, authorName: "  Zoë\n\t de   León 🏝️  ", measure })
    if (!prediction) {
      assert.deepEqual(named, original, "normal cast images ignore even a nonempty author name")
      continue
    }
    const author = named.operations.find((operation) => operation.align === "right")
    assert.deepEqual(author.lines, ["Zoë de León 🏝️"])
    assert.equal(author.y, named.operations[0].y)
    assert.equal(author.x + author.width, named.width - named.cards[0].x)
    assert.ok(named.cards[0].y > author.y + author.lines.length * author.lineHeight)

    const authorName = "Zoë🙂".repeat(100)
    for (const gridColumns of [3, 4, 5, 6, 7, 8]) {
      const longName = measureCastawayImage({ season, castaways, gridColumns, prediction, authorName, measure })
      const wrapped = longName.operations.find((operation) => operation.align === "right")
      assert.deepEqual(wrapped.lines, [authorName])
      assert.ok(wrapped.lines.every((line) => measure(line, wrapped.size) <= wrapped.width))
      const firstCard = longName.cards[0]
      for (const operation of longName.operations.slice(0, longName.operations.indexOf(firstCard))) {
        if (operation.type === "text") {
          assert.ok(operation.y + operation.lines.length * operation.lineHeight < firstCard.y)
          assert.ok(operation.lines.every((line) => measure(line, operation.size) <= operation.width))
          if (operation !== wrapped) assert.ok(operation.x + operation.width < wrapped.x)
        }
      }
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
  for (const gridColumns of [3, 4, 5, 6, 7, 8]) {
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
          assert.equal(operation.x, card.x)
          assert.equal(operation.width, card.width)
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
  for (const gridColumns of [3, 4, 5, 6, 7, 8]) {
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
  for (const gridColumns of [3, 4, 5, 6, 7, 8]) {
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
  for (const gridColumns of [3, 4, 5, 6, 7, 8]) {
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
  for (const gridColumns of [3, 4, 5, 6, 7, 8]) {
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
    assert.doesNotMatch(renderedText, /A PERSONAL PREDICTION|NOT ACTUAL RESULTS/)
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
  for (const gridColumns of [3, 4, 5, 6, 7, 8]) {
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

test("actual placement maps cannot change an export without the separate prediction opt-in", () => {
  const actualPlacements = Object.fromEntries(castaways.map((person, index) => [predictionCastawayKey(person), castaways.length - index]))
  for (const gridColumns of [3, 4, 5, 6, 7, 8]) {
    const prediction = measureCastawayImage({ season, castaways, gridColumns, prediction: true, measure })
    for (const showActualPlacements of [false, undefined, "true", 1]) {
      const hidden = measureCastawayImage({ season, castaways, gridColumns, prediction: true, showSpoilers: true, showActualPlacements, actualPlacements, measure })
      assert.deepEqual(hidden.operations, prediction.operations)
    }
    const guide = measureCastawayImage({ season, castaways, gridColumns, measure })
    const ignored = measureCastawayImage({ season, castaways, gridColumns, showActualPlacements: true, actualPlacements, measure })
    assert.deepEqual(ignored.operations, guide.operations)
  }
})

test("explicit actual placements add separate red badges without changing picks or revealing narratives", () => {
  const people = Array.from({ length: 21 }, (_, index) => ({
    id: `person-${index}`,
    name: `Castaway ${21 - index}`,
    result_order: index + 1,
    is_on_jury: true,
    tribe: "SECRET_TRIBE",
    traits: ["SECRET_TRAIT"],
    summary: "SECRET_OUTCOME",
    why_applied: "SECRET_NARRATIVE",
  }))
  const actualPlacements = {
    [predictionCastawayKey(people[0])]: 21,
    [predictionCastawayKey(people[4])]: 1,
    [predictionCastawayKey(people[10])]: null,
    [predictionCastawayKey(people[11])]: 22,
    [predictionCastawayKey(people[12])]: "7",
  }
  for (const gridColumns of [3, 4, 5, 6, 7, 8]) {
    const result = measureCastawayImage({ season, castaways: people, gridColumns, prediction: true, showSpoilers: true, showActualPlacements: true, actualPlacements, measure })
    const picks = result.operations.filter((operation) => operation.type === "prediction_badge")
    const actuals = result.operations.filter((operation) => operation.type === "actual_placement_badge")
    assert.deepEqual(result.orderedCastaways, people)
    assert.deepEqual(picks.map((badge) => badge.rank), people.map((_, index) => index + 1))
    assert.deepEqual(actuals.map((badge) => [badge.index, badge.placement]), [[0, 21], [4, 1]])
    for (const actual of actuals) {
      const pick = picks.find((badge) => badge.index === actual.index)
      const photo = result.operations.find((operation) => operation.type === "photo" && operation.index === actual.index)
      assert.ok(actual.x > pick.x + pick.width)
      assert.equal(actual.y, pick.y)
      assert.ok(actual.x + actual.width <= photo.x + photo.width)
      assert.ok(actual.y + actual.height <= photo.y + photo.height)
      assert.equal(actual.placement, actualPlacements[predictionCastawayKey(result.orderedCastaways[photo.index])])
    }
    const renderedText = result.operations.flatMap((operation) => operation.lines ?? []).join(" ")
    assert.match(renderedText, /Actual placements shown \(spoilers\)/)
    assert.match(renderedText, /White = your pick · Red = actual finish/)
    assert.doesNotMatch(renderedText, /SECRET_|Finish:|Jury member|INCLUDES SEASON RESULTS/)
  }
})

test("website, photo credit, and disclaimer share one footer row without wrapping or overlapping", () => {
  for (const gridColumns of [3, 4, 5, 6, 7, 8]) {
    for (const photo_credit of ["Robert Voets / CBS", "Robert Voets / CBS\nAdditional photographers and production contributors: ".repeat(4)]) {
      const result = measureCastawayImage({ season: { ...season, photo_credit }, castaways, gridColumns, measure })
      const footer = result.operations.slice(-3)
      assert.equal(new Set(footer.map((operation) => operation.y)).size, 1)
      assert.deepEqual(footer.map((operation) => operation.lines), [
        ["survivorsnuff.com"],
        [photo_credit.trim().replace(/\s+/g, " ")],
        ["An independent fan guide. Survivor is a CBS / Paramount series."],
      ])
      assert.ok(footer[0].y > Math.max(...result.cards.map((card) => card.y + card.height)))
      for (const [index, operation] of footer.entries()) {
        assert.ok(measure(operation.lines[0], operation.size) <= operation.width)
        assert.ok(operation.x >= result.cards[0].x)
        assert.ok(operation.x + operation.width <= result.width - result.cards[0].x + 0.001)
        if (footer[index + 1]) assert.ok(operation.x + operation.width < footer[index + 1].x)
      }
    }
  }
})

test("Letter exports preserve every operation and add safe padding at an exact portrait page ratio", () => {
  const longArchive = castaways.map((person) => ({
    ...person,
    life_experience: "A long public retrospective profile with every experience retained. ".repeat(100),
  }))
  const variants = [
    { season, castaways, prediction: true, authorName: "Zoë de León", showActualPlacements: true, actualPlacements: { [predictionCastawayKey(castaways[0])]: 18 } },
    { season: { season_number: 20 }, castaways: longArchive, showSpoilers: true },
  ]
  for (const variant of variants) {
    for (const gridColumns of [3, 4, 5, 6, 7, 8]) {
      const options = { ...variant, gridColumns, measure }
      const natural = measureCastawayImage(options)
      const letter = measureCastawayImage({ ...options, fitLetter: true })
      assert.equal(natural.is_letter, false)
      assert.deepEqual(measureCastawayImage({ ...options, fitLetter: false }), natural)
      assert.equal(letter.is_letter, true)
      assert.equal(letter.width * 22, letter.height * 17)
      assert.ok(letter.width >= natural.width && letter.height >= natural.height)
      const offsetX = (letter.width - natural.width) / 2
      const offsetY = (letter.height - natural.height) / 2
      assert.ok(offsetX >= letter.width / 34, "at least 0.25 inch horizontal print margin")
      assert.ok(offsetY >= letter.height / 44, "at least 0.25 inch vertical print margin")
      assert.deepEqual(letter.orderedCastaways, natural.orderedCastaways)
      assert.equal(letter.operations.length, natural.operations.length)
      for (const [index, operation] of letter.operations.entries()) {
        const { x, y, ...content } = operation
        const { x: originalX, y: originalY, ...originalContent } = natural.operations[index]
        assert.deepEqual(content, originalContent, "text, fonts, photos, badges, and geometry are unchanged")
        assert.ok(Math.abs(x - originalX - offsetX) < 0.000001)
        assert.ok(Math.abs(y - originalY - offsetY) < 0.000001)
        const operationHeight = operation.type === "text" ? operation.lines.length * operation.lineHeight : operation.height
        assert.ok(x >= offsetX && x + operation.width <= letter.width - offsetX + 0.001)
        assert.ok(y >= offsetY && y + operationHeight <= letter.height - offsetY + 0.001)
      }
      const dimensions = castawayCanvasSize(letter.width, letter.height, true)
      assert.equal(dimensions.width * 22, dimensions.height * 17)
      assert.ok(dimensions.width * dimensions.height <= 16_000_000)
      assert.ok(dimensions.width <= 16_384 && dimensions.height <= 16_384)
      assert.ok(dimensions.scale <= 1.5)
      assert.ok(Math.abs(dimensions.width / letter.width - dimensions.height / letter.height) < 0.000001, "canvas scaling stays uniform")
    }
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
