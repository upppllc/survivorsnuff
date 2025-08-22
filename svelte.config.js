import adapter from "@sveltejs/adapter-vercel"

export default {
  kit: {
    adapter: adapter({
      runtime: "nodejs22.x",
      trailingSlash: false,
      cleanUrls: true,
      maxDuration: 300,
    }),
  },
}
