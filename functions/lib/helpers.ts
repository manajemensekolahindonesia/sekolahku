import type { Bindings } from "./db";

export function corsHeaders(env: Bindings) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

export function handleOptions(env: Bindings) {
  return new Response(null, { status: 204, headers: corsHeaders(env) });
}

export function jsonResponse(data: unknown, env: Bindings, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(env),
    },
  });
}

export function errorResponse(message: string, env: Bindings, status = 500) {
  return jsonResponse({ error: message, success: false }, env, status);
}
