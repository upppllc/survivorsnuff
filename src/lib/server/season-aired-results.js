// Aired outcomes belong in this server-only module, never the public preseason
// data or prediction-code registry. Default routes still use publicSeasonData.
// S51 E1 aired September 23, 2026. Aaliyah was the first elimination from 21:
// https://www.tvline.com/2267004/survivor-51-premiere-recap-coin-flip-return-aaliyah-voted-out/
// https://www.cbs.com/shows/survivor/
// Departure order and Rob's quit updated from the owner's October 7, 2026 report.
// result_order is finishing place: first out of 21 is #21, fourth out is #18.
const airedResults = {
  51: [
    { name: "Aaliyah Puglia", result_order: 21, departure_reason: "voted_out" },
    { name: "Ana Sani", result_order: 20, departure_reason: "voted_out" },
    { name: "Rob Antonson", result_order: 19, departure_reason: "quit" },
    { name: "Patt Cannaday", result_order: 18, departure_reason: "voted_out" },
  ],
}

/** Apply only reviewed aired facts, including when the backend is unavailable. */
export function applyAiredResults(seasonNumber, castaways = []) {
  const number = Number(seasonNumber)
  const results = airedResults[number] ?? []
  const outcomes = new Map()
  for (const result of results) {
    // Skip ambiguous identities instead of applying a placement to two people.
    const matches = castaways.filter((person) => person.name === result.name && Number(person.season_number) === number)
    if (matches.length === 1) outcomes.set(matches[0], {
      result_order: result.result_order,
      departure_reason: result.departure_reason,
    })
  }
  return castaways.map((person) => outcomes.has(person)
    ? { ...person, ...outcomes.get(person) }
    : person)
}
