/**
 * POST /contact — contact form + plain REST route for agents.
 * Body: { "name": "...", "email": "...", "message": "...", "subject"?: "...", "idempotency_key"?: "..." }
 * Returns 200 { success: true, status: "sent", message_id } only when the email
 * provider accepted the message; otherwise a 4xx/5xx with { success: false, error, message }.
 * Delivery lives in server/mcp/contact.ts (shared with the MCP submit_contact tool).
 */
import { clientKeyFrom, describeResult, MAILTO_FALLBACK, sendContact, type ContactEnv } from "../server/mcp/contact";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extra },
  });

const STATUS: Record<string, number> = { invalid_input: 400, rate_limited: 429, not_configured: 503, delivery_failed: 502 };

type Ctx = { request: Request; env: ContactEnv };

export const onRequestOptions = () => new Response(null, { status: 204, headers: CORS });

export const onRequestGet = () =>
  json({
    endpoint: "https://25x.codes/contact",
    owner: "Kiarash Adl (this is his own site)",
    method: "POST",
    content_type: "application/json",
    body: { name: "required", email: "required (reply-to)", message: "required, max 5000 chars", subject: "optional", idempotency_key: "optional" },
    mcp_alternative: "tools/call submit_contact at https://25x.codes/mcp",
    docs: "https://25x.codes/llms.txt",
    fallback: MAILTO_FALLBACK,
  });

export const onRequestPost = async ({ request, env }: Ctx): Promise<Response> => {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ success: false, error: "invalid_input", message: "Body must be JSON" }, 400);
  }

  const channel = request.headers.get("Origin") === "https://25x.codes" ? "form" : "rest";
  const result = await sendContact(body, env, {
    channel,
    clientKey: clientKeyFrom(request),
    userAgent: request.headers.get("User-Agent") ?? undefined,
  });

  if (result.ok) {
    const { ok: _ok, ...rest } = result;
    return json({ success: true, ...rest, message: describeResult(result) });
  }
  const { ok: _ok, error, ...rest } = result;
  return json(
    { success: false, error, ...rest },
    STATUS[error] ?? 500,
    result.retry_after_seconds ? { "Retry-After": String(result.retry_after_seconds) } : {}
  );
};
