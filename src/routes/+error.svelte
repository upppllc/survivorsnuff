<script>
  import { Button, create_button_manager } from "sveltekit-ui"
  import { goto } from "$app/navigation"
  import { page } from "$app/state"

  let is_loading = $state(false)
  function try_again() {
    is_loading = true
    setTimeout(() => {
      goto(page.url)
      is_loading = false
    }, 1000)
  }

  let refresh_button_manager = create_button_manager({
    type: "outlined",
    support_icon: "refresh",
    icon_size: 2,
    icon_sw: 40,
    ml: 1.5,
    mr: 1.5,
    mt: 3,
    is_loading: () => is_loading,
    text: "Try Again",
    on_click: () => try_again(),
  })

  let goto_home_button_manager = create_button_manager({
    support_icon: "arrow_tailed",
    icon_size: 2,
    icon_sw: 40,
    ml: 1.5,
    mr: 1.5,
    mt: 1.5,
    text: "Go to Home Page",
    on_click: () => goto("/"),
  })
</script>

<svelte:head>
  <title>survivorsnuff - Error</title>
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
</svelte:head>

<div class="container">
  <img src="/something-went-wrong.webp" width="250px" height="auto" alt="Something went wrong" />
  <h2>Something went wrong</h2>
  {#if page?.error?.message}
    <p style="text-align: left; font-size: 2rem; color: var(--g7-t);">
      {page?.error?.message}
    </p>
  {/if}
  <div style="max-width: 30rem; margin: 0 auto;">
    <Button manager={refresh_button_manager} />
    <Button manager={goto_home_button_manager} />
  </div>
</div>

<style>
  .container {
    margin: 1rem auto;
    margin-top: 3rem;
    text-align: center;
    max-width: 60rem;
  }
  .container h2 {
    margin: 3rem auto;
  }
</style>
