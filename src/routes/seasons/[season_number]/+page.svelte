<script>
  import { create_season_manager } from "$lib/components/Season/index.svelte.js"
  import Season from "$lib/components/Season/index.svelte"

  let { data } = $props()
  let manager = $derived(create_season_manager(data))
</script>

<div style="margin: 1rem;">
  <Season {manager} />
</div>
