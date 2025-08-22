import { get_location_from_headers } from "$lib/server/index.svelte.js"

export async function load(event) {
  const location = await get_location_from_headers(event)
  // get some other data such as rows from a table in contibase
  return {
    example: "Hello World",
  }
}
