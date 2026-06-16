import { handleOptions, jsonResponse, errorResponse } from "../lib/helpers";
import type { Bindings } from "../lib/db";

export async function onRequest(context: { request: Request; env: Bindings }) {
  const { env } = context;

  if (context.request.method === "OPTIONS") return handleOptions(env);
  if (context.request.method !== "GET") return errorResponse("Method not allowed", env, 405);

  try {
    const res = await fetch("https://gen.pollinations.ai/image/models");
    if (!res.ok) return errorResponse(`Upstream error: ${res.status}`, env, 502);
    const models = await res.json() as unknown[];
    return jsonResponse({ success: true, models }, env);
  } catch (err) {
    return errorResponse(`Failed to fetch image models: ${err instanceof Error ? err.message : "Unknown"}`, env, 500);
  }
}
