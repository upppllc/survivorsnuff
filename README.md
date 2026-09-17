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
precedence; local photo and source metadata remain available. The current cast
guide also works from its baseline if Contibase is unavailable.

Official season 51 photos live in `static/castaways/51/`. Each castaway records
the original photo URL, source URL, and CBS credit. Ages are those published at
the cast announcement. See [the source notes](docs/season-51-sources.md).

To add the checked-in season 51 facts to a configured backend:

```sh
# Preview missing records without writing.
node --env-file=.env scripts/import-season-51.mjs

# Add missing records and verify them.
node --env-file=.env scripts/import-season-51.mjs --write
```

The importer never edits or deletes existing records. Re-running it skips
records already present. Photo files are deployed with the site; the current
Contibase castaway table has no photo columns.

Reviewed preseason profile summaries live in `src/lib/data/season-51-profiles.js`.
They appear in both cast views and image exports without enabling spoilers.
Only this versioned source can supply spoiler-free narratives; backend bios
and arbitrary trust flags cannot bypass the spoiler gate. The current backend
has no summary column, so these profiles remain in the repository.

For a future season, add a verified data module and official photos, retain
source URLs and credits, then update `LATEST_SEASON` and the baseline import in
`src/lib/server/seasons.js`. Adapt the additive importer to that season before
running its preview. Keep unannounced facts and results unset.

## Cast sheet exports

On a season page, choose **Grid** or **Details**, then **Preview image**. Review
the scrollable preview and choose **Save PNG** to download, **Zoom preview**
for a closer look, **Fit preview** to see the full width, or **Close preview**. Generating a preview
does not download anything. Grid PNGs
always use three columns; detailed PNGs use one castaway per row and expand to
fit available information. Search filters the people included in the export.
Results follow the spoiler toggle and are hidden by default.

Spoiler-free pages show the whole cast with equal visual treatment in
alphabetical name order. Generic promotional sections do not feature selected
contestants. Results, tribe updates, episode titles, and unverified narrative
load only after someone explicitly reveals spoilers. Changing the export
settings clears its preview. See [the project conventions](AGENTS.md).

Images are rendered locally in the browser, independently of the page's scroll
position or screen size. Current photos load from the site; archive photos use
the same-origin Contibase storage proxy. A failed photo produces an error so
the downloaded guide does not silently omit a castaway's picture. The generated
PNG remains available until the preview is closed or its settings change.
