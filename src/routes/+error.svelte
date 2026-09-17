<script>
  import { page } from "$app/state"
  import ErrorPage from "$lib/components/Error/index.svelte"
  import { create_error_manager } from "$lib/components/Error/index.svelte.js"

  const manager = create_error_manager({ status: () => page.status, message: () => page.error?.message })
</script>

<ErrorPage {manager} />
