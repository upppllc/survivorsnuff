# Survivor Snuff

A SvelteKit fan guide to Survivor casts, seasons, and episode details. The current
season is Survivor 51, with an official cast guide and downloadable cast sheets.

## Local development

Use Node.js **22.12 or later** and npm:

```sh
npm ci
```

Create a local `.env` with the appropriate values for these private variables:

- `CONTIBASE_ACCESS_TOKEN`
- `CONTIBASE_SEASONS_TABLE_ID`
- `CONTIBASE_CASTAWAYS_TABLE_ID`
- `CONTIBASE_EPISODES_TABLE_ID`
- `CONTIBASE_USERS_TABLE_ID` — newsletter subscriptions and confirmation.

Also define `PUBLIC_APPLE_MAPKIT_JS_API_KEY` for maps in article content. This
variable is public and reaches the browser; the Contibase variables must remain
private. Existing environments may include `CONTIBASE_ACCOUNT_ID`, which is not
required by the current season loaders. `.env` files are ignored by Git.

```sh
npm run dev
```

## Validation and production build

```sh
npm run check
npm test
npm run build
```

The project uses the SvelteKit Vercel adapter. Configure the same environment
variables in the deployment environment.

## UI structure

Follow the `sveltekit-ui` component/manager pattern: route files pass data to a
paired `index.svelte` view and `index.svelte.js` manager under
`src/lib/components`. Keep state, derived display data, and event behavior in
the manager. Prefer the package's `Button`, `TextInput`, `Checkbox`, and `Layout`
components and their `create_*_manager` functions over bespoke controls.

The shared layout uses `create_global_manager`; Home, Seasons, Season, Episode,
and Error each have their own managers. Keep the package's default root sizing
and theme behavior, and style custom cast cards locally.

## Season data and maintenance

Historical seasons, castaways, episodes, and recap posts come from live
Contibase tables. `src/lib/server/seasons.js` combines current-season records
with the verified baseline in `src/lib/data/season-51.js`. Backend edits take
precedence; versioned photo references and source metadata remain available.
Current cast facts also remain available from the baseline if Contibase is
unavailable; photos depend on Contibase storage.

The 21 official season 51 portraits from [Deadline's CBS cast gallery](https://deadline.com/gallery/survivor-season-51-cast-photos-cbs/)
are public, permanent WebP objects in the Contibase `s51` storage folder. They
were converted at high quality from the 1280-pixel-wide source photos. Each
castaway's versioned record contains an `image_storage_id`, the original
Deadline JPEG `photo_source_url` for provenance, and Robert Voets / CBS credit.
The stored bytes were verified against the converted WebP files before the
superseded JPEGs were removed from local files and `s51` storage. Season 51
portraits use a taller 4:5 frame aligned to the top in the cast cards and PNG
exports. Ages are those published at the cast announcement.
See [the source notes](docs/season-51-sources.md).

To add the checked-in season 51 facts to a configured backend:

```sh
# Preview missing records without writing.
node --env-file=.env scripts/import-season-51.mjs

# Add missing records and verify them.
node --env-file=.env scripts/import-season-51.mjs --write
```

The importer never edits or deletes existing records. Re-running it skips
records already present. The current Contibase castaway table has no photo
columns, so storage references and photo credits remain in the versioned data
module. The importer does not upload photos or change the database schema.

Reviewed preseason profile summaries live in `src/lib/data/season-51-profiles.js`.
They appear in the cast grid and image exports without enabling spoilers.
Only this versioned source can supply spoiler-free narratives; backend bios
and arbitrary trust flags cannot bypass the spoiler gate. The current backend
has no summary column, so these profiles remain in the repository.

For a future season, add a verified data module and official photos, retain
source URLs and credits, then update `LATEST_SEASON` and the baseline import in
`src/lib/server/seasons.js`. Adapt the additive importer to that season before
running its preview. Keep unannounced facts and results unset.

## Cast sheet exports

On a season page, choose **Preview image** to preview the cast grid. On
supported phones, choose **Save or share photo** to open the native share sheet;
on iPhone, choose **Save Image** there to add the PNG to Photos. Cancelling the
share sheet keeps the preview open and does not start a download. If file
sharing is unavailable, touch and hold the preview image for photo options.
**Download PNG** remains available to save a file in any browser.

Use **Zoom preview** for a closer look, **Fit preview** to see the full width,
or **Close preview**. Generating a preview does not download anything. You can
choose **3 across**, **4 across** (the default), or **5 across** for the page and saved image,
in either Cast guide or My prediction. Phones keep two readable page columns;
the PNG always uses the selected count. Changing the count clears the old
preview and preserves prediction ranks. The grid and PNGs include all available
profile details and expand to fit them. Profiles use the full photo width over the
page background, with subtle divider lines instead of filled cards. Saved images
use compact text and credit the photos once in the footer. Search filters the people included in the export.
Results follow the spoiler toggle and are hidden by default.

In **My prediction**, enter **Your name (optional)** to add a byline to the image.
Leave it blank for an unnamed prediction. The regular cast guide has no name
input or byline. Changing the name clears the old preview; the name stays while
switching modes and grid widths on the current page.

Choose **My prediction** to arrange the entire cast with each person's **Up**
and **Down** buttons. Number 1 is the predicted winner; the last number is the
predicted first elimination. **Preview prediction** uses that order in the grid,
adds white rounded number badges to the photos, and labels the image as
a personal prediction. It always excludes actual results. Reordering clears the
old preview so the next saved image reflects the current picks.

Switching back to **Cast guide** restores its alphabetical order and existing
export behavior. Prediction picks remain available while switching modes and
grid widths on the current page; download or share the image before navigating away.
**Reset to alphabetical** starts the prediction over.

Spoiler-free pages show the whole cast with equal visual treatment in
alphabetical name order. Generic promotional sections do not feature selected
contestants. Results, tribe updates, episode titles, and unverified narrative
load only after someone explicitly reveals spoilers. Changing the export
settings clears its preview. See [the project conventions](AGENTS.md).

Images are rendered locally in the browser, independently of the page's scroll
position or screen size. Current and archive photos use the same-origin
Contibase storage proxy for the page and PNG exports. A failed photo
produces an error so the downloaded guide does not silently omit a castaway's
picture. The generated PNG remains available until the preview is closed or
its settings change.
