import { castawayImageSrc, castawayProfileDetails, sortCastawaysAlphabetically } from "../castaways.js"

const WIDTH = 1440
const MARGIN = 60
const GAP = 24
const MAX_PIXELS = 16_000_000
const MAX_DIMENSION = 16_384
const COLORS = {
  background: "#f3efe5",
  ink: "#173e37",
  body: "#384c46",
  muted: "#596c63",
  accent: "#a64d2e",
  border: "#dedfd2",
}

function valueText(value) {
  if (Array.isArray(value)) return value.map(valueText).filter(Boolean).join(", ")
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : ""
}

function gridColumnCount(value) {
  return Number.isInteger(value) && value >= 3 && value <= 8 ? value : 4
}

/** Wrap every character, including long words and explicit paragraph breaks. */
export function wrapImageText(text, maxWidth, measure) {
  if (!(maxWidth > 0)) throw new Error("Text width must be positive.")
  const lines = []
  for (const paragraph of String(text).replace(/\r\n?/g, "\n").split("\n")) {
    let line = ""
    for (const word of paragraph.trim().split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word
      if (measure(next) <= maxWidth) {
        line = next
        continue
      }
      if (line) {
        lines.push(line)
        line = ""
      }
      if (measure(word) <= maxWidth) {
        line = word
        continue
      }
      for (const character of Array.from(word)) {
        if (line && measure(line + character) > maxWidth) {
          lines.push(line)
          line = ""
        }
        line += character
      }
    }
    lines.push(line)
  }
  return lines
}

function fieldsFor(castaway, showSpoilers) {
  const fields = []
  const profile = castawayProfileDetails(castaway, showSpoilers)
  function add(label, value) {
    const text = valueText(value)
    if (text) fields.push({ label, text })
  }
  add("Age", castaway.age)
  add("Occupation", castaway.occupation)
  add("Hometown", castaway.hometown)
  add("Current residence", castaway.current_residence)
  add("Traits", profile.traits)
  const labels = { preseason: "Before the island", summary: "About", why_applied: "Why they applied", life_experience: "Life experience", unique_gameplay: "Their game" }
  for (const bio of profile.bios) add(labels[bio.key], bio.value)
  add("Tribe", profile.tribe)
  if (showSpoilers && Number.isInteger(castaway.result_order)) {
    add("Finish", `${castaway.result_order}${castaway.is_on_jury ? " · Jury member" : ""}`)
  }
  return fields
}

