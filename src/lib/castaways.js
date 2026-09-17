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
