# Project conventions

- Use `sveltekit-ui` components and their managers for controls, navigation,
  forms, and layout. Prefer paired `index.svelte` and `index.svelte.js` files
  under `src/lib/components`; keep state and behavior in the manager.
- Preserve the package's root sizing and theme conventions. Keep custom cast
  card styles scoped to their component.
- Use package icons such as `arrow_tailed` for directional controls instead
  of text arrows. Cast-image exports should preview before an explicit save.

# Spoiler protection

Spoiler avoidance is a top user priority, especially for ongoing seasons.

- Default pages, metadata, and image exports must not reveal or imply outcomes.
  Load results and potentially revealing narrative only after explicit opt-in.
- Show the entire cast with equal visual treatment in alphabetical name order.
  Do not select featured contestants, predictions, favorites, or promotional
  portraits that could imply who advances. Use neutral season graphics instead.
- Never sort, highlight, dim, hide, or group contestants by placement or status
  in spoiler-free mode. Generic tribe labels and retrospective bios can leak
  outcomes too; keep them behind the spoiler control.
- Reset spoiler visibility on navigation and remove generated previews when
  their spoiler settings change. Keep the reveal control present regardless
  of whether results exist, so its presence does not itself signal an outcome.
- Import only verified public facts and official preseason photos for new
  seasons. Do not use leaks, speculation, or behind-the-scenes knowledge.
- Keep reviewed preseason profiles in versioned source data. Do not treat
  arbitrary backend flags as permission to show unreviewed biographies.
- Verify spoiler-free output with synthetic result-bearing data, including
  serialized server data, both image layouts, and direct episode navigation.
