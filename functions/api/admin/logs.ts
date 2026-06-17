import { handleOptions, errorResponse } from "../../lib/helpers";

export async function onRequest(context: { request: Request; env: any }) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return handleOptions(env);

  try {
    if (request.method === "GET") {
      const activityRes = await env.DB.prepare('SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 50').all();
      const adminRes = await env.DB.prepare('SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT 50').all();
      
      return new Response(JSON.stringify({
        activityLogs: activityRes.results || [],
        adminLogs: adminRes.results || []
      }), {
        headers: { "Content-Type": "application/json" }
      });
    } 
    
    if (request.method === "POST") {
      const body = await request.json() as any;
      const action = body.action || "Unknown action";
      
      await env.DB.prepare(
        "INSERT INTO admin_logs (admin_email, action, created_at) VALUES (?, ?, datetime('now'))"
      ).bind("admin", action).run();
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return errorResponse("Method not allowed", env, 405);
  } catch (err) {
    return errorResponse(`Internal error: ${err instanceof Error ? err.message : "Unknown"}`, env, 500);
  }
}
