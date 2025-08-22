export async function get_location_from_headers(event) {
  const { request } = event
  let client_address = null
  if (typeof event?.getClientAddress == "function") {
    client_address = await event.getClientAddress()
  }
  const host = request.headers.get("x-forwarded-host")
  const user_agent = request.headers.get("user-agent")
  const ip = request.headers.get("x-real-ip")
  const city = request.headers.get("x-vercel-ip-city")
  const country = request.headers.get("x-vercel-ip-country")
  const region = request.headers.get("x-vercel-ip-country-region")
  const latitude = request.headers.get("x-vercel-ip-latitude")
  const longitude = request.headers.get("x-vercel-ip-longitude")
  const time_zone = request.headers.get("x-vercel-ip-timezone")
  const location = { host, user_agent, ip, client_address, city, country, region, latitude, longitude, time_zone } // ip and client_address may be duplicates lets just check that they match or if both always are given in practice
  return location
}
