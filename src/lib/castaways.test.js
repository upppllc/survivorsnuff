import assert from "node:assert/strict"
import test from "node:test"
import { castaways } from "./data/season-51.js"
import { season51Profiles } from "./data/season-51-profiles.js"
import { castawayProfileDetails } from "./castaways.js"
import { measureCastawayImage } from "./client/castaway-export.js"

test("every season 51 castaway has a reviewed preseason profile in three- and four-column grid images", () => {
  assert.equal(castaways.length, 21)
  assert.deepEqual(Object.keys(season51Profiles).sort(), castaways.map((person) => person.name).sort())
  for (const person of castaways) {
    const profile = season51Profiles[person.name]
    assert.ok(profile.summary.trim())
    assert.equal(profile.source_url, "https://www.paramountplus.com/sneak-peak/survivor-season-51-cast/")
    assert.deepEqual(castawayProfileDetails(person).bios, [{ key: "preseason", label: "Before the island", value: profile.summary }])
  }
  for (const gridColumns of [3, 4]) {
    const rendered = measureCastawayImage({
      season: { season_number: 51 }, castaways, gridColumns,
      measure: (text, size) => text.length * size * .52,
    }).operations.flatMap((operation) => operation.lines ?? []).join(" ")
    for (const profile of Object.values(season51Profiles)) assert.ok(rendered.includes(profile.summary))
  }
})

test("backend narratives and trust flags cannot replace a reviewed preseason profile", () => {
  const person = castaways[0]
  const contaminated = {
    ...person, summary: "SECRET_OUTCOME", bio: "SECRET_OUTCOME", traits: ["SECRET_OUTCOME"],
    tribe: { name: "SECRET_OUTCOME" }, why_applied: "SECRET_OUTCOME", life_experience: "SECRET_OUTCOME",
    unique_gameplay: "SECRET_OUTCOME", preseason_summary: "SECRET_OUTCOME", profile_spoiler_free: true,
  }
  assert.deepEqual(castawayProfileDetails(contaminated), castawayProfileDetails(person))
  assert.ok(!JSON.stringify(castawayProfileDetails(contaminated)).includes("SECRET_OUTCOME"))
  assert.ok(JSON.stringify(castawayProfileDetails(contaminated, true)).includes("SECRET_OUTCOME"))
  assert.deepEqual(castawayProfileDetails({ ...person, season_number: 50 }).bios, [])
  assert.deepEqual(castawayProfileDetails({ ...contaminated, name: "Unknown castaway" }).bios, [])
})
