import assert from "node:assert/strict"
import test from "node:test"
import { startCastawayPrint } from "./castaway-print.js"

const preview = {
  blob: new Blob(["prepared-png"], { type: "image/png" }),
  url: "blob:https://survivorsnuff.com/preview-image",
  filename: "survivor-51-prediction.png",
  width: 1440,
  height: 6000,
}

function fixture() {
  const events = () => {
    const listeners = new Map()
    return {
      addEventListener(type, listener) {
        if (!listeners.has(type)) listeners.set(type, new Set())
        listeners.get(type).add(listener)
      },
      removeEventListener(type, listener) { listeners.get(type)?.delete(listener) },
      emit(type, event = {}) { for (const listener of [...(listeners.get(type) ?? [])]) listener(event) },
      listenerCount() { return [...listeners.values()].reduce((total, set) => total + set.size, 0) },
    }
  }
  const element = (tagName) => ({
    tagName, children: [], style: {}, attributes: {}, textContent: "", removed: false,
    append(child) { this.children.push(child) },
    replaceChildren(...children) { this.children = children },
    setAttribute(key, value) { this.attributes[key] = value },
    remove() { this.removed = true },
  })
  const media = events()
  const timers = new Map()
  let timerId = 0
  let printCalls = 0
  let focusCalls = 0
  let throwOnPrint = false
  const hostWindow = {
    ...events(),
    setTimeout(callback, delay) { timers.set(++timerId, { callback, delay }); return timerId },
    clearTimeout(id) { timers.delete(id) },
  }
  const printWindow = {
    ...events(),
    focus() { focusCalls++ },
    print() { printCalls++; if (throwOnPrint) throw new Error("Blocked") },
    matchMedia(query) { assert.equal(query, "print"); return media },
  }
  const frameDocument = { head: element("head"), body: element("body"), createElement: element }
  const frame = { ...element("iframe"), contentDocument: frameDocument, contentWindow: printWindow }
  const document = {
    body: element("body"), defaultView: hostWindow,
    createElement(tagName) { assert.equal(tagName, "iframe"); return frame },
  }
  return {
    document, frame, frameDocument, hostWindow, printWindow, media, timers,
    get photo() { return frameDocument.body.children[0]?.children[0] },
    get printCalls() { return printCalls },
    get focusCalls() { return focusCalls },
    failPrint() { throwOnPrint = true },
    loadFrame() { frame.onload?.() },
    loadPhoto() {
      this.photo.naturalWidth = preview.width
      this.photo.naturalHeight = preview.height
      this.photo.onload?.()
    },
    expirePreparation() { for (const timer of [...timers.values()]) timer.callback() },
  }
}

test("printing waits for the isolated preview image and keeps the frame until afterprint", async () => {
  const env = fixture()
  const job = startCastawayPrint(preview, env.document)
  assert.equal(env.document.body.children[0], env.frame)
  assert.equal(env.printCalls, 0)
  env.loadFrame()
  assert.equal(env.printCalls, 0)
  assert.equal(env.photo.src, preview.url)
  assert.equal(env.timers.size, 1)
  env.loadPhoto()
  assert.equal(env.printCalls, 1)
  assert.equal(env.focusCalls, 1)
  assert.equal(env.frame.removed, false, "returning from print must not remove an open dialog's document")
  assert.equal(env.timers.size, 0, "loading timeout cannot expire while the native dialog is open")
  let completed = false
  job.finished.then(() => { completed = true })
  await Promise.resolve()
  assert.equal(completed, false)
  env.printWindow.emit("afterprint")
  await job.finished
  assert.equal(env.frame.removed, true)
  assert.equal(env.hostWindow.listenerCount(), 0)
  assert.equal(env.printWindow.listenerCount(), 0)
  assert.equal(env.media.listenerCount(), 0)
})

