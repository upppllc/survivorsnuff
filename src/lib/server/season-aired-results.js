// Aired outcomes belong in this server-only module, never the public preseason
// data or prediction-code registry. Default routes still use publicSeasonData.
// S51 E1 aired September 23, 2026. Aaliyah was the first elimination from 21:
// https://www.tvline.com/2267004/survivor-51-premiere-recap-coin-flip-return-aaliyah-voted-out/
// https://www.cbs.com/shows/survivor/
const airedResults = {
  51: [{ name: "Aaliyah Puglia", result_order: 21 }],
}

/** Apply only reviewed aired facts, including when the backend is unavailable. */
export function applyAiredResults(seasonNumber, castaways = []) {
  const number = Number(seasonNumber)
  const results = airedResults[number] ?? []
  const placements = new Map()
  for (const result of results) {
    // Skip ambiguous identities instead of applying a placement to two people.
    const matches = castaways.filter((person) => person.name === result.name && Number(person.season_number) === number)
    if (matches.length === 1) placements.set(matches[0], result.result_order)
  }
  return castaways.map((person) => placements.has(person)
    ? { ...person, result_order: placements.get(person) }
    : person)
}
