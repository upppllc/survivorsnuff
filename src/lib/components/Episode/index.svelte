<script>
  import { Button, Time } from "sveltekit-ui"
  import Post from "$lib/components/Post/index.svelte"

  let { manager } = $props()
  const data = $derived(manager.data)
</script>

<svelte:head>
  <title>Season {data.season.season_number}, Episode {data.episode.episode_number} | Survivor Snuff</title>
  <meta name="description" content={`Survivor season ${data.season.season_number}, episode ${data.episode.episode_number}: air date and episode details. Spoilers are hidden until you choose to reveal them.`} />
</svelte:head>

<div class="container">
  <div class="back-link"><Button manager={manager.season_button_manager} /></div>
  <h1 style="margin: 0;">
    Season {data.season.season_number}, Episode {data.episode.episode_number}{#if manager.show_spoilers && data.episode.title}: <span>{data.episode.title}</span>{/if}
  </h1>
  <p style="margin-bottom: 1rem; ">
    Episode details stay hidden until you choose to show spoilers.
  </p>
  <Button manager={manager.spoiler_button_manager} />
  {#if manager.reveal_error}<p role="alert">{manager.reveal_error}</p>{/if}
  <div class="table_container" style="margin-top: 1rem;">
    <table style="margin: 0;">
      <tbody>
        <tr>
          <th scope="row">Air date</th>
          <td>{#if data.episode.air_time}<Time manager={manager.air_time_manager} />{:else}Not announced{/if}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <section id="episode-spoilers" aria-label="Episode spoilers" hidden={!manager.show_spoilers}>
  {#if manager.show_spoilers}
    <p>Some historical details are unverified and may contain inaccuracies.</p>
    <div class="table_container" style="margin-top: 1rem;">
      <table style="margin: 0;">
        <tbody>
        {#if data.episode.filming_day_range?.start_day != null && data.episode.filming_day_range?.end_day != null}
          <tr>
            <th scope="row">Filming days</th>
            <td>{data.episode.filming_day_range.start_day}–{data.episode.filming_day_range.end_day}</td>
          </tr>
        {/if}
        {#if data.episode.runtime_minutes}
          <tr>
            <th scope="row">Episode runtime</th>
            <td>{data.episode.runtime_minutes} minutes</td>
          </tr>
        {/if}
        {#if data?.episode?.viewers_live_same_day_millions}
          <tr>
            <th scope="row">Same-day viewers</th>
            <td>{data?.episode?.viewers_live_same_day_millions} million</td>
          </tr>
        {/if}
        {#if data?.episode?.rating_18_49}
          <tr>
            <th scope="row">Rating from viewers age 18–49</th>
            <td>{data?.episode?.rating_18_49}</td>
          </tr>
        {/if}
        </tbody>
      </table>
    </div>
    {#if data.episode.synopsis}
      <h2>Synopsis</h2>
      <p>{data.episode.synopsis}</p>
    {/if}
    {#if Array.isArray(data?.episode?.reward_winners) && data?.episode?.reward_winners.length > 0}
      <h2>Reward Winners</h2>
      {data?.episode?.reward_winners.join(", ")}
    {/if}
    {#if Array.isArray(data?.episode?.immunity_winners) && data?.episode?.immunity_winners.length > 0}
      <h2>Immunity Winners</h2>
      {data?.episode?.immunity_winners.join(", ")}
    {/if}
    {#if Array.isArray(data?.episode?.idol_plays) && data?.episode?.idol_plays.length > 0}
      <h2>Idol Plays</h2>
      {data?.episode?.idol_plays.join(", ")}
    {/if}
    {#if Array.isArray(data?.episode?.eliminated_players) && data?.episode?.eliminated_players.length > 0}
      <h2>Eliminated Players</h2>
      {data?.episode?.eliminated_players.join(", ")}
    {/if}
    {#if Array.isArray(data?.episode?.joined_jury) && data?.episode?.joined_jury.length > 0}
      <h2>Joined Jury</h2>
      {data?.episode?.joined_jury.join(", ")}
    {/if}
    {#if Array.isArray(data?.episode?.vote_tally) && data?.episode?.vote_tally.length > 0}
      <h2>Vote Tally</h2>
      <div class="table_container">
        <table style="margin: 0;">
          <thead>
            <tr>
              <th scope="col">Player</th>
              <th scope="col">Votes</th>
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
      <h2>Votes</h2>
      <div class="table_container">
        <table style="margin: 0;">
          <thead>
            <tr>
              <th scope="col">Voter</th>
              <th scope="col">Target</th>
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
    {#if manager.post_manager}
      <Post manager={manager.post_manager} />
    {:else if data.postUnavailable}
      <p>The archived article is temporarily unavailable. Please try again later.</p>
    {/if}
  {/if}
  </section>
</div>

<style>
  h1, h2 {
    font-family: inherit;
    color: var(--snuff-text);
    font-weight: 750;
  }
  .back-link {
    display: inline-block;
    margin-bottom: 1.2rem;
    text-underline-offset: 0.2em;
  }
  h2 {
    font-size: 1.8rem;
    margin: 1.5rem 0 0.5rem;
  }
  .table_container {
    overflow-x: auto;
  }
  .container {
    max-width: 65rem;
    margin: 0 auto;
    padding: 1rem;
    margin-bottom: 1rem;
  }
</style>
