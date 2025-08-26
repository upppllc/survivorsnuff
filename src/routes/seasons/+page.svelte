<script>
  import { create_button_manager, Button, create_time_manager, Time } from "sveltekit-ui"
  import { goto } from "$app/navigation"

  let { data } = $props()

  let seasons_prepped = $state(null)

  prep_seasons(data?.seasons)

  function prep_seasons(seasons) {
    let seasons_prepped_loc = []
    if (Array.isArray(seasons) && seasons.length > 0) {
      for (let season of seasons) {
        seasons_prepped_loc.push({
          ...season,
          select_button_manager: create_button_manager({
            is_compressed: true,
            text: "Visit",
            support_icon: "arrow_tailed",
            on_click: () => goto(`/seasons/${season?.season_number}`),
          }),
          first_air_time_manager: create_time_manager({ ...season?.first_air_time, display_format: "calendar_date" }),
          last_air_time_manager: create_time_manager({ ...season?.last_air_time, display_format: "calendar_date" }),
        })
      }
    }
    seasons_prepped_loc.sort((a, b) => b.season_number - a.season_number)
    seasons_prepped = seasons_prepped_loc
  }
</script>

<div style="margin: auto; padding: 0 1rem; max-width: 60rem;">
  <h2 style="margin-top: 0;">Seasons</h2>
  {#if Array.isArray(seasons_prepped) && seasons_prepped.length > 0}
    <div style="display: grid; gap: 1rem;">
      {#each seasons_prepped as season_prepped}
        <div
          class="cardns"
          style="display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1rem; padding: 1rem;"
        >
          <div>
            <h3 style="margin: 0;">Season {season_prepped?.season_number}</h3>
            <p>{season_prepped?.total_episodes} total episodes</p>
            <p>
              Aired <Time manager={season_prepped?.first_air_time_manager} /> to <Time
                manager={season_prepped?.last_air_time_manager}
              />
            </p>
          </div>
          <div style="align-self: end; margin-left: auto">
            <Button manager={season_prepped?.select_button_manager} />
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <p>No seasons found</p>
  {/if}
</div>
