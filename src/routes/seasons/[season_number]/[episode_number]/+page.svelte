<script>
  import { create_time_manager, Time } from "sveltekit-ui"
  import Post from "$lib/components/Post/index.svelte"
  import { create_post_manager } from "$lib/components/Post/index.svelte.js"

  let { data } = $props()
  let revealedEpisode = $state(null)
  const episodeKey = $derived(`${data.season.season_number}/${data.episode.episode_number}`)
  const showSpoilers = $derived(revealedEpisode === episodeKey)
  const airTimeManager = create_time_manager({ val: () => data.episode.air_time })
  const postManager = $derived(data.post ? create_post_manager({
    season_number: data.season.season_number,
    episode_number: data.episode.episode_number,
    post: structuredClone(data.post),
  }) : null)

  $effect(() => {
    data.episode
    revealedEpisode = null
  })
</script>

<svelte:head>
  <title>Season {data.season.season_number}, Episode {data.episode.episode_number} | Survivor Snuff</title>
  <meta name="description" content={`Survivor season ${data.season.season_number}, episode ${data.episode.episode_number}: air date and episode details. Spoilers are hidden until you choose to reveal them.`} />
</svelte:head>

<div class="container">
  <a class="back-link" href={`/seasons/${data.season.season_number}`}>← Season {data.season.season_number} overview</a>
  <h1 style="margin: 0;">
    Season {data?.season?.season_number}, Episode {data?.episode?.episode_number}: <span>{data?.episode?.title}</span>
  </h1>
  <p style="margin-bottom: 1rem; ">
    Episode archive. Some historical details are unverified and may contain inaccuracies.
  </p>
  <button
    class="spoiler-toggle"
    type="button"
    aria-expanded={showSpoilers}
    aria-controls="episode-spoilers"
    onclick={() => (revealedEpisode = showSpoilers ? null : episodeKey)}
  >{showSpoilers ? "Hide spoilers" : "Show spoilers"}</button>
  <div class="table_container" style="margin-top: 1rem;">
    <table style="margin: 0;">
      <tbody>
        <tr>
          <th scope="row">Air date</th>
          <td>{#if data.episode.air_time}<Time manager={airTimeManager} />{:else}Not announced{/if}</td>
        </tr>
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
  <div id="episode-spoilers" hidden={!showSpoilers}>
  {#if showSpoilers}
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
    {#if postManager}
      <Post manager={postManager} />
    {:else if data.postUnavailable}
      <p>The archived article is temporarily unavailable. Please try again later.</p>
    {/if}
  {/if}
  </div>
</div>

<style>
  .back-link {
    display: inline-block;
    margin-bottom: 1.2rem;
    text-underline-offset: 0.2em;
  }
  .spoiler-toggle {
    border: 1px solid currentColor;
    border-radius: 1rem;
    padding: 0.7rem 1.2rem;
    color: inherit;
    background: transparent;
    font: inherit;
    cursor: pointer;
  }
  .spoiler-toggle:focus-visible, .back-link:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 4px;
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
