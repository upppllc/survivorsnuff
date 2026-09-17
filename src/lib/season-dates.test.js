import assert from "node:assert/strict"
import test from "node:test"
import { formatSeasonDate, seasonDateTimestamp } from "./season-dates.js"

test("calendar dates use one-based months and retain their published day", () => {
  assert.equal(formatSeasonDate({ year: 2026, month: 1, day_of_month: 1 }), "January 1, 2026")
  assert.equal(formatSeasonDate({ year: 2026, month: 9, day_of_month: 23 }), "September 23, 2026")
  assert.equal(formatSeasonDate({ year: 2024, month: 2, day_of_month: 29 }), "February 29, 2024")
})

test("Eastern premiere times resolve to the correct UTC instant in winter and summer", () => {
  const common = { year: 2026, hour: 20, minute: 0, timezone: "America/New_York" }
  assert.equal(seasonDateTimestamp({ ...common, month: 1, day_of_month: 1 }), Date.parse("2026-01-02T01:00:00Z"))
  assert.equal(seasonDateTimestamp({ ...common, month: 9, day_of_month: 23 }), Date.parse("2026-09-24T00:00:00Z"))
})

test("ISO dates and explicit offsets display consistently across viewer timezones", () => {
  assert.equal(formatSeasonDate("2026-09-23"), "September 23, 2026")
  assert.equal(formatSeasonDate("2026-09-23T20:00:00-04:00"), "September 23, 2026")
  assert.equal(seasonDateTimestamp("2026-09-23T20:00:00-04:00"), Date.parse("2026-09-24T00:00:00Z"))
  assert.equal(seasonDateTimestamp("2026-09-23T20:00:00"), Date.parse("2026-09-23T20:00:00Z"))
})

test("missing and invalid archive dates stay unknown instead of becoming January 1970", () => {
  for (const value of [null, undefined, "", {}, "2026-02-30", { year: 2026, month: 2, day_of_month: 30 },
    { year: 2014, month: 9, day_of_month: null, datetime: "" }]) {
    assert.equal(formatSeasonDate(value), "")
    assert.equal(seasonDateTimestamp(value), null)
  }
})

test("legacy missing-timezone markers retain a usable date", () => {
  for (const timezone of [null, "", "/null", ".null"]) {
    const value = { year: 2020, month: 4, day_of_month: 8, timezone }
    assert.equal(formatSeasonDate(value), "April 8, 2020")
    assert.equal(seasonDateTimestamp(value), Date.parse("2020-04-08T00:00:00Z"))
  }
})

test("a nonexistent local time at the DST jump has no fabricated timestamp", () => {
  assert.equal(seasonDateTimestamp({ year: 2026, month: 3, day_of_month: 8, hour: 2, minute: 30,
    timezone: "America/New_York" }), null)
})
