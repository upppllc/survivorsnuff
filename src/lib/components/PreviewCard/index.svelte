<script>
  import { Icon } from "sveltekit-ui"
  import { create_preview_card_manager } from "./index.svelte.js"

  let { page, goto_path } = $props()
  const manager = create_preview_card_manager({ page: () => page, goto_path: () => goto_path })
</script>

<a class="container" href={manager.href}>
  <div class="card_container">
    {#if manager.image_source}
      <div class="image_container">
        {#if manager.image_failed}
          <div class="image_fallback">Image unavailable</div>
        {:else}
          <img
            class="image"
            alt={manager.image_alt}
            src={manager.image_source}
            loading="lazy"
            decoding="async"
            onerror={manager.handle_image_error}
          />
        {/if}
      </div>
    {/if}
    <h3 class="title">{manager.title}</h3>
    {#if manager.description}
      <p class="description">{manager.description}</p>
    {/if}
    <div class="footer">
      {#if manager.read_minutes > 0}
        <div class="readtime">
          <Icon manager={manager.clock_icon_manager} />
          {manager.read_minutes} min read
        </div>
      {/if}
      <div class="view-label" aria-hidden="true">View <Icon manager={manager.view_icon_manager} /></div>
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
    display: flex;
    align-items: center;
    gap: .6rem;
    margin-left: auto;
    font-weight: 600;
  }
  @media (prefers-reduced-motion: reduce) {
    .card_container, .image { transition: none; }
    .container:hover .image { transform: none; }
  }
</style>
