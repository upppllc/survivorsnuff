<script>
  import {
    create_button_manager,
    Button,
    create_image_manager,
    Image,
    Spacer,
    create_time_manager,
    Time,
  } from "sveltekit-ui"
  import { goto } from "$app/navigation"

  let { data } = $props()
  console.log("data", data)

  let to_season_button_manager = create_button_manager({
    type: "outlined",
    is_compressed: true,
    support_icon: "arrow_tailed",
    icon_deg: 180,
    icon_pos: "left",
    text: `Season ${data?.season?.season_number} Overview`,
    on_click: () => goto(`/seasons/${data?.season?.season_number}`),
  })

  let air_time_manager = create_time_manager({
    val: data?.episode?.air_time,
    // format: "calendar_date",
  })

  let is_show_spoilers = $state(false)

  let is_show_spoilers_button_manager = create_button_manager({
    type: "outlined",
    text: () => (is_show_spoilers ? "Hide Spoilers" : "Show Spoilers"),
    is_compressed: true,
    on_click: () => (is_show_spoilers = !is_show_spoilers),
  })
</script>

<div style="margin: 1rem;">
  <Button manager={to_season_button_manager} />
  <h1 style="margin: 0;">
    Season {data?.season?.season_number}, Episode {data?.episode?.episode_number}: <span>{data?.episode?.title}</span>
  </h1>

  <Button manager={is_show_spoilers_button_manager} />
  <div class="table_container" style="margin-top: 1rem;">
    <table style="margin: 0;">
      <tbody>
        <tr>
          <th>Aired</th>
          <td><Time manager={air_time_manager} /> <br /></td>
        </tr>
        <tr>
          <th>Filiming day range </th>
          <td>{data?.episode?.filming_day_range?.start_day} - {data?.episode?.filming_day_range?.end_day}</td>
        </tr>
        <tr>
          <th>Episode Runtime</th>
          <td>{data?.episode?.runtime_minutes} minutes</td>
        </tr>
        {#if data?.episode?.viewers_live_same_day_millions}
          <tr>
            <th>Same-Day Viewers</th>
            <td>{data?.episode?.viewers_live_same_day_millions} million</td>
          </tr>
        {/if}
        {#if data?.episode?.rating_18_49}
          <tr>
            <th>Rating from viewers age 18-49</th>
            <td>{data?.episode?.rating_18_49}</td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>
  {#if is_show_spoilers}
    <p class="label">Synopsis</p>
    <p>{data?.episode?.synopsis}</p>
    {#if Array.isArray(data?.episode?.reward_winners) && data?.episode?.reward_winners.length > 0}
      <p class="label">Reward Winners</p>
      {data?.episode?.reward_winners.join(", ")}
    {/if}
    {#if Array.isArray(data?.episode?.immunity_winners) && data?.episode?.immunity_winners.length > 0}
      <p class="label">Immunity Winners</p>
      {data?.episode?.immunity_winners.join(", ")}
    {/if}
    {#if Array.isArray(data?.episode?.idol_plays) && data?.episode?.idol_plays.length > 0}
      <p class="label">Idol Plays</p>
      {data?.episode?.idol_plays.join(", ")}
    {/if}
    {#if Array.isArray(data?.episode?.eliminated_players) && data?.episode?.eliminated_players.length > 0}
      <p class="label">Eliminated Players</p>
      {data?.episode?.eliminated_players.join(", ")}
    {/if}
    {#if Array.isArray(data?.episode?.joined_jury) && data?.episode?.joined_jury.length > 0}
      <p class="label">Joined Jury</p>
      {data?.episode?.joined_jury.join(", ")}
    {/if}
    {#if Array.isArray(data?.episode?.vote_tally) && data?.episode?.vote_tally.length > 0}
      <p class="label">Vote Tally</p>
      <div class="table_container">
        <table style="margin: 0;">
          <thead>
            <tr>
              <th>Player</th>
              <th>Votes</th>
            </tr>
          </thead>
          <tbody>
            {#each data?.episode?.vote_tally as vote}
              <tr>
                <td>{vote?.player}</td>
                <td>{vote?.votes}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
    {#if Array.isArray(data?.episode?.votes) && data?.episode?.votes.length > 0}
      <p class="label">Votes</p>
      <div class="table_container">
        <table style="margin: 0;">
          <thead>
            <tr>
              <th>Voter</th>
              <th>Target</th>
            </tr>
          </thead>
          <tbody>
            {#each data?.episode?.votes as vote}
              <tr>
                <td>{vote?.voter}</td>
                <td>{vote?.target}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {/if}
</div>
