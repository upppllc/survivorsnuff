<script>
  import { Button, Image, Spacer, Time, Qr, Content, Icon, Location } from "sveltekit-ui"

  let { manager } = $props()
</script>

<!-- <h1 style="color: var(--primary-t);">
  {manager?.post?.title?.attributes?.content}
</h1> -->
<!-- <div class="times">
  {#if manager?.post?.time_created?.datetime}
    <p>
      Published: <time datetime={manager?.post?.time_created?.datetime}>{manager?.post?.time_created?.content}</time>
    </p>
  {/if}
  {#if manager?.post?.time_created?.epoch && manager?.post?.time_updated?.epoch && manager?.post?.time_created?.epoch < manager?.post?.time_updated?.epoch}
    <p>
      Last updated on: <time datetime={manager?.post?.time_updated?.datetime}
        >{manager?.post?.time_updated?.content}</time
      >
    </p>
  {/if}
  <div style="display: flex; align-items: center; gap: .3rem;">
    <Icon manager={manager?.clock_icon_manager} />
    <p>{manager?.post?.derived_view_time_mins}m</p>
  </div>
  {#if manager?.post?.location_relevant?.name}
    <p>{manager?.post?.location_relevant?.name}</p>
  {/if}
</div> -->
<hr />
{#if Array.isArray(manager?.post?.derived_topic_tags) && manager?.post?.derived_topic_tags.length > 0}
  <div style="display: flex; flex-wrap: wrap; margin-bottom: 1rem;">
    {#each manager?.post?.derived_topic_tags as tag}
      <div
        class="tag"
        style="
            --bgcolor: oklch(var(--l6-t) var(--c16) var(--h{tag?.hue}) / var(--o4)); 
            --bordercolor: oklch(var(--l6-t) var(--c16) var(--h{tag?.hue}) / var(--o8));"
      >
        {tag?.name}
        {tag?.emoji}
      </div>
    {/each}
  </div>
{/if}
{#if manager?.post?.main_image}
  <div style="aspect-ratio: 1.5;">
    <Content manager={manager?.main_image_content_manager} />
  </div>
{/if}
<hr />
<Content manager={manager?.main_content_manager} />
<hr />
<div class="share_container">
  <Qr manager={manager?.share_qr_manager} />
  <div style="display: flex; flex-direction: column; justify-content: space-between; flex: 1; margin: .5rem;">
    <div>
      <h3>Share Post</h3>
      <p style="word-break: break-all;">
        https://www.sharktankupdate.com/seasons/{manager?.season_number}/{manager?.episode_number}
      </p>
      <div style="display: flex; flex-wrap: wrap; gap: 1rem; margin: 1rem 0;">
        <Button manager={manager?.copy_link_button_manager} />
        <Button manager={manager?.share_button_manager} />
      </div>
    </div>
  </div>
</div>

<style>
  .share_container {
    border: 1px solid var(--shadow8-t);
    border-radius: 2rem;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    margin-bottom: 5rem;
    padding: 1rem;
    gap: 1rem;
    margin-top: 1rem;
  }
  .times {
    display: flex;
    flex-wrap: wrap;
    margin: 1rem 0;
  }
  .times p {
    margin-right: 2rem;
    color: var(--g8-t);
  }
  .times time {
    color: var(--g8-t);
  }
  .tag {
    border-radius: 1rem;
    border: 1px solid var(--bordercolor);
    background-color: var(--bgcolor);
    font-size: 1.4rem;
    padding: 0.1rem 0.5rem;
    margin-right: 1rem;
    margin-bottom: 0.5rem;
  }
</style>
