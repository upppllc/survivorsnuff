<script>
  let { data } = $props()
</script>

<svelte:head>
  <title>survivorsnuff</title>
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
  <!-- <meta name="description" content="tbd" />
  <meta property="og:title" content="survivorsnuff" />
  <meta property="og:description" content="tbd" />
  <meta property="og:image" content="https://www.example.com/thumbnail.webp" /> 
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="https://www.example.com/thumbnail.webp" /> -->
</svelte:head>

<div style="margin: 1rem;">
  <h3>Example page</h3>
  <p>{data?.example}</p>
</div>
