import { castawayImageSrc } from "../castaways.js"

const WIDTH = 1440
const MARGIN = 60
const GAP = 24
const MAX_PIXELS = 16_000_000
const MAX_DIMENSION = 16_384
const COLORS = {
  background: "#f3efe5",
  card: "#fffdf7",
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

function fieldsFor(castaway, layout, showSpoilers) {
  const fields = []
  function add(label, value) {
    const text = valueText(value)
    if (text) fields.push({ label, text })
  }
  add("Age", castaway.age)
  add("Occupation", castaway.occupation)
  add("Hometown", castaway.hometown)
  if (layout === "details") {
    add("Current residence", castaway.current_residence)
    add("Traits", castaway.traits)
    add("Why they applied", castaway.why_applied)
    add("Life experience", castaway.life_experience)
    add("Their game", castaway.unique_gameplay)
    add("About", castaway.summary)
  }
  add("Tribe", castaway.tribe?.name ?? castaway.tribe_name ?? castaway.tribe)
  if (showSpoilers && Number.isInteger(castaway.result_order)) {
    add("Finish", `${castaway.result_order}${castaway.is_on_jury ? " · Jury member" : ""}`)
  }
  return fields
}

/** Pure layout pass shared by rendering and geometry tests. */
export function measureCastawayImage({ season, castaways, layout = "grid", showSpoilers = false, measure }) {
  if (!["grid", "details"].includes(layout)) throw new Error("Choose a grid or detailed cast image.")
  if (!Array.isArray(castaways) || castaways.length === 0) throw new Error("There are no castaways to save yet.")

  const operations = []
  const text = (content, x, y, width, size, weight = 400, color = COLORS.body, heading = false) => {
    const lines = wrapImageText(content, width, (line) => measure(line, size, weight, heading))
    const lineHeight = Math.ceil(size * 1.35)
    operations.push({ type: "text", lines, x, y, width, size, weight, color, heading, lineHeight })
    return y + lines.length * lineHeight
  }

  const title = `Survivor ${valueText(season?.season_number)}`.trim()
  let y = text("SURVIVOR SNUFF  /  CAST GUIDE", MARGIN, 48, WIDTH - MARGIN * 2, 20, 700, COLORS.accent)
  y = text(title, MARGIN, y + 14, WIDTH - MARGIN * 2, 56, 700, COLORS.ink, true)
  const subtitle = [valueText(season?.title), `${castaways.length} castaways`, layout === "grid" ? "Meet the cast" : "Get to know the cast"]
    .filter(Boolean)
    .join("  ·  ")
  y = text(subtitle, MARGIN, y + 8, WIDTH - MARGIN * 2, 24, 400, COLORS.muted)
  if (showSpoilers) y = text("INCLUDES SEASON RESULTS", MARGIN, y + 12, WIDTH - MARGIN * 2, 18, 700, COLORS.accent)
  y += 34

  const columns = layout === "grid" ? 3 : 1
  const cardWidth = (WIDTH - 2 * MARGIN - GAP * (columns - 1)) / columns
  const cards = []
  for (let index = 0; index < castaways.length; index += columns) {
    const row = []
    for (let column = 0; column < columns && index + column < castaways.length; column++) {
      const castaway = castaways[index + column]
      const x = MARGIN + column * (cardWidth + GAP)
      const card = { type: "card", x, y, width: cardWidth, height: 0 }
      operations.push(card)
      const padding = layout === "grid" ? 24 : 30
      const imageWidth = layout === "grid" ? cardWidth : 240
      const imageHeight = layout === "grid" ? cardWidth * 1.05 : 288
      const imageX = layout === "grid" ? x : x + padding
      const imageY = layout === "grid" ? y : y + padding
      operations.push({ type: "photo", index: index + column, x: imageX, y: imageY, width: imageWidth, height: imageHeight })
      const textX = layout === "grid" ? x + padding : imageX + imageWidth + 30
      const textWidth = layout === "grid" ? cardWidth - 2 * padding : cardWidth - imageWidth - 3 * padding
      let bottom = layout === "grid" ? y + imageHeight + padding : y + padding
      bottom = text(valueText(castaway.name) || "Castaway", textX, bottom, textWidth, layout === "grid" ? 32 : 36, 700, COLORS.ink, true)
      bottom += 14
      for (const field of fieldsFor(castaway, layout, showSpoilers)) {
        if (layout === "grid") {
          bottom = text(`${field.label}: ${field.text}`, textX, bottom, textWidth, 22)
          bottom += 7
        } else {
          bottom = text(field.label.toUpperCase(), textX, bottom, textWidth, 17, 700, COLORS.accent)
          bottom = text(field.text, textX, bottom + 3, textWidth, 23)
          bottom += 16
        }
      }
      const credit = valueText(castaway.photo_credit ?? castaway.image_credit)
      if (credit) {
        if (layout === "grid") {
          bottom = text(credit, textX, bottom + 8, textWidth, 15, 400, COLORS.muted)
        } else {
          const creditBottom = text(credit, imageX, imageY + imageHeight + 12, imageWidth, 15, 400, COLORS.muted)
          bottom = Math.max(bottom, creditBottom)
        }
      }
      card.height = Math.ceil(Math.max(bottom - y, imageY + imageHeight - y) + padding)
      row.push(card)
      cards.push(card)
    }
    const rowHeight = Math.max(...row.map((card) => card.height))
    for (const card of row) card.height = rowHeight
    y += rowHeight + GAP
  }

  y += 16
  y = text("survivorsnuff.com", MARGIN, y, WIDTH - MARGIN * 2, 25, 700, COLORS.ink)
  const photoCredit = valueText(season?.photo_credit ?? season?.image_credit) || "Cast photos: CBS / Paramount"
  y = text(photoCredit, MARGIN, y + 8, WIDTH - MARGIN * 2, 18, 400, COLORS.muted)
  y = text("An independent fan guide. Survivor is a CBS / Paramount series.", MARGIN, y + 7, WIDTH - MARGIN * 2, 17, 400, COLORS.muted)
  return { width: WIDTH, height: Math.ceil(y + 48), operations, cards }
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
export async function createCastawayImage({ season, castaways, layout = "grid", showSpoilers = false }) {
  if (typeof document === "undefined") throw new Error("Save the cast image from a web browser.")
  if (!Array.isArray(castaways) || castaways.length === 0) throw new Error("There are no castaways to save yet.")
  const font = await headingFont()
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d", { alpha: false })
  if (!ctx) throw new Error("Your browser could not create the cast image. Try another browser.")
  const setFont = (size, weight, heading) => {
    ctx.font = `${weight} ${size}px ${heading ? font : "Arial, sans-serif"}`
  }
  const measured = measureCastawayImage({
    season, castaways, layout, showSpoilers,
    measure: (text, size, weight, heading) => {
      setFont(size, weight, heading)
      return ctx.measureText(text).width
    },
  })
  const photos = await loadPhotos(castaways, season?.season_number)
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
      roundedRect(ctx, operation.x, operation.y, operation.width, operation.height, 20)
      ctx.fillStyle = COLORS.card
      ctx.fill()
      ctx.strokeStyle = COLORS.border
      ctx.lineWidth = 1
      ctx.stroke()
    } else if (operation.type === "photo") {
      const photo = photos[operation.index]
      const cropScale = Math.max(operation.width / photo.naturalWidth, operation.height / photo.naturalHeight)
      const sourceWidth = operation.width / cropScale
      const sourceHeight = operation.height / cropScale
      const sourceX = (photo.naturalWidth - sourceWidth) / 2
      // Portraits are aligned near the top so faces remain in frame.
      const sourceY = (photo.naturalHeight - sourceHeight) * 0.15
      ctx.save()
      roundedRect(ctx, operation.x, operation.y, operation.width, operation.height, 18)
      ctx.clip()
      ctx.drawImage(photo, sourceX, sourceY, sourceWidth, sourceHeight, operation.x, operation.y, operation.width, operation.height)
      ctx.restore()
    } else if (operation.type === "text") {
      setFont(operation.size, operation.weight, operation.heading)
      ctx.fillStyle = operation.color
      operation.lines.forEach((line, index) => ctx.fillText(line, operation.x, operation.y + index * operation.lineHeight))
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
  if (!blob) throw new Error("The cast image was too large for this browser. Try the compact grid or a desktop browser.")
  const seasonNumber = String(season?.season_number ?? "cast").replace(/[^a-z\d-]/gi, "")
  return {
    blob,
    filename: `survivor-${seasonNumber}-cast-${layout}${showSpoilers ? "-with-results" : ""}.png`,
    width: dimensions.width,
    height: dimensions.height,
  }
}
