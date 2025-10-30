<script>
  import PreviewCard from "$lib/components/PreviewCard/index.svelte"

  let { data } = $props()
  console.log("data", data)
</script>

<div style="margin: 1rem; max-width: 80rem;">
  <h2>Come on in guys!</h2>
  <p>Welcome to Survivor Snuff. Find all the info you need about past an current seasons.</p>
  <p>
    Look forward to our weekly overview of what you missed in the Survivor world including episode reactions and more.
  </p>
  {#if Array.isArray(data?.episodes) && data?.episodes.length > 0}
    <h3>Recent Posts</h3>
    <div class="pages_container">
      {#each data?.episodes as episode}
        <PreviewCard page={episode?.post} goto_path={`/seasons/${episode?.season_number}/${episode?.episode_number}`} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .pages_container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(30rem, 1fr));
    gap: 1rem;
    align-items: stretch;
  }
</style>
