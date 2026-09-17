/** Prepare the actual PNG before the next tap so sharing retains user activation. */
export function prepareCastawayShareFile(image, shareNavigator = globalThis.navigator) {
  if (!image?.blob || typeof File !== "function" || typeof shareNavigator?.share !== "function" || typeof shareNavigator?.canShare !== "function") return null
  try {
    const file = new File([image.blob], image.filename, { type: "image/png" })
    return shareNavigator.canShare({ files: [file] }) ? file : null
  } catch {
    return null
  }
}

/** Call directly from a button handler: no async work may precede native share. */
export function shareCastawayFile(file, shareNavigator = globalThis.navigator) {
  if (!file || typeof shareNavigator?.share !== "function") return Promise.resolve("unavailable")
  const failed = (error) => error?.name === "AbortError" ? "cancelled" : "failed"
  try {
    // File-only sharing offers image actions rather than sharing the web page.
    const pending = shareNavigator.share({ files: [file] })
    return Promise.resolve(pending).then(() => "shared", failed)
  } catch (error) {
    return Promise.resolve(failed(error))
  }
}
