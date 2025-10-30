<script>
  import { Button, create_button_manager, Icon, create_icon_manager, LoadingWheel } from "sveltekit-ui"
  import { goto } from "$app/navigation"

  let { page, goto_path } = $props()

  let is_loading_image = $state(true)

  let clock_icon_manager = create_icon_manager({
    icon_id: "clock",
    sw: 50,
    size: 1.4,
    mr: 0.2,
    mt: 0.1,
    color: "var(--g4-t)",
  })

  // bg image blur not working at moment come back to tbd
  let bg_img_style = "none"
  // let bg_img_style = $derived(
  //   page?.main_image?.attributes?.storage_id
  //     ? `url(/api/v1/storage/${page?.main_image?.attributes?.storage_id}}) no-repeat center/cover`
  //     : "none"
  // )

  // let image_manager = create_image_manager({
  //   storage_path: "/api/v1/storage/{storage_id}",
  //   ...page?.main_image?.attributes,
  // })

  let view_button_manager = create_button_manager({
    type: "plain",
    support_icon: "arrow",
    icon_deg: 90,
    min_height: 0,
    mb: 0,
    pb: 0.4,
    pr: 0,
    icon_sw: 80,
    icon_size: 1.2,
    font_weight: 600,
    is_icon_shimmyable: true,
    tabindex: -1,
    text: "View",
  })
</script>

<div
  class="container"
  onclick={() => goto(goto_path ?? `/pages/${page?.id}`)}
  onkeydown={(e) => (e.key === "Enter" || e.key === " " ? goto(goto_path ?? `/pages/${page?.id}`) : null)}
  tabindex="0"
  role="button"
  aria-label="Visit page"
>
  <div
    class="card_container"
    style="
      margin: 0;
  "
  >
    {#if page?.main_image?.attributes?.storage_id}
      <div class="image_container" style="--bg_img_style: {bg_img_style};">
        {#if is_loading_image}
          <div
            style="position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%); z-index: -2;"
          >
            <LoadingWheel size={8} />
            <p style="margin-top: 1rem;">Loading...</p>
          </div>
        {/if}
        <div class="image_wrapper">
          <img
            class="image"
            alt={page?.title?.attributes?.content}
            src={page?.main_image?.attributes?.storage_id
              ? `/api/storage/${page?.main_image?.attributes?.storage_id}`
              : null}
            onload={() => (is_loading_image = false)}
          />
        </div>
      </div>
    {/if}
    <h4 class="title">{page?.title?.attributes?.content}</h4>
    {#if page?.description?.attributes?.content}
      <p class="description">
        {page?.description?.attributes?.content}
      </p>
    {/if}
    <div class="footer">
      <div class="readtime">
        <Icon manager={clock_icon_manager} />
        {page?.derived_view_time_mins}m
      </div>
      <Button manager={view_button_manager} />
    </div>
  </div>
</div>

<style>
  .container {
    width: clamp(20rem, 100%, 40rem);
  }
  .card_container {
    padding: 1rem;
    transition: 0.5s;
    cursor: pointer;
    border-radius: 2rem;
    overflow: hidden;
  }
  .card_container:hover {
    /* background-color: oklch(var(--l1-t) var(--c3) var(--h5) / var(--o2)); */
    box-shadow:
      0 0.4rem 1.6rem var(--shadow2),
      inset 0 0 0 1px var(--shadow3-t);
    -webkit-box-shadow:
      0 0.4rem 1.6rem var(--shadow2),
      inset 0 0 0 1px var(--shadow3-t);
  }
  .card_container:hover .image {
    transform: scale(1.03);
  }
  .image_container {
    position: relative;
    aspect-ratio: 1.5;
    /* --bg_img_style: {bg_img_style}; */
    border-radius: 1rem;
    transition: filter 0.3s ease;
    border: 1px solid oklch(var(--l10-t) var(--c3) var(--primary-h) / var(--o5));
  }
  .image_container::before {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: var(--bg_img_style);
    filter: blur(5px) opacity(0.5);
    transform: scale(0.99);
    z-index: -1;
  }
  .card_container:hover .image_container::before {
    filter: blur(25px) opacity(0.1) saturate(250%) brightness(250%);
    transform: scale(1.1, 1.9) translateY(28%);
  }
  .image_wrapper {
    overflow: hidden;
    width: 100%;
    height: 100%;
    position: relative;
    border-radius: 1rem;
  }
  .image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
    position: relative;
  }
  .title {
    margin-top: 0.5rem;
    color: var(--g5-t);
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .description {
    color: var(--g8-t);
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    padding-right: 0.5rem;
    font-size: 1.6rem;
    line-height: 2rem;
  }
  .readtime {
    display: flex;
    align-items: center;
    color: var(--g4-t);
    font-weight: 500 !important;
    font-size: clamp(1.4rem, 3vw, 1.6rem);
    line-height: clamp(1.8rem, 3.4vw, 2.2rem);
  }
  .footer {
    display: flex;
    flex: 1;
    align-items: end;
    justify-content: space-between;
  }
</style>
