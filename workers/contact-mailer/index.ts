/**
 * contact-mailer: tiny Worker that sends the 25x.codes contact email through
 * Cloudflare Email Routing (send_email binding). Pages Functions cannot hold a
 * send_email binding, so the Pages project reaches this Worker through a
 * service binding named CONTACT_MAILER. It has no public route
 * (workers_dev = false, no routes), so only that binding can call it.
 *
 * Request:  POST /send  { subject, text, replyTo, replyToName, messageId }
 * Response: 200 { id }  only after Cloudflare accepted the message
 *           4xx/5xx { error, code? } otherwise
 *
 * The recipient is fixed by the binding (destination_address) and must be a
 * verified Email Routing destination; the sender must be on 25x.codes.
 */
import { EmailMessage } from "cloudflare:email";
import { buildMime } from "./mime";

interface SendEmailBinding {
  send(message: EmailMessage): Promise<unknown>;
}

export interface MailerEnv {
  SEND_EMAIL: SendEmailBinding;
  CONTACT_TO: string; // must equal the binding's destination_address
  CONTACT_FROM: string; // address on 25x.codes
  CONTACT_FROM_NAME?: string;
}

interface SendRequest {
  subject?: unknown;
  text?: unknown;
  replyTo?: unknown;
  replyToName?: unknown;
  messageId?: unknown;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const MESSAGE_ID_RE = /^[A-Za-z0-9._:-]{1,160}@[A-Za-z0-9.-]{1,100}$/;

export async function handleSend(request: Request, env: MailerEnv): Promise<Response> {
  const url = new URL(request.url);
  if (request.method !== "POST" || url.pathname !== "/send") return json({ error: "not_found" }, 404);
  if (!env.SEND_EMAIL || !env.CONTACT_TO || !env.CONTACT_FROM) {
    return json({ error: "not_configured", detail: "SEND_EMAIL binding, CONTACT_TO or CONTACT_FROM missing" }, 503);
  }

  let body: SendRequest;
  try {
    body = (await request.json()) as SendRequest;
  } catch {
    return json({ error: "bad_request", detail: "body must be JSON" }, 400);
  }
  const { subject, text, replyTo, replyToName, messageId } = body;
  if (typeof subject !== "string" || typeof text !== "string" || typeof messageId !== "string" || !MESSAGE_ID_RE.test(messageId)) {
    return json({ error: "bad_request", detail: "subject, text and a valid messageId are required" }, 400);
  }
  if (replyTo !== undefined && (typeof replyTo !== "string" || !/^[^\s@<>]+@[^\s@<>]+$/.test(replyTo))) {
    return json({ error: "bad_request", detail: "replyTo must be an email address" }, 400);
  }

  const raw = buildMime({
    from: env.CONTACT_FROM,
    fromName: env.CONTACT_FROM_NAME || "25x.codes contact",
    to: env.CONTACT_TO,
    replyTo: replyTo as string | undefined,
    replyToName: typeof replyToName === "string" ? replyToName : undefined,
    subject,
    text,
    messageId,
  });

  try {
    await env.SEND_EMAIL.send(new EmailMessage(env.CONTACT_FROM, env.CONTACT_TO, raw));
  } catch (err) {
    const e = err as { code?: string; message?: string };
    console.error("[contact-mailer] send failed:", e?.code, e?.message);
    return json({ error: "send_failed", code: e?.code, detail: e?.message ?? String(err) }, 502);
  }
  return json({ id: `<${messageId}>` });
}

export default {
  fetch: (request: Request, env: MailerEnv) => handleSend(request, env),
};
