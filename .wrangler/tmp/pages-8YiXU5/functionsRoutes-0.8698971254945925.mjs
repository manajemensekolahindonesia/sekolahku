import { onRequest as __api_auth_callback_ts_onRequest } from "E:\\pendidikan\\functions\\api\\auth-callback.ts"
import { onRequest as __api_generate_modul_ts_onRequest } from "E:\\pendidikan\\functions\\api\\generate-modul.ts"
import { onRequest as __api_health_ts_onRequest } from "E:\\pendidikan\\functions\\api\\health.ts"
import { onRequest as __api_models_image_ts_onRequest } from "E:\\pendidikan\\functions\\api\\models-image.ts"
import { onRequest as __api_models_text_ts_onRequest } from "E:\\pendidikan\\functions\\api\\models-text.ts"

export const routes = [
    {
      routePath: "/api/auth-callback",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_auth_callback_ts_onRequest],
    },
  {
      routePath: "/api/generate-modul",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_generate_modul_ts_onRequest],
    },
  {
      routePath: "/api/health",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_health_ts_onRequest],
    },
  {
      routePath: "/api/models-image",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_models_image_ts_onRequest],
    },
  {
      routePath: "/api/models-text",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_models_text_ts_onRequest],
    },
  ]