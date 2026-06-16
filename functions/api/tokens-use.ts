import { handleOptions, jsonResponse, errorResponse } from "../lib/helpers";
import type { Bindings } from "../lib/db";

export async function onRequest(context: { request: Request; env: Bindings }) {
  const { request, env } = context;

  if (request.method === "OPTIONS") return handleOptions(env);
  if (request.method !== "POST") return errorResponse("Method not allowed", env, 405);

  try {
    // For local dev, bypass token system
    if (env.ALLOWED_ORIGIN?.includes("localhost")) {
      return jsonResponse({ success: true, tokens: 999, isFree: false }, env);
    }

    // Parse JWT from cookie to get uid
    const cookie = request.headers.get("Cookie") || "";
    const tokenMatch = cookie.match(/auth_token=([^;]+)/);
    if (!tokenMatch) {
      return jsonResponse({ success: true, tokens: 0, isFree: true }, env);
    }

    const decoded = JSON.parse(atob(tokenMatch[1].split(".")[1])) as { uid: string };
    const uid = decoded.uid;

    const user = await env.DB.prepare(
      "SELECT uid, email, role, tier, tokens, is_banned FROM users WHERE uid = ?"
    ).bind(uid).first<Record<string, unknown>>();

    if (!user) return errorResponse("User not found", env, 404);
    if (user.is_banned) return errorResponse("Account banned", env, 403);

    const role = (user.role as string || "").toLowerCase();
    const tier = (user.tier as string || "Free").toLowerCase();

    // Owner/admin/Titan get free pass
    if (role === "owner" || role === "admin" || tier === "titan") {
      return jsonResponse({ success: true, tokens: 999999, isFree: false }, env);
    }

    // Non-Free tiers don't consume daily tokens
    if (tier !== "free") {
      return jsonResponse({ success: true, tokens: user.tokens as number || 0, isFree: false }, env);
    }

    // Free tier - check and consume token
    const tokens = (user.tokens as number) || 0;
    if (tokens <= 0) {
      return errorResponse("Token harian habis. Upgrade untuk akses tanpa batas.", env, 403);
    }

    const body = await request.json().catch(() => ({})) as { action?: string };
    const action = body.action || "AI Generation";

    await env.DB.prepare(
      "UPDATE users SET tokens = tokens - 1, tokens_used = tokens_used + 1 WHERE uid = ?"
    ).bind(uid).run();

    await env.DB.prepare(
      "INSERT INTO token_usage_logs (uid, action, tokens_spent) VALUES (?, ?, 1)"
    ).bind(uid, action).run();

    return jsonResponse({ success: true, tokens: tokens - 1, isFree: true }, env);
  } catch (err) {
    return errorResponse(`Token error: ${err instanceof Error ? err.message : "Unknown"}`, env, 500);
  }
}
