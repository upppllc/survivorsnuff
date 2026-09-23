# Survivor 51 data

Cast facts verified September 17, 2026; photos replaced September 22, 2026,
before the September 23 premiere.

The checked-in `src/lib/data/season-51.js` exports `season`, `castaways`, and
`episodes`, plus a default object containing all three. Ages refer to the CBS
cast announcement, not dynamically calculated current ages.

## Sources

- [CBS cast announcement, August 26, 2026](https://www.paramountpressexpress.com/cbs-entertainment/shows/survivor/releases/?view=113157-survivor-reveals-the-21-new-castaways-competing-on-the-51st-edition-the-first-in-the-series-new-open-era-with-a-two-hour-season-premiere-on-wednesday): all 21 names, ages, occupations, hometowns, current residences, premiere date, and the Open Era format.
- [Paramount+ official cast profiles, September 16, 2026](https://www.paramountplus.com/sneak-peak/survivor-season-51-cast/): preseason background facts and the original photos, which were replaced on September 22.
- [Deadline's Survivor 51 CBS cast gallery](https://deadline.com/gallery/survivor-season-51-cast-photos-cbs/): the current 21 official preseason portraits, credited to Robert Voets / CBS. Photos were matched to castaways by their exact caption names.
- [Paramount+ season guide](https://www.paramountplus.com/sneak-peak/survivor-season-51-everything-to-know/): two-hour September 23 premiere and 90-minute weekly Wednesday episodes at 8 PM ET/PT, beginning September 30.
- [CBS episode listing](https://www.paramountpressexpress.com/cbs-entertainment/shows/survivor/episodes/): episode 1, “Permanent Uncertainty,” September 23 at 8 PM.

Tribe assignments, the finale date, total playing days, results, and contestant
interview answers are not filled in without a verified source. No elimination
rumors or invented biographies are included. State abbreviations are expanded
for readability; CBS's published spelling “Charlestown” is retained for Maggie
Nestor's residence.

## Preseason profiles

`src/lib/data/season-51-profiles.js` contains one short, original summary for each
of the 21 castaways, keyed by the exact cast name. The summaries total 166 words
and paraphrase only background facts or stated preseason plans from the official
Paramount+ article above. Every entry retains its source URL. No quotations,
rankings, predictions, or season outcomes are included.

## Photos

On September 22, 2026, all 21 old JPEGs in `static/castaways/51/` were deleted
and replaced with the portrait-oriented official preseason photos from the
Deadline gallery above. Each person was matched by the gallery's exact caption
name, without selecting or ordering photos by season outcomes.

The source JPEGs were downloaded from their image URLs with `?w=1280`:
20 are 1280 × 1920, and Aaliyah Puglia's is 1280 × 1791. They were converted
to WebP at quality 90 with encoding method 6, retaining those dimensions and
preserving available ICC and EXIF metadata where supported. The converted
WebP files were uploaded as public, permanent `image/webp` objects in the
Contibase `s51` storage folder. Stored bytes were verified against each
converted WebP file.

After verification, all 21 superseded JPEG storage objects and the temporary
source JPEGs were deleted. The `s51` folder contains only the 21 WebP portraits;
no season 51 JPEGs remain locally or in that storage folder, and no cast-photo
copies remain in the repository.

Each record in `src/lib/data/season-51.js` retains the new WebP
`image_storage_id`, the exact resized Deadline JPEG URL in `photo_source_url`
for provenance, and the Robert Voets / CBS credit. The page and both PNG export
layouts load the WebP objects through the same-origin `/api/storage/:storage_id`
proxy. Season 51 photos use taller 4:5 frames aligned to the top in cast cards
and both export layouts to keep faces visible; archive crops are unchanged.
Copyright remains with the original rights holder.

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

The existing castaway table has no photo or source columns. All 21 season 51
cast identities matched during the photo replacement. Storage IDs, photo URLs,
and credits live in the versioned local data module; server loaders supplement
backend records with that metadata. The photo replacement uploaded storage
objects separately and required no database schema changes. The additive table
importer does not upload photos.

The live castaway schema was checked again for profile persistence: all 21
season 51 identities matched, but the table has no `summary` column. Audited
profile summaries therefore remain in the versioned local module. No summary
importer, database schema change, or updates to other narrative columns were
made; the website can use its reviewed local profiles directly.
