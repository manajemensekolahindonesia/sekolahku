import { handleOptions, jsonResponse, errorResponse } from "../../lib/helpers";

export async function onRequest(context: { request: Request; env: any; params: any }) {
  const { request, env, params } = context;

  if (request.method === "OPTIONS") return handleOptions(env);

  try {
    if (request.method === "GET") {
      const key = params.key;
      const result = await env.DB.prepare("SELECT value FROM settings WHERE id = ?").bind(key).first();
      return jsonResponse({ value: result ? result.value : null }, env);
    }

    return errorResponse("Method not allowed", env, 405);
  } catch (err) {
    return errorResponse(`Internal error: ${err instanceof Error ? err.message : "Unknown"}`, env, 500);
  }
}
