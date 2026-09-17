import assert from "node:assert/strict"
import test from "node:test"
import { publicSeasonData, publicSeasonDate } from "./season-public-data.js"

const spoiler = "SECRET_OUTCOME_ZOE_WINS_AND_AMY_GOES_HOME"
const schedule = { year: 2026, month: 9, day_of_month: 23, hour: 20, minute: 0, timezone: "America/New_York", granularity: "minute" }

test("default serialized data contains no season results, cast narratives, or episode spoilers", () => {
  const result = publicSeasonData({
    season: {
      id: "s51", season_number: 51, title: "The Open Era", location: "Fiji", contestant_count: 2,
      first_air_time: { ...schedule, content: spoiler, unexpected: { result: spoiler } },
      photo_credit: "CBS", source_url: "https://example.com/cast",
      winner: spoiler, finalists: [spoiler], jury_votes: [{ voter: spoiler }],
      last_air_time: spoiler, twist_summary: spoiler, notable_urls: [{ name: spoiler }],
      unknown_future_field: spoiler,
    },
    castaways: ["Zoe", "Amy"].map((name, index) => ({
      id: name.toLowerCase(), season_number: 51, name, age: 30, occupation: "Teacher", hometown: "Boston",
      current_residence: "New York", image_url: `/castaways/${name}.jpg`, image_storage_id: name,
      photo_source_url: "https://example.com/photo", photo_credit: "CBS", image_credit: "CBS",
      source_url: "https://example.com/cast", age_basis: "Cast announcement",
      result_order: index + 1, is_on_jury: true, tribe: { name: spoiler }, tribe_name: spoiler,
      summary: spoiler, bio: spoiler, traits: [spoiler], why_applied: spoiler,
      life_experience: spoiler, unique_gameplay: spoiler, profile_spoiler_free: true,
      unknown_future_field: spoiler,
    })),
    episodes: [{
      id: spoiler, season_number: 51, episode_number: 1, air_time: { ...schedule, content: spoiler },
      title: spoiler, synopsis: spoiler, post_id: spoiler, votes: [{ voter: spoiler }],
      eliminated_players: [spoiler], joined_jury: [spoiler], related_urls: [{ url: spoiler }],
    }],
    post: spoiler,
  })

  assert.ok(!JSON.stringify(result).includes(spoiler))
  assert.deepEqual(result.season.first_air_time, schedule)
  assert.deepEqual(result.castaways.map((row) => row.name), ["Amy", "Zoe"])
  assert.equal(result.castaways.length, 2)
  assert.equal(result.castaways[0].current_residence, "New York")
  assert.equal(result.castaways[0].image_url, "/castaways/Amy.jpg")
  assert.deepEqual(result.episodes, [{ season_number: 51, episode_number: 1, air_time: schedule }])
  assert.ok(!("result_order" in result.castaways[0]))
  assert.ok(!("is_on_jury" in result.castaways[0]))
  assert.ok(!("profile_spoiler_free" in result.castaways[0]))
})

test("all castaways remain visible in neutral alphabetical order regardless of finish order", () => {
  const castaways = [
    { name: "Zoe", result_order: 1, is_on_jury: false },
    { name: "Émile", result_order: 2, is_on_jury: false },
    { name: "Amy", result_order: 20, is_on_jury: false },
    { name: "Ben", result_order: 8, is_on_jury: true },
    { name: "An “Thien An” Nguyen", result_order: 4, is_on_jury: true },
    { name: "Ana Sani", result_order: 5, is_on_jury: true },
  ]
  const source = structuredClone(castaways)
  const result = publicSeasonData({ castaways }).castaways
  assert.deepEqual(result.map((person) => person.name), ["Amy", "An “Thien An” Nguyen", "Ana Sani", "Ben", "Émile", "Zoe"])
  assert.equal(result.length, source.length)
  assert.deepEqual(castaways, source)
  const changedResults = castaways.map((person) => ({ ...person, result_order: 30 - person.result_order, is_on_jury: !person.is_on_jury }))
  assert.deepEqual(publicSeasonData({ castaways: changedResults }).castaways, result)
})

test("nested objects cannot sneak into scalar fields and public dates exclude free text", () => {
  const result = publicSeasonData({
    season: { title: { summary: spoiler } },
    castaways: [{ name: "Amy", occupation: { result: spoiler }, photo_credit: [spoiler] }],
    episodes: [{ episode_number: 1, air_time: { ...schedule, timezone: spoiler, granularity: spoiler, content: spoiler } }],
  })
  assert.ok(!JSON.stringify(result).includes(spoiler))
  assert.deepEqual(result.castaways, [{ name: "Amy" }])
  assert.equal(result.episodes[0].air_time.year, 2026)
  assert.ok(!("timezone" in result.episodes[0].air_time))
  assert.ok(!("granularity" in result.episodes[0].air_time))
})

test("safe dates retain usable ISO/calendar values while incomplete or unstructured values stay unknown", () => {
  assert.equal(publicSeasonDate("2026-09-23T20:00:00-04:00"), "2026-09-23T20:00:00-04:00")
  assert.deepEqual(publicSeasonDate({ ...schedule, content: spoiler }), schedule)
  assert.equal(publicSeasonDate({ datetime: "2026-09-23", content: spoiler }), "2026-09-23")
  for (const invalid of [null, "2026-02-30", spoiler, { year: 2026, month: 9, content: spoiler }]) {
    assert.equal(publicSeasonDate(invalid), null)
  }
  assert.deepEqual(publicSeasonData(null), { season: {}, castaways: [], episodes: [] })
})
