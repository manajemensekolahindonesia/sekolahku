import { handleOptions, jsonResponse, errorResponse } from "../../lib/helpers";
import { getUsers, updateUserAdmin } from "../../lib/db";
import type { Bindings } from "../../lib/db";

export async function onRequest(context: { request: Request; env: Bindings }) {
  const { request, env } = context;

  if (request.method === "OPTIONS") return handleOptions(env);

  try {
    if (request.method === "GET") {
      const users = await getUsers(env.DB);
      return new Response(JSON.stringify(users), {
        headers: { "Content-Type": "application/json" }
      });
    }
    
    if (request.method === "PUT" || request.method === "POST") {
      const body = await request.json() as any;
      const id = body.id || body.uid;

      if (!id) {
        return errorResponse("User ID is required", env, 400);
      }

      const updates: any = {};
      if (body.role !== undefined) updates.role = body.role;
      if (body.tier !== undefined) updates.tier = body.tier;
      if (body.tokens !== undefined) updates.tokens = body.tokens;
      if (body.displayName !== undefined) updates.display_name = body.displayName;
      if (body.isBanned !== undefined) updates.is_banned = body.isBanned ? 1 : 0;
      if (body.suspendedUntil !== undefined) updates.suspended_until = body.suspendedUntil;
      if (body.activeUntil !== undefined) updates.active_period_end = body.activeUntil;

      // Update in DB directly
      const sets = [];
      const params = [];
      for (const [k, v] of Object.entries(updates)) {
        sets.push(`${k} = ?`);
        params.push(v);
      }
      
      if (sets.length > 0) {
        sets.push("updated_at = datetime('now')");
        params.push(id);
        await env.DB.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).bind(...params).run();
      }

      const updatedUser = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();
      return jsonResponse({ success: true, user: updatedUser }, env);
    }

    return errorResponse("Method not allowed", env, 405);
  } catch (err) {
    return errorResponse(`Internal error: ${err instanceof Error ? err.message : "Unknown"}`, env, 500);
  }
}