test("print documents contain only safe text and an uncropped Letter sheet", async () => {
  for (const is_letter of [false, true]) {
    const env = fixture()
    const filename = '</title><script>attack()</script><img src=x onerror="attack()">'
    const job = startCastawayPrint({ ...preview, filename, is_letter }, env.document)
    env.loadFrame()
    assert.deepEqual(env.frameDocument.head.children.map((element) => element.tagName), ["title", "style"])
    assert.equal(env.frameDocument.head.children[0].textContent, filename)
    const styles = env.frameDocument.head.children[1].textContent
    assert.match(styles, /@page\s*\{ size: letter portrait; margin: 0;/)
    assert.match(styles, /width: 8\.5in; height: 11in/)
    assert.match(styles, /padding: 0\.25in/)
    assert.match(styles, /\.sheet\.is-letter\s*\{ padding: 0;/)
    assert.match(styles, /object-fit: contain/)
    assert.equal(env.frameDocument.body.children.length, 1)
    assert.equal(env.frameDocument.body.children[0].className, is_letter ? "sheet is-letter" : "sheet")
    assert.deepEqual(env.frameDocument.body.children[0].children.map((element) => element.tagName), ["img"])
    assert.equal(env.photo.width, preview.width)
    assert.equal(env.photo.height, preview.height)
    assert.equal(env.frame.attributes["aria-hidden"], "true")
    job.cancel()
    await job.finished
  }
})

test("canceling during loading or printing cleans up quietly without revoking the preview URL", async (context) => {
  const revoke = context.mock.method(URL, "revokeObjectURL", () => { throw new Error("The preview still owns this URL") })
  for (const phase of ["frame", "image", "printing"]) {
    const env = fixture()
    const job = startCastawayPrint(preview, env.document)
    if (phase !== "frame") env.loadFrame()
    if (phase === "printing") env.loadPhoto()
    job.cancel()
    job.cancel()
    await job.finished
    assert.equal(env.frame.removed, true)
    assert.equal(env.timers.size, 0)
    assert.equal(env.hostWindow.listenerCount(), 0)
    assert.equal(env.frame.onload, null)
    if (env.photo) assert.equal(env.photo.onload, null)
    assert.equal(env.printCalls, phase === "printing" ? 1 : 0)
  }
  assert.equal(revoke.mock.callCount(), 0)
})

test("page navigation cancels pending printing and releases the isolated document", async () => {
  const env = fixture()
  const job = startCastawayPrint(preview, env.document)
  env.loadFrame()
  env.hostWindow.emit("pagehide")
  await job.finished
  assert.equal(env.frame.removed, true)
  assert.equal(env.printCalls, 0)
  assert.equal(env.hostWindow.listenerCount(), 0)
})

test("a completed print-media cycle cleans up when afterprint is missing", async () => {
  const env = fixture()
  const job = startCastawayPrint(preview, env.document)
  env.loadFrame()
  env.loadPhoto()
  env.media.emit("change", { matches: false })
  assert.equal(env.frame.removed, false, "an initial non-print state is not proof the dialog closed")
  env.media.emit("change", { matches: true })
  assert.equal(env.frame.removed, false)
  env.media.emit("change", { matches: false })
  await job.finished
  assert.equal(env.frame.removed, true)
})

test("load failure and bounded preparation timeout reject and clean up before printing", async () => {
  for (const phase of ["frame timeout", "image timeout", "image error", "empty image"]) {
    const env = fixture()
    const job = startCastawayPrint(preview, env.document)
    const rejected = assert.rejects(job.finished, /load|prepared/)
    assert.equal([...env.timers.values()][0].delay, 20_000)
    if (phase !== "frame timeout") env.loadFrame()
    if (phase.endsWith("timeout")) env.expirePreparation()
    else if (phase === "image error") env.photo.onerror()
    else env.photo.onload()
    await rejected
    assert.equal(env.printCalls, 0)
    assert.equal(env.frame.removed, true)
    assert.equal(env.timers.size, 0)
  }
})

test("unsupported preview input and blocked print dialogs fail without printing the parent page", async () => {
  const env = fixture()
  const invalid = startCastawayPrint({ ...preview, url: "javascript:attack()" }, env.document)
  await assert.rejects(invalid.finished, /Create an image preview/)
  assert.equal(env.document.body.children.length, 0)
  const unavailable = startCastawayPrint(preview, null)
  await assert.rejects(unavailable.finished, /web browser/)
  const blocked = startCastawayPrint(preview, env.document)
  const rejected = assert.rejects(blocked.finished, /could not open the print dialog/)
  env.loadFrame()
  env.failPrint()
  env.loadPhoto()
  await rejected
  assert.equal(env.printCalls, 1)
  assert.equal(env.frame.removed, true)
})
