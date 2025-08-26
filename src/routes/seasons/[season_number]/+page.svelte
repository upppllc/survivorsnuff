<script>
  import {
    create_button_manager,
    Button,
    create_image_manager,
    Image,
    format_date,
    Spacer,
    create_time_manager,
    Time,
  } from "sveltekit-ui"
  import { goto } from "$app/navigation"

  let { data } = $props()

  let view_seasons_button_manager = create_button_manager({
    text: "View Seasons",
    support_icon: "arrow_tailed",
    icon_pos: "left",
    icon_deg: 180,
    is_compressed: true,
    on_click: () => goto("/seasons"),
  })

  console.log("data", data)

  const storage_path = "/api/v1/storage/cb/{storage_id}"

  let content_prepped = $state(null)

  function prep_season(input) {
    let season_first_air_time_manager = create_time_manager({
      ...input?.season?.first_air_time,
      display_format: "calendar_date",
    })
    let season_last_air_time_manager = create_time_manager({
      ...input?.season?.last_air_time,
      display_format: "calendar_date",
    })

    let episodes_prepped = []
    if (Array.isArray(input?.episodes)) {
      for (let episode of input?.episodes) {
        let pitches_prepped = []
        if (Array.isArray(input?.pitches)) {
          for (let pitch of input?.pitches) {
            if (pitch?.episode == episode?.id) {
              let cover_image_manager = create_image_manager({
                storage_path,
                storage_id: pitch?.cover_storage_id,
                border_radius: 1,
              })
              let select_button_manager = create_button_manager({
                text: "View Pitch",
                support_icon: "arrow_tailed",
                on_click: () =>
                  goto(
                    `/seasons/${input?.season?.season_number}/${episode?.episode_number}/${pitch?.key.replace(/_/g, "-")}`
                  ),
              })
              pitches_prepped.push({
                ...pitch,
                cover_image_manager: cover_image_manager,
                select_button_manager: select_button_manager,
              })
            }
          }
        }
        episodes_prepped.push(episode)
      }
    }
    episodes_prepped = episodes_prepped.sort((a, b) => a.episode_number - b.episode_number)
    content_prepped = {
      season: input?.season,
      get season_first_air_time_manager() {
        return season_first_air_time_manager
      },
      get season_last_air_time_manager() {
        return season_last_air_time_manager
      },
      get episodes_prepped() {
        return episodes_prepped
      },
    }
  }

  prep_season(data)
</script>

<div style="margin: 1rem;">
  <Button manager={view_seasons_button_manager} />
  <h2 style="margin-top: 0;">Season {content_prepped?.season?.season_number}</h2>
  <p>{content_prepped?.season?.total_episodes} Total Episodes</p>
  <p>
    Aired <Time manager={content_prepped?.season_first_air_time_manager} /> to <Time
      manager={content_prepped?.season_last_air_time_manager}
    />
  </p>
  {#if Array.isArray(content_prepped?.episodes_prepped) && content_prepped?.episodes_prepped.length > 0}
    {#each content_prepped?.episodes_prepped as episode, i (episode?.id)}
      <h3>Episode {episode?.episode_number}</h3>
      <div style="display: flex; flex-wrap: wrap; gap: 1rem;">
        <div>
          <p class="label">Air Date</p>
          <p>{format_date(episode?.air_date)}</p>
          <p class="label" style="margin-top: 1rem;">Viewers</p>
          <p>{episode?.viewers_in_millions} million</p>
        </div>
        <div>
          <p class="label">Prod Code</p>
          <p>{episode?.prod_code}</p>
        </div>
      </div>
      {#if i < content_prepped?.episodes_prepped.length}
        <Spacer mt={1} mb={1} />
      {/if}
    {/each}
  {:else}
    <p>No Episodes Found</p>
  {/if}
</div>
