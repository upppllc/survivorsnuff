<script>
  import { Icon, create_icon_manager } from "sveltekit-ui"

  let { page, goto_path } = $props()
  let failedImage = $state(null)
  const imageSource = $derived(page?.main_image?.attributes?.storage_id
    ? `/api/storage/${encodeURIComponent(page.main_image.attributes.storage_id)}`
    : null)
  const title = $derived(page?.title?.attributes?.content ?? "Episode details")
  const clockIconManager = create_icon_manager({
    icon_id: "clock",
    sw: 50,
    size: 1.4,
    mr: 0.2,
    mt: 0.1,
    color: "var(--g4-t)",
  })
</script>

<a class="container" href={goto_path ?? `/pages/${encodeURIComponent(page?.id ?? "")}`}>
  <div class="card_container">
    {#if imageSource}
      <div class="image_container">
        {#if failedImage === imageSource}
          <div class="image_fallback">Image unavailable</div>
        {:else}
          <img
            class="image"
            alt={page?.main_image?.attributes?.alt ?? title}
            src={imageSource}
            loading="lazy"
            decoding="async"
            onerror={() => (failedImage = imageSource)}
          />
        {/if}
      </div>
    {/if}
    <h3 class="title">{title}</h3>
    {#if page?.description?.attributes?.content}
      <p class="description">{page.description.attributes.content}</p>
    {/if}
    <div class="footer">
      {#if page?.derived_view_time_mins > 0}
        <div class="readtime">
          <Icon manager={clockIconManager} />
          {page.derived_view_time_mins} min read
        </div>
      {/if}
      <span class="view-label" aria-hidden="true">View →</span>
    </div>
  </div>
</a>

<style>
  .container {
    display: block;
    width: min(100%, 40rem);
    color: inherit;
    text-decoration: none;
    border-radius: 2rem;
  }
  .container:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 4px;
  }
  .card_container {
    padding: 1rem;
    transition: box-shadow 0.2s ease;
    border-radius: 2rem;
    overflow: hidden;
  }
  .container:hover .card_container,
  .container:focus-visible .card_container {
    box-shadow: 0 0.4rem 1.6rem var(--shadow2), inset 0 0 0 1px var(--shadow3-t);
  }
  .container:hover .image {
    transform: scale(1.03);
  }
  .image_container {
    position: relative;
    aspect-ratio: 1.5;
    border-radius: 1rem;
    overflow: hidden;
    border: 1px solid oklch(var(--l10-t) var(--c3) var(--primary-h) / var(--o5));
  }
  .image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.2s ease;
  }
  .image_fallback {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    color: var(--g8-t);
  }
  .title {
    margin-top: 0.5rem;
    color: var(--g5-t);
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .description {
    color: var(--g8-t);
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    line-clamp: 2;
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
    font-weight: 500;
    font-size: clamp(1.4rem, 3vw, 1.6rem);
    line-height: clamp(1.8rem, 3.4vw, 2.2rem);
  }
  .footer {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .view-label {
    margin-left: auto;
    font-weight: 600;
  }
  @media (prefers-reduced-motion: reduce) {
    .card_container, .image { transition: none; }
    .container:hover .image { transform: none; }
  }
</style>
