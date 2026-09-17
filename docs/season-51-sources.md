# Survivor 51 data

Verified September 17, 2026, before the September 23 premiere.

The checked-in `src/lib/data/season-51.js` exports `season`, `castaways`, and
`episodes`, plus a default object containing all three. Ages refer to the CBS
cast announcement, not dynamically calculated current ages.

## Sources

- [CBS cast announcement, August 26, 2026](https://www.paramountpressexpress.com/cbs-entertainment/shows/survivor/releases/?view=113157-survivor-reveals-the-21-new-castaways-competing-on-the-51st-edition-the-first-in-the-series-new-open-era-with-a-two-hour-season-premiere-on-wednesday): all 21 names, ages, occupations, hometowns, current residences, premiere date, and the Open Era format.
- [Paramount+ official cast profiles, September 16, 2026](https://www.paramountplus.com/sneak-peak/survivor-season-51-cast/): official cast photographs. Each record retains its exact image URL and CBS photo credit.
- [Paramount+ season guide](https://www.paramountplus.com/sneak-peak/survivor-season-51-everything-to-know/): two-hour September 23 premiere and 90-minute weekly Wednesday episodes at 8 PM ET/PT, beginning September 30.
- [CBS episode listing](https://www.paramountpressexpress.com/cbs-entertainment/shows/survivor/episodes/): episode 1, “Permanent Uncertainty,” September 23 at 8 PM.

Tribe assignments, the finale date, total playing days, results, and contestant
interview answers are not filled in without a verified source. No elimination
rumors or invented biographies are included. State abbreviations are expanded
for readability; CBS's published spelling “Charlestown” is retained for Maggie
Nestor's residence.

## Photos

The 21 JPEGs in `static/castaways/51/` are the 1024 × 683 official CBS photos
published in the Paramount+ cast article. They are stored locally so pages and
PNG exports can use the same origin without depending on third-party image
servers. Credit: CBS. Copyright remains with the original rights holder.

## Contibase import

Run from the repository root with Node 22 or later:

```sh
node --env-file=.env scripts/import-season-51.mjs
node --env-file=.env scripts/import-season-51.mjs --write
```

The first command previews missing records. The second adds only missing season
51 records to the configured seasons, castaways, and episodes tables, then
verifies them. It uses the existing application's `POST /api/v1/tables/:id/rows`
API with a `row_data` body. It never updates or deletes existing records and
aborts on unexpected schemas, incomplete reads, or duplicate identities.

Required environment variables are `CONTIBASE_ACCESS_TOKEN`,
`CONTIBASE_SEASONS_TABLE_ID`, `CONTIBASE_CASTAWAYS_TABLE_ID`, and
`CONTIBASE_EPISODES_TABLE_ID`. Credentials are not included in this repository.

The existing castaway table has no photo or source columns. Those fields live in
the versioned local data module; server loaders can supplement backend records
with the local metadata. No database schema changes or storage uploads are
required.
