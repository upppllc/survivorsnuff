<script>
  import "sveltekit-ui/style.css"
  import Logo from "$lib/components/Logo/index.svelte"
  import MainNav from "$lib/components/MainNav/index.svelte"
  import NewsletterSubscribe from "$lib/components/Newsletter/Section/index.svelte"
  import { Layout, Checkbox, Button, XFollow } from "sveltekit-ui"
  import { global_manager } from "$lib/client/index.svelte.js"
  import { goto } from "$app/navigation"
  import { page } from "$app/state"

  let { data, children } = $props()
</script>

<Layout manager={global_manager?.layout_manager}>
  {#snippet nav_bar_logo()}
    <Logo />
  {/snippet}
  {#snippet nav_bar_extra()}
    <div style="display: flex; align-iems: center;">
      <!-- <TextInput placeholder="Search" /> -->
      <div style="display: flex; gap: 1rem;">
        <!-- <Button manager={global_manager?.chat_assistant_manager?.popover_button_manager} /> -->
        <!-- <AuthTrigger manager={global_manager?.auth_manager} /> -->
      </div>
      <!-- {#if !global_manager?.auth_manager?.account?.id} -->
      <Checkbox manager={global_manager?.layout_manager?.dark_theme_manager} />
      <!-- {/if} -->
    </div>
  {/snippet}
  {#snippet sub_bar()}
    <!-- tbd -->
  {/snippet}
  {#snippet full_nav()}
    <div style="margin: 1rem;">
      <MainNav />
    </div>
  {/snippet}
  {#snippet content()}
    {#if children}
      {@render children()}
    {/if}
    {#if !page?.route?.id?.startsWith("/confirm_user_email_address")}
      <div
        style="display: flex; justify-content: center; padding: 1rem; margin: 2rem auto 2rem auto; max-width: 60rem;"
      >
        <NewsletterSubscribe manager={global_manager?.newsletter_subscribe_manager} />
      </div>
    {/if}
    <div style="display: flex; justify-content: center; padding: 1rem; margin-bottom: 2rem; margin-top: 2rem;">
      <XFollow x_handle="contibase" />
    </div>
    <div style="display: flex; justify-content: start; padding: 1rem; margin-top: 2rem;">
      <a
        href="https://www.contibase.com?ref=skst"
        target="_blank"
        rel="noopener noreferrer"
        style="display: flex; align-items: center; justify-content: center; padding: .5rem 2rem; width: fit-content; background-color: var(--g0-t); border-radius: 10px; font-family: Quicksand; text-decoration: none;"
      >
        <img
          height="12px"
          width="auto"
          style="max-height: 12px; max-width: 40px; width: auto; margin-right: 10px;"
          src="https://www.contibase.com/favicon.svg"
          alt="icon"
        />
        <div style="display: flex; flex-direction: column; flex: 0;">
          <span style="font-size: 1rem; line-height: 1; color: var(--g16-t)">Powered by </span><span
            style="line-height: 1; color: oklch(var(--l12-t) var(--c12) var(--h10));">Contibase</span
          >
        </div>
      </a>
    </div>
  {/snippet}
  {#snippet additional()}
    <!-- <AuthPopover manager={global_manager?.auth_manager} /> -->
    <!-- <ChatAssistant manager={global_manager?.chat_assistant_manager} /> -->
  {/snippet}
</Layout>

<style>
  @font-face {
    font-family: "Proxima Vara";
    src:
      local(""),
      url("/fonts/ProximaVara.woff2") format("woff2 supports variations"),
      url("/fonts/ProximaVara.woff2") format("woff2-variations"),
      url("/fonts/ProximaVara.woff") format("woff-variations");
    font-weight: 100 900;
    font-stretch: 50% 100%;
    font-display: swap;
  }
  @font-face {
    font-family: "Roboto Serif";
    src:
      url("/fonts/RobotoSerif-VariableFont.woff2") format("woff2 supports variations"),
      url("/fonts/RobotoSerif-VariableFont.woff2") format("woff2-variations");
    font-weight: 100 1000;
    font-display: swap;
  }
  @font-face {
    font-family: "Quicksand";
    src:
      url("/fonts/Quicksand-VariableFont.woff2") format("woff2 supports variations"),
      url("/fonts/Quicksand-VariableFont.woff2") format("woff2-variations");
    font-weight: 100 1000;
    font-display: swap;
  }
  :global(body) {
    background-color: var(--bg);
  }
  :root {
    --primary-c: var(--c10);
    --primary-h: var(--h18);
  }
</style>
