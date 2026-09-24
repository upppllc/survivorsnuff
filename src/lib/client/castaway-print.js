const PREPARATION_TIMEOUT_MS = 20_000
const PRINT_STYLES = `
  @page { size: letter portrait; margin: 0; }
  html, body { margin: 0; padding: 0; width: 8.5in; height: 11in; background: #fff; }
  .sheet { box-sizing: border-box; width: 8.5in; height: 11in; padding: 0.25in;
    overflow: hidden; break-inside: avoid; page-break-inside: avoid; }
  .sheet.is-letter { padding: 0; }
  img { display: block; width: 100%; height: 100%; object-fit: contain; object-position: center;
    print-color-adjust: exact; -webkit-print-color-adjust: exact; }
`

/** Print only an already-generated preview; cancellation never revokes its shared URL. */
export function startCastawayPrint(image, printDocument = globalThis.document) {
  let resolveFinished
  let rejectFinished
  const finished = new Promise((resolve, reject) => {
    resolveFinished = resolve
    rejectFinished = reject
  })
  let frame
  let photo
  let printWindow
  let printMedia
  let preparationTimer
  let prepared = false
  let printing = false
  let enteredPrintMedia = false
  let settled = false
  const hostWindow = printDocument?.defaultView

  function finish(error) {
    if (settled) return
    settled = true
    if (preparationTimer != null) hostWindow.clearTimeout(preparationTimer)
    if (photo) photo.onload = photo.onerror = null
    if (frame) frame.onload = frame.onerror = null
    printWindow?.removeEventListener("afterprint", afterPrint)
    hostWindow?.removeEventListener("afterprint", afterPrint)
    hostWindow?.removeEventListener("pagehide", cancel)
    if (printMedia?.removeEventListener) printMedia.removeEventListener("change", mediaChanged)
    else printMedia?.removeListener?.(mediaChanged)
    frame?.remove()
    if (error) rejectFinished(error)
    else resolveFinished()
  }

  function cancel() {
    finish()
  }

  function afterPrint() {
    if (printing) finish()
  }

  function mediaChanged(event) {
    if (!printing) return
    if (event.matches) enteredPrintMedia = true
    else if (enteredPrintMedia) finish()
  }

  function openPrintDialog() {
    if (settled || printing) return
    if (!photo.naturalWidth || !photo.naturalHeight) {
      finish(new Error("The preview image could not be prepared for printing. Create it again and retry."))
      return
    }
    hostWindow.clearTimeout(preparationTimer)
    preparationTimer = null
    printing = true
    try {
      printWindow.focus()
      printWindow.print()
      // Some browsers return immediately while their dialog remains open. Keep
      // the frame until afterprint, a completed print-media cycle, or cancel().
    } catch {
      finish(new Error("Your browser could not open the print dialog. Download the PNG and print it instead."))
    }
  }

  function prepare() {
    if (settled || prepared) return
    prepared = true
    try {
      const document = frame.contentDocument
      printWindow = frame.contentWindow
      if (!document?.head || !document?.body || typeof printWindow?.print !== "function") {
        throw new Error("Printing is unavailable.")
      }
      const title = document.createElement("title")
      title.textContent = typeof image.filename === "string" ? image.filename : "Survivor cast sheet"
      const style = document.createElement("style")
      style.textContent = PRINT_STYLES
      document.head.replaceChildren(title, style)
      const sheet = document.createElement("div")
      sheet.className = image.is_letter === true ? "sheet is-letter" : "sheet"
      photo = document.createElement("img")
      photo.alt = "Prepared Survivor cast image"
      photo.width = image.width
      photo.height = image.height
      photo.onload = openPrintDialog
      photo.onerror = () => finish(new Error("The preview image could not be loaded for printing. Create it again and retry."))
      sheet.append(photo)
      document.body.replaceChildren(sheet)
      printWindow.addEventListener("afterprint", afterPrint)
      hostWindow.addEventListener("afterprint", afterPrint)
      printMedia = printWindow.matchMedia?.("print")
      if (printMedia?.addEventListener) printMedia.addEventListener("change", mediaChanged)
      else printMedia?.addListener?.(mediaChanged)
      photo.src = image.url
      if (photo.complete && photo.naturalWidth > 0) openPrintDialog()
    } catch {
      finish(new Error("Your browser could not prepare this preview for printing. Download the PNG and print it instead."))
    }
  }

  try {
    if (!printDocument?.body || !hostWindow) throw new Error("Print this preview from a web browser.")
    if (!image?.blob || typeof image.url !== "string" || !image.url.startsWith("blob:")
      || !Number.isFinite(image.width) || image.width <= 0 || !Number.isFinite(image.height) || image.height <= 0) {
      throw new Error("Create an image preview before printing.")
    }
    frame = printDocument.createElement("iframe")
    frame.title = "Cast image print document"
    frame.setAttribute("aria-hidden", "true")
    frame.tabIndex = -1
    frame.style.cssText = "position:fixed;left:-10000px;top:0;width:8.5in;height:11in;border:0;pointer-events:none;"
    frame.onload = prepare
    frame.onerror = () => finish(new Error("Your browser could not prepare the print document. Please try again."))
    frame.src = "about:blank"
    hostWindow.addEventListener("pagehide", cancel)
    preparationTimer = hostWindow.setTimeout(() => finish(new Error("The preview took too long to load for printing. Please try again.")), PREPARATION_TIMEOUT_MS)
    printDocument.body.append(frame)
  } catch (error) {
    finish(error instanceof Error ? error : new Error("The print preview could not be prepared."))
  }
  return { finished, cancel }
}
