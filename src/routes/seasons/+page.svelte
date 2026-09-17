<script>
  import Seasons from "$lib/components/Seasons/index.svelte"
  import { create_seasons_manager } from "$lib/components/Seasons/index.svelte.js"
  let { data } = $props()
  const manager = create_seasons_manager({ seasons: () => data.seasons })
</script>

<svelte:head><title>Survivor Season Archive | Survivor Snuff</title><meta name="description" content="Explore Survivor castaways, photos, and cast sheets by season." /></svelte:head>
<Seasons {manager} />
