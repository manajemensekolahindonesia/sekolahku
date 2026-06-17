import { handleOptions, jsonResponse, errorResponse } from "../lib/helpers";
import type { Bindings } from "../lib/db";

export async function onRequest(context: { request: Request; env: Bindings }) {
  const { request, env } = context;

  if (request.method === "OPTIONS") return handleOptions(env);
  if (request.method !== "POST") return errorResponse("Method not allowed", env, 405);

  try {
    const body = await request.json() as { password?: string };
    
    // Hanya menggunakan password dari environment variable
    const validPassword = env.DEV_MODE_PASSWORD;

    if (!validPassword) {
      return errorResponse("Server configuration error: DEV_MODE_PASSWORD not set", env, 500);
    }

    if (body.password === validPassword) {
      return jsonResponse({ success: true }, env);
    } else {
      return jsonResponse({ success: false, error: "Invalid password" }, env, 401);
    }
  } catch (err) {
    return errorResponse(`Internal error: ${err instanceof Error ? err.message : "Unknown"}`, env, 500);
  }
}
