import { handleOptions, jsonResponse, errorResponse } from "../lib/helpers";
import type { Bindings } from "../lib/db";

export async function onRequest(context: { request: Request; env: Bindings }) {
  const { request, env } = context;

  if (request.method === "OPTIONS") return handleOptions(env);
  if (request.method !== "POST") return errorResponse("Method not allowed", env, 405);

  try {
    const body = await request.json() as { code?: string; state?: string };
    const { code } = body;

    if (!code) return errorResponse("Authorization code required", env, 400);

    const redirectUri = `${env.ALLOWED_ORIGIN}/auth/callback`;

    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      return errorResponse(`Google token exchange failed: ${tokenRes.status}`, env, 502);
    }

    const tokens = await tokenRes.json() as {
      access_token: string;
      id_token: string;
    };

    // Get user info
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userRes.ok) {
      return errorResponse(`Failed to fetch user info: ${userRes.status}`, env, 502);
    }

    const profile = await userRes.json() as {
      sub: string;
      email: string;
      name: string;
      picture: string;
    };

    // Check if user exists
    const existing = await env.DB.prepare(
      "SELECT * FROM users WHERE google_id = ? OR email = ?"
    ).bind(profile.sub, profile.email).first<Record<string, unknown>>();

    let user: Record<string, unknown>;

    if (existing) {
      await env.DB.prepare(
        "UPDATE users SET name = ?, avatar_url = ?, google_id = ?, updated_at = datetime('now') WHERE id = ?"
      ).bind(profile.name, profile.picture, profile.sub, existing.id).run();

      user = await env.DB.prepare("SELECT * FROM users WHERE id = ?")
        .bind(existing.id).first<Record<string, unknown>>() as Record<string, unknown>;
    } else {
      const id = crypto.randomUUID();
      await env.DB.prepare(
        "INSERT INTO users (id, email, name, role, google_id, avatar_url, subscription_id) VALUES (?, ?, ?, 'guru', ?, ?, 'plan_free')"
      ).bind(id, profile.email, profile.name, profile.sub, profile.picture).run();

      user = await env.DB.prepare("SELECT * FROM users WHERE id = ?")
        .bind(id).first<Record<string, unknown>>() as Record<string, unknown>;
    }

    return jsonResponse({ success: true, user }, env);
  } catch (err) {
    return errorResponse(`Auth error: ${err instanceof Error ? err.message : "Unknown"}`, env, 500);
  }
}
