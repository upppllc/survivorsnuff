<script>
  let color_outer = "oklch(var(--l12) var(--c13) var(--h5))"
  let color_inner = "oklch(var(--l23) var(--c15) var(--h6))"
</script>

<div class="container" style="--color_outer: {color_outer}; --color_inner: {color_inner};">
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xml:space="preserve"
    style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2"
    viewBox="0 0 512 512"
    width="3rem"
  >
    <path
      style="fill-rule:nonzero; fill: var(--color_outer)"
      d="M257.3 486c13.2-1.8 263.2-71 106-310.7-34.2 42.2-30.9 73.7-30.9 73.7s-12.5-2.5-25.2-25.9C295 200.9 361.3 76.1 235.7 26c7.8 64.2-7 64-62.2 124.6C69 265 85 366.2 141.4 421.9c41.3 40.9 101.4 62 115.9 64.1Z"
    />
    <path
      style="fill-rule:nonzero; fill: var(--color_inner)"
      d="M253 181.1c-2.9 18.3-15.4 59.8 40.3 108.2 82.4 91.7 20.3 179.9-34.8 194.8-38.8-5-144.3-83-96.5-167.3 11 17.2 17 32.8 46.6 39.8 4.8-9.5-31.6-63-18.3-96.6 13.4-33.7 42.1-70.4 62.7-78.9Z"
    />
  </svg>
  <span class="logo_text">Survivor Snuff</span>
</div>

<style>
  .container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    padding-top: 0.2rem;
  }
  .logo_text {
    margin-top: 0;
    font-family: "Quicksand", sans-serif;
    width: max-content;
    z-index: 1;
    font-size: clamp(1.8rem, 5vw, 2.2rem);
    font-weight: 700;
    line-height: 1.1;
    color: var(--primary-t);
  }
</style>