/** Pure layout pass shared by rendering and geometry tests. */
export function measureCastawayImage({ season, castaways, gridColumns = 4, showSpoilers = false, prediction = false, authorName = "", measure }) {
  if (!Array.isArray(castaways) || castaways.length === 0) throw new Error("There are no castaways to save yet.")
  prediction = prediction === true
  castaways = prediction ? [...castaways] : sortCastawaysAlphabetically(castaways)
  showSpoilers = !prediction && showSpoilers === true
  const columns = gridColumnCount(gridColumns)
  const width = columns > 5
    ? Math.ceil((WIDTH - 2 * MARGIN - GAP * 4) / 5 * columns + 2 * MARGIN + GAP * (columns - 1))
    : WIDTH

  const operations = []
  const text = (content, x, y, width, size, weight = 400, color = COLORS.body, heading = false, align = "left", singleLine = false) => {
    const lines = singleLine ? [content] : wrapImageText(content, width, (line) => measure(line, size, weight, heading))
    const lineHeight = Math.ceil(size * 1.35)
    operations.push({ type: "text", lines, x, y, width, size, weight, color, heading, lineHeight, ...(align === "right" ? { align } : {}) })
    return y + lines.length * lineHeight
  }

  const title = `Survivor ${valueText(season?.season_number)}`.trim()
  const author = prediction && typeof authorName === "string" ? authorName.trim().replace(/\s+/g, " ") : ""
  const naturalAuthorWidth = author ? measure(author, 92, 700, true) : 0
  const authorWidth = author ? Math.min(Math.max(480, naturalAuthorWidth + 2), width - MARGIN * 2 - 560 - 36) : 0
  const headerWidth = width - MARGIN * 2 - (author ? authorWidth + 36 : 0)
  let y = text(prediction ? "SURVIVOR SNUFF  /  MY ELIMINATION PREDICTION" : "SURVIVOR SNUFF  /  CAST GUIDE", MARGIN, 48, headerWidth, 19, 700, COLORS.accent)
  y = text(title, MARGIN, y + 14, headerWidth, 52, 700, COLORS.ink, true)
  const subtitle = [valueText(season?.title), `${castaways.length} castaways`, prediction ? `1 = predicted winner  ·  ${castaways.length} = first eliminated` : "Alphabetical by name"]
    .filter(Boolean)
    .join("  ·  ")
  y = text(subtitle, MARGIN, y + 8, headerWidth, 22, 400, COLORS.muted)
  if (author) {
    const authorSize = Math.min(92, 92 * (authorWidth - 2) / naturalAuthorWidth)
    const authorBottom = text(author, width - MARGIN - authorWidth, 48, authorWidth, authorSize, 700, COLORS.accent, true, "right", true)
    y = Math.max(y, authorBottom)
  }
  if (showSpoilers) y = text("INCLUDES SEASON RESULTS", MARGIN, y + 12, headerWidth, 17, 700, COLORS.accent)
  y += 34

  const cardWidth = (width - 2 * MARGIN - GAP * (columns - 1)) / columns
  const cards = []
  for (let index = 0; index < castaways.length; index += columns) {
    const row = []
    for (let column = 0; column < columns && index + column < castaways.length; column++) {
      const castaway = castaways[index + column]
      const x = MARGIN + column * (cardWidth + GAP)
      const card = { type: "card", x, y, width: cardWidth, height: 0 }
      operations.push(card)
      const padding = 24
      const imageHeight = cardWidth * (Number(season?.season_number) === 51 ? 1.25 : 1.05)
      operations.push({ type: "photo", index: index + column, x, y, width: cardWidth, height: imageHeight })
      if (prediction) {
        operations.push({ type: "prediction_badge", index: index + column, rank: index + column + 1, x: x + 16, y: y + 16, width: 64, height: 64 })
      }
      const textX = x
      const textWidth = cardWidth
      let bottom = y + imageHeight + padding
      bottom = text(valueText(castaway.name) || "Castaway", textX, bottom, textWidth, 30, 700, COLORS.ink, true)
      bottom += 14
      for (const field of fieldsFor(castaway, showSpoilers)) {
        bottom = text(`${field.label}: ${field.text}`, textX, bottom, textWidth, 20)
        bottom += 7
      }
      card.height = Math.ceil(bottom - y + padding)
      row.push(card)
      cards.push(card)
    }
    const rowHeight = Math.max(...row.map((card) => card.height))
    for (const card of row) card.height = rowHeight
    y += rowHeight + GAP
  }

  y += 16
  const photoCredit = (valueText(season?.photo_credit ?? season?.image_credit) || "Cast photos: CBS / Paramount").replace(/\s+/g, " ")
  const footer = [
    { content: "survivorsnuff.com", weight: 700, color: COLORS.ink },
    { content: photoCredit, weight: 400, color: COLORS.muted },
    { content: "An independent fan guide. Survivor is a CBS / Paramount series.", weight: 400, color: COLORS.muted },
  ]
  const footerWidth = width - MARGIN * 2
  const naturalWidth = footer.reduce((sum, part) => sum + measure(part.content, 17, part.weight, false), 0)
  const footerSize = Math.min(17, 17 * (footerWidth - 48 - footer.length) / naturalWidth)
  const footerWidths = footer.map((part) => measure(part.content, footerSize, part.weight, false) + 1)
  const footerGap = (footerWidth - footerWidths.reduce((sum, width) => sum + width, 0)) / (footer.length - 1)
  const footerY = y
  let footerX = MARGIN
  footer.forEach((part, index) => {
    y = text(part.content, footerX, footerY, footerWidths[index], footerSize, part.weight, part.color)
    footerX += footerWidths[index] + footerGap
  })
  return { width, height: Math.ceil(y + 48), operations, cards, orderedCastaways: castaways }
}

