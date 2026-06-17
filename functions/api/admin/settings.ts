import { handleOptions, errorResponse } from "../../lib/helpers";

export async function onRequest(context: { request: Request; env: any }) {
  const { request, env } = context;

  if (request.method === "OPTIONS") return handleOptions(env);

  try {
    if (request.method === "GET") {
      const result = await env.DB.prepare("SELECT id, value FROM settings").all();
      const settingsObj: Record<string, string> = {};
      if (result.results) {
        for (const row of result.results) {
          settingsObj[row.id as string] = row.value as string;
        }
      }
      return new Response(JSON.stringify(settingsObj), {
        headers: { "Content-Type": "application/json" }
      });
    } 
    
    if (request.method === "POST") {
      const body = await request.json() as Record<string, string>;
      for (const [id, value] of Object.entries(body)) {
        await env.DB.prepare(
          "INSERT INTO settings (id, value) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET value=excluded.value"
        ).bind(id, String(value)).run();
      }
      return new Response(JSON.stringify({ success: true, message: "Settings saved" }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return errorResponse("Method not allowed", env, 405);
  } catch (err) {
    return errorResponse(`Internal error: ${err instanceof Error ? err.message : "Unknown"}`, env, 500);
  }
}
