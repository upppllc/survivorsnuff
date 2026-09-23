<script>
  import { create_season_manager } from "$lib/components/Season/index.svelte.js"
  import Season from "$lib/components/Season/index.svelte"
  let { data } = $props()
  let manager = $derived(create_season_manager(data))
</script>
<svelte:head>
  <title>Survivor {data.season.season_number} Cast & Cast Sheets | Survivor Snuff</title>
  <meta name="description" content={`Meet the Survivor ${data.season.season_number} castaways. Browse photos and full profiles, then preview and save your cast grid or personal prediction.`} />
</svelte:head>
<div class="season-wrapper">{#key data.season.season_number}<Season {manager} />{/key}</div>
<style>.season-wrapper { max-width: 1168px; margin: 0 auto; padding: 1.6rem 2.4rem 4.8rem; } @media (max-width: 600px) { .season-wrapper { padding: 1.6rem; } }</style>
