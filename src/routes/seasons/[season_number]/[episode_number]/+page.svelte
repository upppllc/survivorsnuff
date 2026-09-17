<script>
  import Episode from "$lib/components/Episode/index.svelte"
  import { create_episode_manager } from "$lib/components/Episode/index.svelte.js"

  let { data } = $props()
  const manager = create_episode_manager({ data: () => data })
</script>

<Episode {manager} />
