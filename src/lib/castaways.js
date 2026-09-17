import { season51Profiles } from "./data/season-51-profiles.js"

const nameOrder = new Intl.Collator("en", { sensitivity: "base", numeric: true })

/** A neutral cast order that never depends on placement, survival, or jury status. */
export function sortCastawaysAlphabetically(castaways = []) {
  return [...castaways].sort((a, b) => {
    const byName = nameOrder.compare(String(a?.name ?? ""), String(b?.name ?? ""))
    if (byName) return byName
    const neutralKey = (person) => [person?.name, person?.hometown, person?.occupation, person?.age].join("\u0000")
    return neutralKey(a).localeCompare(neutralKey(b), "en")
  })
}

/** Only the reviewed, versioned preseason profiles bypass the spoiler gate. */
export function castawayProfileDetails(castaway, showSpoilers = false) {
  const includeNarrative = showSpoilers === true
  const preseason = Number(castaway?.season_number) === 51 && Object.hasOwn(season51Profiles, castaway?.name)
    ? season51Profiles[castaway.name]
    : null
  const bios = preseason ? [{ key: "preseason", label: "Before the island", value: preseason.summary }] : []
  if (includeNarrative) {
    bios.push(...[
      { key: "summary", label: "About", value: castaway?.summary ?? castaway?.bio },
      { key: "why_applied", label: "Why Survivor", value: castaway?.why_applied },
      { key: "life_experience", label: "Life experience", value: castaway?.life_experience },
      { key: "unique_gameplay", label: "Game plan", value: castaway?.unique_gameplay },
    ].filter((bio) => bio.value && bio.value !== preseason?.summary))
  }
  return {
    traits: includeNarrative ? castaway?.traits : null,
    tribe: includeNarrative ? castaway?.tribe?.name ?? castaway?.tribe_name ?? castaway?.tribe : null,
    bios,
  }
}

/** Keep cast photos on this origin so they also work in downloadable images. */
export function castawayImageSrc(castaway, seasonNumber) {
  const imageUrl = castaway?.image_url?.trim()
  if (imageUrl && /^\/(?!\/)/.test(imageUrl)) return imageUrl
  if (imageUrl && !/^[a-z][a-z\d+.-]*:|^\/\//i.test(imageUrl)) return `/${imageUrl}`

  if (imageUrl) {
    try {
      const url = new URL(imageUrl)
      if (["survivorsnuff.com", "www.survivorsnuff.com"].includes(url.hostname)) {
        return `${url.pathname}${url.search}`
      }
      if (["contibase.com", "www.contibase.com"].includes(url.hostname)) {
        const storageId = url.pathname.match(/^\/api\/v1\/storage\/([^/]+)$/)?.[1]
        if (storageId) return `/api/storage/${storageId}`
      }
    } catch {
      // Invalid legacy URLs can still use the stored ID or deterministic filename.
    }
  }

  if (castaway?.image_storage_id) return `/api/storage/${encodeURIComponent(castaway.image_storage_id)}`

  const number = seasonNumber ?? castaway?.season_number
  const name = String(castaway?.name ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\./g, "")
    .replace(/[\s'’\-–—]+/g, "_")
    .replace(/[^a-z0-9_]/gi, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase()

  return number && name ? `/api/storage/ukkvrwvfuaqnotejkqua__s${number}__${name}` : ""
}
