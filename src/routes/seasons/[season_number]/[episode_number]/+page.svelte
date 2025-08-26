<script>
  import { create_button_manager, Button, create_image_manager, Image, format_date, Spacer } from "sveltekit-ui"
  import { goto } from "$app/navigation"

  let { data } = $props()

  let view_season_button_manager = create_button_manager({
    text: () => `View Season ${data?.season?.season_number}`,
    support_icon: "arrow_tailed",
    icon_pos: "left",
    icon_deg: 180,
    is_compressed: true,
    on_click: () => goto(`/seasons/${data?.season?.season_number}`),
  })

  console.log("data", data)

  const storage_path = "/api/v1/storage/cb/{storage_id}"

  let content_prepped = $state(null)

  function prep_season(input) {
    let pitches_prepped = []
    if (Array.isArray(input?.pitches)) {
      for (let pitch of input?.pitches) {
        if (pitch?.episode == input?.episode?.id) {
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
                `/seasons/${input?.season?.season_number}/${input?.episode?.episode_number}/${pitch?.key.replace(/_/g, "-")}`
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
    pitches_prepped = pitches_prepped.sort((a, b) => a.order_shown_in_episode - b.order_shown_in_episode)
    let updates_prepped = []
    if (Array.isArray(input?.company_episode_updates)) {
      for (let company_episode_update of input?.company_episode_updates) {
        if (company_episode_update?.episode == input?.episode?.id) {
          const company = data?.companies?.find((h) => h?.id == company_episode_update?.company)
          updates_prepped.push({
            ...company,
            ...company_episode_update,
          })
        }
      }
    }
    let sharks_prepped = []
    for (let shark_id of Object.keys(input?.episode?.sharks).sort(
      (a, b) => input?.episode?.sharks[a]?.seat_order_l_to_r - input?.episode?.sharks[b]?.seat_order_l_to_r
    )) {
      const shark = data?.sharks?.find((h) => h?.id == shark_id)
      let image_manager = create_image_manager({
        storage_path,
        storage_id: shark?.profile_storage_id,
        storage_id_quick: shark?.profile_storage_id_quick,
        alt: shark?.name,
        image_width: 512,
        image_height: 512,
        display_max_height: 70,
        display_max_width: 70,
        bg_img_blur: 10,
        bg_img_opacity: 0.1,
      })
      sharks_prepped.push({
        ...shark,
        image_manager: image_manager,
      })
    }
    content_prepped = {
      season: input?.season,
      get episode_prepped() {
        return {
          ...input?.episode,
          sharks_prepped: sharks_prepped,
          pitches_prepped: pitches_prepped,
          updates_prepped: updates_prepped,
        }
      },
    }
  }

  prep_season(data)
</script>

<div style="margin: 1rem;">
  <Button manager={view_season_button_manager} />
  <h2 style="margin-top: 0;">
    Season {content_prepped?.season?.season_number}, Episode {content_prepped?.episode_prepped?.episode_number}
  </h2>

  <div style="display: flex; flex-wrap: wrap; gap: 1rem;">
    <div>
      <h4 class="label">Sharks in Episode</h4>
      {#if Array.isArray(content_prepped?.episode_prepped?.sharks_prepped) && content_prepped?.episode_prepped?.sharks_prepped.length > 0}
        <div class="sharks_container">
          {#each content_prepped?.episode_prepped?.sharks_prepped as shark_prepped}
            <Image manager={shark_prepped?.image_manager} />
          {/each}
        </div>
      {:else}
        <p>No Sharks Found</p>
      {/if}
    </div>
    <div>
      <p class="label">Air Date</p>
      <p>{format_date(content_prepped?.episode_prepped?.air_date)}</p>
      <p class="label" style="margin-top: 1rem;">Viewers</p>
      <p>{content_prepped?.episode_prepped?.viewers_in_millions} million</p>
    </div>
    <div>
      <p class="label">Prod Code</p>
      <p>{content_prepped?.episode_prepped?.prod_code}</p>
    </div>
    {#if Array.isArray(content_prepped?.episode_prepped?.updates_prepped) && content_prepped?.episode_prepped?.updates_prepped.length > 0}
      <div>
        <p class="label">Updates</p>
        {#each content_prepped?.episode_prepped?.updates_prepped as update_prepped}
          <p>{update_prepped?.name}</p>
        {/each}
      </div>
    {/if}
  </div>
  <div class="pitch_container">
    {#if Array.isArray(content_prepped?.episode_prepped?.pitches_prepped) && content_prepped?.episode_prepped?.pitches_prepped.length > 0}
      {#each content_prepped?.episode_prepped?.pitches_prepped as pitch_prepped}
        <div
          class="card"
          style="display: flex; flex-direction: column; flex: 1; justify-content: space-between; gap: 1rem; margin: 0;"
        >
          <div>
            <Image manager={pitch_prepped?.cover_image_manager} />
            <h4>{pitch_prepped?.name}</h4>
            <p>{pitch_prepped?.main_presenters}</p>
            <!-- <h4>{pitch_prepped?.id}</h4> -->
          </div>
          <Button manager={pitch_prepped?.select_button_manager} />
        </div>
      {/each}
    {:else}
      <div class="card">
        <p>no pitches found</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .sharks_container {
    display: flex;
    gap: 1rem;
  }
  .pitch_container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }
</style>
