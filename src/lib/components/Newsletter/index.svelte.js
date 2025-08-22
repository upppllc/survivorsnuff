import { create_button_manager, create_text_input_manager } from "sveltekit-ui"

export function create_newsletter_subscribe_manager(config) {
  let is_hide_subscribe_to_newsletter = $state(false)
  let first_name_text_input_manager = $state(null)
  let email_address_text_input_manager = $state(null)
  let subscribe_button_manager = $state(null)
  let subcribe_is_loading = $state(false)
  let subscribe_error_message = $state(null)
  let is_subscribe_success_message = $state(false)

  async function subscribe_email() {
    console.log("subscribe_email")
    subcribe_is_loading = true
    subscribe_error_message = null
    const email_regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!email_regex.test(email_address_text_input_manager?.val)) {
      subscribe_error_message = "Email address does not meet format requirements"
      subcribe_is_loading = false
      return
    }
    const create_account_user_res = await fetch("/api/users", {
      method: "POST",
      body: JSON.stringify({
        first_name: first_name_text_input_manager?.val,
        email_address: email_address_text_input_manager?.val,
      }),
    })
    console.log("create_account_user_res", create_account_user_res)
    const create_account_user_resbody = await create_account_user_res.json()
    console.log("create_account_user_resbody", create_account_user_resbody)
    if (!create_account_user_res.ok) {
      subscribe_error_message = create_account_user_resbody?.message ?? JSON.stringify(create_account_user_resbody)
      subcribe_is_loading = false
      return
    }
    first_name_text_input_manager.set_val(null)
    email_address_text_input_manager.set_val(null)
    subscribe_button_manager.success_trigger()
    subcribe_is_loading = false
    is_subscribe_success_message = true
    setTimeout(() => {
      is_subscribe_success_message = false
    }, 5000)
    return create_account_user_resbody
  }

  function init(config) {
    first_name_text_input_manager = create_text_input_manager({
      label: "First Name",
      placeholder: "John",
      is_disabled: () => subcribe_is_loading,
    })
    email_address_text_input_manager = create_text_input_manager({
      label: "Email Address",
      type: "email",
      name: "email",
      placeholder: "me@example.com",
      is_disabled: () => subcribe_is_loading,
    })
    subscribe_button_manager = create_button_manager({
      h: 16,
      c: 6,
      l: 4,
      is_compressed: true,
      is_disabled: () => !email_address_text_input_manager?.is_valid,
      is_loading: () => subcribe_is_loading,
      text: "Join Newsletter",
      on_click: () => subscribe_email(),
    })
  }

  init(config)

  return {
    get is_hide_subscribe_to_newsletter() {
      return is_hide_subscribe_to_newsletter
    },
    get first_name_text_input_manager() {
      return first_name_text_input_manager
    },
    get email_address_text_input_manager() {
      return email_address_text_input_manager
    },
    get subscribe_button_manager() {
      return subscribe_button_manager
    },
    get subscribe_error_message() {
      return subscribe_error_message
    },
    get is_subscribe_success_message() {
      return is_subscribe_success_message
    },
  }
}
