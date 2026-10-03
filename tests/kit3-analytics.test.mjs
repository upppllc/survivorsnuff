import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import vm from "node:vm"
import test from "node:test"
import { public_page_analytics } from "../src/lib/client/analytics.js"

const root = new URL("../", import.meta.url)

test("public page analytics removes query, token, prediction, and fragment data", () => {
  const event = public_page_analytics({ type: "pageview", url: "https://example.com/?token=secret&email_address=private&prediction=outcome#private" })
  assert.equal(event.url, "https://example.com/")
  for (const url of ["https://example.com/account", "https://example.com/settings", "https://example.com/confirm_user_email_address/secret", "not a URL", "javascript:alert(1)"]) {
    assert.equal(public_page_analytics({ type: "pageview", url }), null)
  }
  assert.equal(public_page_analytics({ type: "event", url: "https://example.com/", data: { private: "secret" } }), null)
})

test("dynamic public URLs are grouped without leaking identifiers or prediction queries", () => {
  const event = public_page_analytics({ type: "pageview", url: "https://example.com/seasons/51/2?prediction=private#secret" })
  assert.equal(new URL(event.url).pathname, "/seasons/[season_number]/[episode_number]")
  assert.equal(new URL(event.url).search, "")
})

test("navigation lifecycle tracks public routes once and excludes private pages", async () => {
  const source = (await readFile(new URL("src/lib/client/analytics-lifecycle.svelte.js", root), "utf8"))
    .replace(/^import .*$/gm, "").replace("export function", "function")
  const calls = []
  let navigate
  const page = { route: { id: "/account" }, url: new URL("https://example.com/account?token=secret") }
  const context = vm.createContext({
    page, dev: false, public_page_analytics,
    afterNavigate: (callback) => { navigate = callback },
    inject: (options) => calls.push({ type: "inject", options }),
    pageview: (event) => calls.push({ type: "pageview", event }),
  })
  vm.runInContext(source + "\nregister_site_analytics()", context)
  navigate()
  assert.equal(calls.length, 0)
  page.url = new URL("https://example.com/?email=private")
  page.route.id = "/"
  navigate(); navigate()
  assert.equal(calls.filter((call) => call.type === "inject").length, 1)
  assert.equal(calls.filter((call) => call.type === "pageview").length, 2)
  assert.equal(calls[0].options.disableAutoTrack, true)
  assert.equal(calls[0].options.beforeSend, public_page_analytics)
  assert.equal(calls[1].event.path, "/")
  page.url = new URL("https://example.com/seasons/51/2?prediction=private")
  page.route.id = "/seasons/[season_number]/[episode_number]"
  navigate()
  const last = calls.at(-1).event
  assert.equal(last.path, "/seasons/51/2")
  // The generic SDK applies beforeSend to the real pathname, not to a template twice.
  const delivered = public_page_analytics({ type: "pageview", url: new URL(last.path, page.url).href })
  assert.equal(new URL(delivered.url).pathname, "/seasons/[season_number]/[episode_number]")
  page.url = new URL("https://example.com/settings?token=secret")
  const before = calls.length
  navigate()
  assert.equal(calls.length, before)
})
