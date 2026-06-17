import { handleOptions, jsonResponse, errorResponse } from "../../../lib/helpers";

export async function onRequest(context: { request: Request; env: any; params: any }) {
  const { request, env, params } = context;

  if (request.method === "OPTIONS") return handleOptions(env);

  try {
    if (request.method === "DELETE") {
      const id = params.id;
      if (!id) return errorResponse("User ID required", env, 400);

      await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
      return jsonResponse({ success: true, message: "User deleted" }, env);
    }

    return errorResponse("Method not allowed", env, 405);
  } catch (err) {
    return errorResponse(`Internal error: ${err instanceof Error ? err.message : "Unknown"}`, env, 500);
  }
}
