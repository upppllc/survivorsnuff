import assert from "node:assert/strict"
import test from "node:test"
import { prepareCastawayShareFile, shareCastawayFile } from "./castaway-share.js"

const image = { blob: new Blob(["png-image-content"], { type: "image/png" }), filename: "survivor-51-cast-grid.png" }

test("file sharing tests the actual named PNG and preserves its bytes", async () => {
  let checked
  const file = prepareCastawayShareFile(image, { share() {}, canShare(data) { checked = data; return true } })
  assert.ok(file instanceof File)
  assert.deepEqual(Object.keys(checked), ["files"])
  assert.equal(checked.files[0], file)
  assert.equal(file.name, image.filename)
  assert.equal(file.type, "image/png")
  assert.equal(await file.text(), await image.blob.text())
})

test("unsupported or blocked file sharing leaves the download fallback available", () => {
  for (const navigator of [undefined, {}, { share() {} }, { share() {}, canShare: () => false },
    { share() {}, canShare() { throw new Error("Blocked") } }]) {
    assert.equal(prepareCastawayShareFile(image, navigator), null)
  }
})

test("native sharing starts synchronously from the tap and shares only the prepared file", async () => {
  const file = new File([image.blob], image.filename, { type: "image/png" })
  let called = false
  let finish
  const result = shareCastawayFile(file, { share(data) {
    called = true
    assert.deepEqual(data, { files: [file] })
    return new Promise((resolve) => { finish = resolve })
  } })
  assert.equal(called, true, "share must run before any promise turn loses tap activation")
  finish()
  assert.equal(await result, "shared")
})

test("cancellation is quiet and share failures never trigger a download", async () => {
  const file = new File([image.blob], image.filename, { type: "image/png" })
  for (const name of ["AbortError", "NotAllowedError", "DataError"]) {
    for (const synchronous of [false, true]) {
      const error = Object.assign(new Error(name), { name })
      const result = await shareCastawayFile(file, { share() {
        if (synchronous) throw error
        return Promise.reject(error)
      } })
      assert.equal(result, name === "AbortError" ? "cancelled" : "failed")
    }
  }
  assert.equal(await shareCastawayFile(null, {}), "unavailable")
  assert.equal(await shareCastawayFile(file, {}), "unavailable")
})
