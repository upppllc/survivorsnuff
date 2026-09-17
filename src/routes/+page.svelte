<script>
  import Home from "$lib/components/Home/index.svelte"
  import { create_home_manager } from "$lib/components/Home/index.svelte.js"

  let { data } = $props()
  let manager = $derived(create_home_manager(data))
</script>

<svelte:head>
  <title>{manager.page_title}</title>
  <meta name="description" content={manager.page_description} />
  <link rel="canonical" href="https://www.survivorsnuff.com/" />
</svelte:head>

<Home {manager} />
