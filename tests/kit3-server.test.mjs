import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import vm from "node:vm"
import test from "node:test"
const root = new URL("../", import.meta.url)
const fail = (status, message) => { throw Object.assign(new Error(message), { status }) }
const strip = (source) => source.replace(/^import .*$/gm, "").replace(/export /g, "")

test("all dynamic private table IDs are declared, with absent values preserved", async () => {
  const source = strip(await readFile(new URL("src/env.js", root), "utf8"))
  const context = vm.createContext({ defineEnvVars: (variables) => variables })
  const variables = vm.runInContext(source + "\nvariables", context)
  for (const name of ["CONTIBASE_ACCESS_TOKEN", "CONTIBASE_SEASONS_TABLE_ID", "CONTIBASE_EPISODES_TABLE_ID", "CONTIBASE_CASTAWAYS_TABLE_ID"]) {
    assert.equal(variables[name].schema(undefined), undefined)
    assert.equal(variables[name].schema("fixture-value"), "fixture-value")
    assert.equal(variables[name].public, undefined)
  }
})

test("private table lookup uses each explicit ID and no-network fallback for absent credentials", async () => {
  const source = strip(await readFile(new URL("src/lib/server/seasons.js", root), "utf8"))
  const fixture = { CONTIBASE_ACCESS_TOKEN: "synthetic", CONTIBASE_SEASONS_TABLE_ID: "seasons-fixture", CONTIBASE_EPISODES_TABLE_ID: "episodes-fixture", CONTIBASE_CASTAWAYS_TABLE_ID: "castaways-fixture", AbortSignal, URLSearchParams, error: fail }
  const context = vm.createContext(fixture)
  const readTable = vm.runInContext(source + "\nreadTable", context)
  const requests = []
  const fetch = async (url, options) => { requests.push({ url, options }); return Response.json({ rows: [{ id: "safe" }] }) }
  for (const table of ["seasons", "episodes", "castaways"]) {
    const rows = await readTable(fetch, table, { field: "season_number", value: 51 })
    assert.equal(rows[0].id, "safe")
    const request = requests.at(-1)
    assert.ok(new URL(request.url).pathname.endsWith(`/${table}-fixture`))
    assert.equal(request.options.headers.authorization, "Bearer synthetic")
    assert.equal(JSON.parse(new URL(request.url).searchParams.get("filters")).value, 51)
  }
  assert.equal(await readTable(fetch, "not-a-table"), null)
  context.CONTIBASE_ACCESS_TOKEN = undefined
  assert.equal(await readTable(fetch, "seasons"), null)
  assert.equal(requests.length, 3)
})

test("explicit spoiler POST retains private caching and default episode load remains safe", async () => {
  const server = strip(await readFile(new URL("src/routes/seasons/[season_number]/[episode_number]/+server.js", root), "utf8"))
  const received = []
  const POST = vm.runInNewContext(server + "\nPOST", { Response, loadEpisode: async (...args) => { received.push(args); return { outcome: "synthetic secret" } } })
  const response = await POST({ fetch: () => {}, params: { season_number: "51", episode_number: "2" } })
  assert.equal(response.headers.get("cache-control"), "private, no-store")
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow")
  assert.equal(received[0][2], true)
  assert.equal((await response.json()).outcome, "synthetic secret")
  const episodeSource = strip(await readFile(new URL("src/routes/seasons/[season_number]/[episode_number]/episode-data.js", root), "utf8"))
  let requests = 0
  const loadEpisode = vm.runInNewContext(episodeSource + "\nloadEpisode", {
    CONTIBASE_ACCESS_TOKEN: "synthetic", error: fail,
    getSeason: async () => ({
      season: { season_number: 51, winner: "synthetic secret" },
      castaways: [{ name: "synthetic secret", result_order: 19, departure_reason: "quit" }],
      episodes: [{
        season_number: 51, episode_number: 2, title: "synthetic secret", post_id: "synthetic secret", air_time: "2026-09-30",
        eliminated_players: ["synthetic secret"], departure_reason: "quit",
        departures: [{ name: "synthetic secret", departure_reason: "quit" }],
      }],
    }),
    publicSeasonDate: (date) => date,
  })
  const data = await loadEpisode(() => { requests++; throw new Error("unexpected fetch") }, { season_number: "51", episode_number: "2" })
  assert.equal(requests, 0)
  assert.ok(!JSON.stringify(data).includes("synthetic secret"))
  assert.ok(!JSON.stringify(data).includes('"quit"'))
  assert.deepEqual(JSON.parse(JSON.stringify(data)), {
    season: { season_number: 51 },
    episode: { season_number: 51, episode_number: 2, air_time: "2026-09-30" },
  })
})
