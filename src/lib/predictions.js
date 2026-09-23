import { sortCastawaysAlphabetically } from "./castaways.js"

/** An identity for a user's prediction; never derived from actual results. */
export function predictionCastawayKey(person) {
  const id = person?.id
  return id != null && String(id) !== "" ? `id:${id}` : `name:${person?.name ?? ""}`
}

/** Keep the user's order, with any new castaways appended in neutral name order. */
export function orderPredictionCastaways(castaways = [], order = []) {
  const positions = new Map()
  for (const key of order) {
    if (!positions.has(key)) positions.set(key, positions.size)
  }
  return sortCastawaysAlphabetically(castaways).sort((a, b) => {
    const aPosition = positions.get(predictionCastawayKey(a)) ?? Infinity
    const bPosition = positions.get(predictionCastawayKey(b)) ?? Infinity
    return aPosition === bPosition ? 0 : aPosition - bPosition
  })
}

/** Move one prediction by one place, returning the complete normalized key order. */
export function movePredictionCastaway(castaways = [], order = [], key, direction) {
  const nextOrder = [...new Set(orderPredictionCastaways(castaways, order).map(predictionCastawayKey))]
  if (direction !== -1 && direction !== 1) return nextOrder
  const index = nextOrder.indexOf(key)
  const nextIndex = index + direction
  if (index < 0 || nextIndex < 0 || nextIndex >= nextOrder.length) return nextOrder
  ;[nextOrder[index], nextOrder[nextIndex]] = [nextOrder[nextIndex], nextOrder[index]]
  return nextOrder
}
