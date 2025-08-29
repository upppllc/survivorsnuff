<script>
  import { Button, Image, Spacer, Time } from "sveltekit-ui"

  let { manager } = $props()
</script>

<Button manager={manager?.view_seasons_button_manager} />
<h2 style="margin-top: 0;">Season {manager?.season_prepped?.season_number}</h2>
<div class="table_container">
  <table style="margin: 0;">
    <tbody>
      <tr>
        <th>Location</th>
        <td>{manager?.season_prepped?.location}</td>
      </tr>
      <tr>
        <th>First Episode Aired</th>
        <td><Time manager={manager?.season_prepped?.first_air_time_manager} /></td>
      </tr>
      <tr>
        <th>Last Episode Aired</th>
        <td> <Time manager={manager?.season_prepped?.last_air_time_manager} /></td>
      </tr>
      <!-- <tr>
          <th>Total Episodes</th> average viewers etc tbd
          <td>{manager?.season_prepped?.total_episodes}</td>
        </tr> -->
      <tr>
        <th>Total Days</th>
        <td>{manager?.season_prepped?.total_days}</td>
      </tr>
      <tr>
        <th>Tribes at start</th>
        <td>{manager?.season_prepped?.tribe_count_start}</td>
      </tr>
      <tr>
        <th>Contestants</th>
        <td>{manager?.season_prepped?.contestant_count}</td>
      </tr>
      <tr>
        <th>Finalists</th>
        <td>{Array.isArray(manager?.season_prepped?.finalists) ? manager?.season_prepped?.finalists.join(", ") : ""}</td
        >
      </tr>
      <tr>
        <th>Winner</th>
        <td>{manager?.season_prepped?.winner}</td>
      </tr>
      <tr>
        <th>Winner Prize</th>
        <td>{manager?.season_prepped?.winner_prize_usd}</td>
      </tr>
      <tr>
        <th>Twist</th>
        <td>{manager?.season_prepped?.twist_summary}</td>
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
      {#if Array.isArray(manager?.season_prepped?.jury_votes)}
        {#each manager?.season_prepped?.jury_votes as jury_vote}
          <tr>
            <td>{jury_vote?.voter}</td>
            <td>{jury_vote?.target}</td>
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>

{#if Array.isArray(manager?.episodes_prepped) && manager?.episodes_prepped.length > 0}
  {#each manager?.episodes_prepped as episode, i (episode?.id)}
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
    {#if i < episodes_prepped.length}
      <Spacer mt={1} mb={1} />
    {/if}
  {/each}
{:else}
  <p>No Episodes Found</p>
{/if}

<h2>Castaways</h2>
{#if Array.isArray(manager?.castaways_prepped) && manager?.castaways_prepped?.length > 0}
  {#each manager?.castaways_prepped as castaway}
    <div class="card">
      <h3>{castaway?.name}</h3>
      <p class="label">Age</p>
      <p>{castaway?.age}</p>
      <p class="label">Gender</p>
      <p>{castaway?.gender}</p>
      <p class="label">Race</p>
      <p>{castaway?.race}</p>
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
      <p class="label">Season Number</p>
      <p>{castaway?.season_number}</p>
      <p class="label">Result Order</p>
      <p>{castaway?.result_order}</p>
      <p class="label">On Jury</p>
      <p>{castaway?.is_on_jury ? "Yes" : "No"}</p>
    </div>
  {/each}
{:else}
  <p>No Episodes Found</p>
{/if}
