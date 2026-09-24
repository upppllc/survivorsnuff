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

Enable **Fit to 8.5 × 11 paper** before previewing to add background margins for
portrait US Letter paper. This keeps every photo and line of text without cropping
or stretching; the saved PNG and shared photo have the same paper proportions.
The normal image keeps its natural height, with compact spacing around names,
rows, the header, and footer. Changing the paper option clears the old preview.
**Print** in the preview opens the browser's print dialog for just the image,
fitted to one Letter page with margins. Choose the matching paper size in your
printer settings; printing is never started automatically.

The preview stays fitted to the available width, with save/share, download, Print, and
an outlined **Close preview** button at the top right. Generating a preview does
not download anything. You can
choose **3 through 8 across** in **Grid Width** (**7 across** is the default) for the saved image,
in either Cast guide or My prediction. The page grid responds to available screen
width independently of this setting; the PNG uses the selected count.
Images with 6–8 columns become wider to
preserve the profile text width. Changing the count clears the old
preview and preserves prediction ranks. The grid and PNGs include all available
profile details and expand to fit them. Profiles use the full photo width over the
page background, with subtle divider lines instead of filled cards. Saved images
use compact text and credit the photos once in the footer. The whole cast is included in each export.
Results follow the spoiler toggle and are hidden by default.

In **My prediction**, enter **Your name (optional)** to put your name in bold
orange at the top right of the image. The name stays on one line, fitting its
font size to the available header space when needed.
Leave it blank for an unnamed prediction. The regular cast guide has no name
input or author name. Changing the name clears the old preview and saves the name
alongside your order in the URL. Names stay while switching modes and grid widths.

Choose **My prediction** to arrange the entire cast by dragging cards or with each
person's **Up** and **Down** buttons. Photos no longer drag independently.
Number 1 is the predicted winner; the last number is the
predicted first elimination. **Preview prediction** uses that order in the grid,
adds white rounded number badges to the photos, and labels the image as
a personal prediction. Actual results stay hidden by default. **Show actual
placements (spoilers)** explicitly loads recorded finishing places and adds red
numbers in the opposite corner on the page and exported image. Unrecorded places
stay blank; the white prediction numbers and chosen order do not change. This
does not reveal retrospective biographies or episode titles in prediction mode.
The results setting is never stored in the URL. Changing it or reordering clears
the old preview so the next saved image reflects the current settings.

After revealing spoilers, **Sort by** offers **Actual order** alongside
**My prediction** (in prediction mode) or **Alphabetical** (in Cast guide).
Castaways without a recorded finish appear alphabetically first; recorded places
follow from best to last, so recent eliminations sit above the first out.
This order also applies to previews, downloads, and printing. White prediction
numbers stay attached to the original picks, and red numbers show actual finishes.
Switch back to **My prediction** to use the reorder controls. Sorting never edits
the saved prediction or URL. Hiding spoilers or navigating resets the sort.

Reviewed aired placements are also kept in `src/lib/server/season-aired-results.js`
so they remain available during backend outages. Keep outcomes in server-only
modules, never in the client preseason facts or permanent prediction-code registry.
Normal page and episode responses continue stripping all results before serialization.

Switching back to **Cast guide** restores its alphabetical order and existing
export behavior. Prediction picks remain available while switching modes and
grid widths on the current page. Prediction order and the optional name are saved
in the URL as you edit; refresh, bookmark, or copy that URL to restore both. Older
order-only and named links still work and automatically shorten when opened,
preserving the picks, name, unrelated query parameters, and hash without reloading
or adding a browser history entry. Returning to Cast guide clears the prediction from
the current URL. **Reset to alphabetical**, separated below the grid,
starts the prediction over and updates its URL.

Compact links use `?prediction=3.51.ABCDEFGHIJKLMNOPQRSTU&name=Jordan`: the format
version, season number, and permanent castaway codes in prediction order. The
optional name is a separate parameter. The entire prediction lives in the URL;
there is no saved prediction record or extra database request.

`src/lib/data/prediction-codes.js` freezes the public identity/code mapping for
seasons 1–51. Codes were assigned once alphabetically, not from results, and must
never be reassigned or reused. Add a new season's verified public cast with unused
single-character codes (`A–Z`, `a–z`, `0–9`); when adding a person to an existing
season, retain every existing assignment. Match stable database IDs first and
unique public names second so season 51's offline baseline shares the same codes.
Do not derive codes from runtime array positions. Extend the registry tests when
adding seasons. Unknown or ambiguous cast records retain the longer version 2
format until their identity mapping is reviewed; an unrelated `name` query
parameter also keeps the version 2 format rather than being overwritten.

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