export function castawayCanvasSize(width, height) {
  const scale = Math.min(1.5, Math.sqrt(MAX_PIXELS / (width * height)), MAX_DIMENSION / width, MAX_DIMENSION / height)
  return { width: Math.max(1, Math.floor(width * scale)), height: Math.max(1, Math.floor(height * scale)), scale }
}

async function headingFont() {
  if (!document.fonts?.load) return "Arial, sans-serif"
  let timer
  try {
    const loaded = await Promise.race([
      document.fonts.load('700 36px "Quicksand"'),
      new Promise((resolve) => { timer = setTimeout(() => resolve([]), 6000) }),
    ])
    return loaded.length ? '"Quicksand", Arial, sans-serif' : "Arial, sans-serif"
  } catch {
    return "Arial, sans-serif"
  } finally {
    clearTimeout(timer)
  }
}

function loadPhoto(castaway, seasonNumber) {
  return new Promise((resolve, reject) => {
    const name = valueText(castaway.name) || "this castaway"
    const source = castawayImageSrc(castaway, seasonNumber)
    if (!source) {
      reject(new Error(`A photo is not available for ${name}. Please try again after their photo is added.`))
      return
    }
    const img = new Image()
    const cleanup = () => {
      clearTimeout(timer)
      img.onload = null
      img.onerror = null
    }
    const fail = () => {
      cleanup()
      img.src = ""
      reject(new Error(`Could not load the photo for ${name}. Check your connection and try saving again.`))
    }
    const timer = setTimeout(fail, 20_000)
    img.onload = () => {
      if (!img.naturalWidth || !img.naturalHeight) {
        fail()
        return
      }
      cleanup()
      resolve(img)
    }
    img.onerror = fail
    img.src = source
  })
}

async function loadPhotos(castaways, seasonNumber) {
  const photos = new Array(castaways.length)
  let next = 0
  let failed = false
  await Promise.all(Array.from({ length: Math.min(4, castaways.length) }, async () => {
    while (!failed && next < castaways.length) {
      const index = next++
      try {
        photos[index] = await loadPhoto(castaways[index], seasonNumber)
      } catch (error) {
        failed = true
        throw error
      }
    }
  }))
  return photos
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + width, y, x + width, y + height, radius)
  ctx.arcTo(x + width, y + height, x, y + height, radius)
  ctx.arcTo(x, y + height, x, y, radius)
  ctx.arcTo(x, y, x + width, y, radius)
  ctx.closePath()
}

