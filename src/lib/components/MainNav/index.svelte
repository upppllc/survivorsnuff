<script>
  import { Button, create_button_manager } from "sveltekit-ui"
  import { goto } from "$app/navigation"
  import { page } from "$app/state"
  import { global_manager } from "$lib/client/index.svelte.js"

  const nav_options = [
    {
      id: "home",
      name: "Home",
      route: "/",
      support_icon: "house",
    },
    {
      id: "test",
      name: "Test",
      route: "/test",
      support_icon: null,
    },
  ]

  let nav_button_managers = $state(
    nav_options.map((h) =>
      create_button_manager({
        type: "soft",
        text_align: "left",
        icon_pos: "left",
        support_icon: h?.support_icon,
        text: h?.name,
        selected_type: () => {
          const current_path = page?.route?.id || "/"
          const first_segment = current_path.split("/")[1] || ""
          const nav_segment = h.route.split("/")[1] || ""
          return first_segment === nav_segment ? "half_selected" : null
        },
        on_click: () => {
          global_manager.layout_manager?.set_is_full_nav_toggled_on(false)
          goto(h?.route)
        },
      })
    )
  )
</script>

{#each nav_button_managers as nav_button_manager}
  <Button manager={nav_button_manager} />
{/each}
