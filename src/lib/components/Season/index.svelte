<script>
  import { Button, Image, Spacer, Time, HorizScrollBox } from "sveltekit-ui"

  let { manager } = $props()
</script>

<div style="display: flex; gap: 1rem;">
  <Button manager={manager?.view_seasons_button_manager} />
  <Button manager={manager?.is_show_spoilers_button_manager} />
</div>
<div class="card" style="margin: 0; margin-top: 1rem;">
  <h1 style="margin-top: 0;">
    Season {manager?.season_prepped?.season_number}
    {manager?.season_prepped?.title ? `- ${manager?.season_prepped?.title}` : null}
  </h1>
  <div style="display: flex; flex: 1; justify-content: space-between;">
    <span
      >{manager?.season_prepped?.location} (Aired <Time manager={manager?.season_prepped?.first_air_time_manager} /> to <Time
        manager={manager?.season_prepped?.last_air_time_manager}
      />)</span
    >
    <span>{manager?.season_prepped?.contestant_count} castaways, {manager?.season_prepped?.total_days} days</span>
  </div>
  <Spacer mt={1} mb={1} />
  <p>{manager?.season_prepped?.twist_summary}</p>
</div>

<h2>Episodes</h2>
<HorizScrollBox>
  {#if Array.isArray(manager?.episodes_prepped) && manager?.episodes_prepped.length > 0}
    <div style="display: flex; gap: 1rem;">
      {#each manager?.episodes_prepped as episode, i (episode?.id)}
        <div class="card" style="margin: 0; min-width: 20rem;">
          <h4>Episode {episode?.episode_number}</h4>
          <div style="display: flex; flex-wrap: wrap; gap: 1rem;">
            <div>
              <p>{episode?.title}</p>
              <!-- <p>Aired <Time manager={episode?.air_time_manager} /></p> -->
              <p class="label" style="margin-top: 1rem;"></p>
              <!-- <p>{episode?.viewers_live_same_day_millions} million Viewers</p> -->
            </div>
            <!-- <pre>{JSON.stringify(episode, null, 2)}</pre> -->
            <!-- <Button manager={episode?.goto_episode_recap_button_manager} /> tbd -->
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <p>No Episodes Found</p>
  {/if}
</HorizScrollBox>

<h2>Castaways</h2>
{#if Array.isArray(manager?.castaways_prepped) && manager?.castaways_prepped?.length > 0}
  {#each manager?.castaways_prepped as castaway}
    <div class="card" style="display: flex; gap: 1rem;">
      <div>
        <img
          src={`https://www.contibase.com/api/v1/storage/ukkvrwvfuaqnotejkqua__s${manager?.season_prepped?.season_number}__${castaway?.name.replaceAll(" ", "_").toLowerCase()}`}
          alt={castaway?.name}
          width="200"
        />
      </div>
      <div>
        <h3>{castaway?.name}</h3>
        <p class="label">Age</p>
        <p>{castaway?.age}</p>
        <!-- <p class="label">Gender</p>
        <p>{castaway?.gender}</p>
        <p class="label">Race</p>
        <p>{castaway?.race}</p> -->
        <p class="label">Hometown</p>
        <p>{castaway?.hometown}</p>
        <p class="label">Current Residence</p>
        <p>{castaway?.current_residence}</p>
        <p class="label">Occupation</p>
        <p>{castaway?.occupation}</p>
        <p class="label">Traits</p>
        <p>{Array.isArray(castaway?.traits) ? castaway.traits.join(", ") : ""}</p>
        <p class="label">Why Applied</p>
        <p>{castaway?.why_applied}</p>
        <p class="label">Life Experience</p>
        <p>{castaway?.life_experience}</p>
        <p class="label">Unique Gameplay</p>
        <p>{castaway?.unique_gameplay}</p>
        {#if manager?.is_show_spoilers}
          <p class="label">Finish</p>
          <p>{castaway?.result_order}{castaway?.is_on_jury ? " (On Jury)" : ""}</p>
          <p></p>
        {/if}
      </div>
    </div>
  {/each}
{:else}
  <p>No Episodes Found</p>
{/if}

{#if manager?.is_show_spoilers}
  <div>
    <h3>Finalists</h3>
    {#if Array.isArray(manager?.season_prepped?.finalists)}
      <div style="display: flex; gap: 1rem;">
        {#each manager?.season_prepped?.finalists as finalist}
          {#if Array.isArray(manager?.castaways_prepped) && manager?.castaways_prepped?.length > 0}
            {#each manager?.castaways_prepped as castaway}
              {#if castaway?.name == finalist}
                <div class="card" style="display: flex; gap: 1rem; min-width: 26rem; margin: 0;">
                  <div>
                    <img
                      src={`https://www.contibase.com/api/v1/storage/ukkvrwvfuaqnotejkqua__s${manager?.season_prepped?.season_number}__${castaway?.name.replaceAll(" ", "_").toLowerCase()}`}
                      alt={castaway?.name}
                      width="50"
                    />
                  </div>
                  <div>
                    <h3>{castaway?.name}</h3>
                    {#if castaway?.name == manager?.season_prepped?.winner}
                      <p>Winner of ${manager?.season_prepped?.winner_prize_usd?.toLocaleString()}</p>
                    {/if}
                    <Spacer mt={1} mb={1} />
                    <h4 class="label" style="margin-top: 0;">
                      Jury Votes ({(Array.isArray(manager?.season_prepped?.jury_votes)
                        ? manager.season_prepped.jury_votes.filter((h) => h?.target == finalist)
                        : []
                      ).length})
                    </h4>
                    {#if Array.isArray(manager?.season_prepped?.jury_votes)}
                      <ul style="margin:0; padding-left:0; list-style:none;">
                        {#each manager?.season_prepped?.jury_votes as jury_vote}
                          {#if jury_vote?.target == finalist}
                            <li>{jury_vote?.voter}</li>
                          {/if}
                        {/each}
                      </ul>
                    {/if}
                  </div>
                </div>
              {/if}
            {/each}
          {/if}
        {/each}
      </div>
    {/if}
  </div>
{/if}
