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
    console.log("prep_season", input?.season?.first_air_time)
    let season_first_air_time_manager = create_time_manager({
      val: input?.season?.first_air_time,
      display_format: "calendar_date",
    })
    let season_last_air_time_manager = create_time_manager({
      val: input?.season?.last_air_time,
      display_format: "calendar_date",
    })

    let episodes_prepped = []
    if (Array.isArray(input?.episodes)) {
      for (let episode of input?.episodes) {
        let air_time_manager = create_time_manager({
          ...episode?.air_time,
          display_format: "calendar_date",
        })
        episodes_prepped.push({
          ...episode,
          get air_time_manager() {
            return air_time_manager
          },
        })
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
  <div class="table_container">
    <table style="margin: 0;">
      <tbody>
        <tr>
          <th>Location</th>
          <td>{content_prepped?.season?.location}</td>
        </tr>
        <tr>
          <th>First Episode Aired</th>
          <td><Time manager={content_prepped?.season_first_air_time_manager} /></td>
        </tr>
        <tr>
          <th>Last Episode Aired</th>
          <td> <Time manager={content_prepped?.season_last_air_time_manager} /></td>
        </tr>
        <!-- <tr>
          <th>Total Episodes</th> average viewers etc tbd
          <td>{content_prepped?.season?.total_episodes}</td>
        </tr> -->
        <tr>
          <th>Total Days</th>
          <td>{content_prepped?.season?.total_days}</td>
        </tr>
        <tr>
          <th>Tribes at start</th>
          <td>{content_prepped?.season?.tribe_count_start}</td>
        </tr>
        <tr>
          <th>Contestants</th>
          <td>{content_prepped?.season?.contestant_count}</td>
        </tr>
        <tr>
          <th>Finalists</th>
          <td
            >{Array.isArray(content_prepped?.season?.finalists)
              ? content_prepped?.season?.finalists.join(", ")
              : ""}</td
          >
        </tr>
        <tr>
          <th>Winner</th>
          <td>{content_prepped?.season?.winner}</td>
        </tr>
        <tr>
          <th>Winner Prize</th>
          <td>{content_prepped?.season?.winner_prize_usd}</td>
        </tr>
        <tr>
          <th>Twist</th>
          <td>{content_prepped?.season?.twist_summary}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <h3>Jury Votes</h3>
  <div class="table_container">
    <table style="margin: 0;">
      <thead>
        <tr>
          <th>Jury Member</th>
          <th>Vote For</th>
        </tr>
      </thead>
      <tbody>
        {#if Array.isArray(content_prepped?.season?.jury_votes)}
          {#each content_prepped?.season?.jury_votes as jury_vote}
            <tr>
              <td>{jury_vote?.voter}</td>
              <td>{jury_vote?.target}</td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>

  {#if Array.isArray(content_prepped?.episodes_prepped) && content_prepped?.episodes_prepped.length > 0}
    {#each content_prepped?.episodes_prepped as episode, i (episode?.id)}
      <h3>Episode {episode?.episode_number}</h3>
      <div style="display: flex; flex-wrap: wrap; gap: 1rem;">
        <div>
          <p class="label">Air Date</p>
          <p><Time manager={episode?.air_time_manager} /></p>
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