/** Render a full cast guide independently of the page size or scroll position. */
export async function createCastawayImage({ season, castaways, gridColumns = 4, showSpoilers = false, prediction = false, authorName = "" }) {
  if (typeof document === "undefined") throw new Error("Save the cast image from a web browser.")
  if (!Array.isArray(castaways) || castaways.length === 0) throw new Error("There are no castaways to save yet.")
  prediction = prediction === true
  showSpoilers = !prediction && showSpoilers === true
  const font = await headingFont()
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d", { alpha: false })
  if (!ctx) throw new Error("Your browser could not create the cast image. Try another browser.")
  const setFont = (size, weight, heading) => {
    ctx.font = `${weight} ${size}px ${heading ? font : "Arial, sans-serif"}`
  }
  const measured = measureCastawayImage({
    season, castaways, gridColumns, showSpoilers, prediction, authorName,
    measure: (text, size, weight, heading) => {
      setFont(size, weight, heading)
      return ctx.measureText(text).width
    },
  })
  const photos = await loadPhotos(measured.orderedCastaways, season?.season_number)
  const dimensions = castawayCanvasSize(measured.width, measured.height)
  canvas.width = dimensions.width
  canvas.height = dimensions.height
  ctx.scale(dimensions.scale, dimensions.scale)
  ctx.fillStyle = COLORS.background
  ctx.fillRect(0, 0, measured.width, measured.height)
  ctx.textBaseline = "top"
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"

  for (const operation of measured.operations) {
    if (operation.type === "card") {
      ctx.beginPath()
      ctx.moveTo(operation.x, operation.y + operation.height)
      ctx.lineTo(operation.x + operation.width, operation.y + operation.height)
      ctx.strokeStyle = COLORS.border
      ctx.lineWidth = 1
      ctx.stroke()
    } else if (operation.type === "photo") {
      const photo = photos[operation.index]
      const cropScale = Math.max(operation.width / photo.naturalWidth, operation.height / photo.naturalHeight)
      const sourceWidth = operation.width / cropScale
      const sourceHeight = operation.height / cropScale
      const sourceX = (photo.naturalWidth - sourceWidth) / 2
      // The full-length season 51 portraits need top alignment to keep faces in frame.
      const sourceY = (photo.naturalHeight - sourceHeight) * (Number(season?.season_number) === 51 ? 0 : 0.15)
      ctx.save()
      roundedRect(ctx, operation.x, operation.y, operation.width, operation.height, 18)
      ctx.clip()
      ctx.drawImage(photo, sourceX, sourceY, sourceWidth, sourceHeight, operation.x, operation.y, operation.width, operation.height)
      ctx.restore()
    } else if (operation.type === "prediction_badge") {
      ctx.save()
      ctx.shadowColor = "rgba(0, 0, 0, 0.24)"
      ctx.shadowBlur = 12
      ctx.shadowOffsetY = 3
      roundedRect(ctx, operation.x, operation.y, operation.width, operation.height, 12)
      ctx.fillStyle = "#ffffff"
      ctx.fill()
      ctx.shadowColor = "transparent"
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0
      ctx.fillStyle = COLORS.ink
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      setFont(operation.width * 0.5, 700, false)
      ctx.fillText(String(operation.rank), operation.x + operation.width / 2, operation.y + operation.height / 2 + 1)
      ctx.restore()
    } else if (operation.type === "text") {
      setFont(operation.size, operation.weight, operation.heading)
      ctx.fillStyle = operation.color
      ctx.textAlign = operation.align ?? "left"
      const textX = operation.align === "right" ? operation.x + operation.width : operation.x
      operation.lines.forEach((line, index) => ctx.fillText(line, textX, operation.y + index * operation.lineHeight))
    }
  }

  let blob
  try {
    blob = await new Promise((resolve, reject) => {
      try {
        canvas.toBlob(resolve, "image/png")
      } catch (error) {
        reject(error)
      }
    })
  } catch {
    throw new Error("Your browser could not save the cast photos. Reload the page and try again.")
  } finally {
    // Release the large backing surface once the PNG has been encoded.
    canvas.width = 1
    canvas.height = 1
  }
  if (!blob) throw new Error("The cast image was too large for this browser. Try a desktop browser.")
  const seasonNumber = String(season?.season_number ?? "cast").replace(/[^a-z\d-]/gi, "")
  const columnsSuffix = `-${gridColumnCount(gridColumns)}-columns`
  return {
    blob,
    filename: prediction
      ? `survivor-${seasonNumber}-prediction-grid${columnsSuffix}.png`
      : `survivor-${seasonNumber}-cast-grid${showSpoilers ? "-with-results" : ""}${columnsSuffix}.png`,
    width: dimensions.width,
    height: dimensions.height,
  }
}
