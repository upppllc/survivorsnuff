import { defineEnvVars } from "@sveltejs/kit/env"

export const variables = defineEnvVars({
  CONTIBASE_ACCESS_TOKEN: { schema: (value) => value },
  CONTIBASE_SEASONS_TABLE_ID: { schema: (value) => value },
  CONTIBASE_EPISODES_TABLE_ID: { schema: (value) => value },
  CONTIBASE_CASTAWAYS_TABLE_ID: { schema: (value) => value },
  CONTIBASE_USERS_TABLE_ID: { static: true },
  PUBLIC_APPLE_MAPKIT_JS_API_KEY: { public: true, static: true },
})
