/**
 * Contact delivery shared by the website form (POST /contact) and the MCP
 * `submit_contact` tool (POST /mcp/invoke, alias /mcp).
 *
 * Delivery goes through Resend (https://resend.com). Configuration, all via
 * Cloudflare Pages environment variables / secrets:
 *   RESEND_API_KEY   required to deliver; without it every submission fails
 *                    with `not_configured` (never a fake success)
 *   CONTACT_EMAIL    inbox that receives messages (default: kiarasha@alum.mit.edu)
 *   CONTACT_FROM     verified sender, e.g. "25x.codes <contact@25x.codes>"
 *                    (default: Resend's shared test sender, which only delivers
 *                    to the Resend account owner's own address)
 *   CONTACT_DRY_RUN  "1" = validate and log but do not send (local dev only)
 *   RESEND_API_URL   override the Resend endpoint (local testing only)
 */

export interface ContactEnv {
  RESEND_API_KEY?: string;
  CONTACT_EMAIL?: string;
  CONTACT_FROM?: string;
  CONTACT_DRY_RUN?: string;
  RESEND_API_URL?: string;
}

export const OWNER_EMAIL = "kiarasha@alum.mit.edu";
export const MAILTO_FALLBACK = `mailto:${OWNER_EMAIL}`;
const DEFAULT_FROM = "25x.codes contact <onboarding@resend.dev>";
const DEFAULT_RESEND_URL = "https://api.resend.com/emails";

export const LIMITS = {
  name: 100,
  email: 254,
  subject: 150,
  message: 5000,
  idempotencyKey: 128,
} as const;

/** Per-client send limit (best effort: counters live in one edge isolate). */
export const RATE_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 };

export type Channel = "mcp" | "form" | "rest";

export interface ContactInput {
  name: string;
  email: string;
  message: string;
  subject?: string;
  idempotency_key?: string;
}

export type ContactResult =
  | {
      ok: true;
      status: "sent" | "dry_run";
      message_id: string;
      idempotency_key: string;
      duplicate: boolean;
      recipient: string;
      reply_to: string;
    }
  | {
      ok: false;
      error: "invalid_input" | "rate_limited" | "not_configured" | "delivery_failed";
      message: string;
      issues?: string[];
      retry_after_seconds?: number;
      fallback: string;
    };

const EMAIL_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;
const IDEMPOTENCY_RE = /^[A-Za-z0-9._:-]{8,128}$/;

const singleLine = (s: string) => s.replace(/[\r\n\t]+/g, " ").trim();

export function validateContact(
  raw: unknown
): { ok: true; value: ContactInput } | { ok: false; issues: string[] } {
  const issues: string[] = [];
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const str = (key: string) => (typeof obj[key] === "string" ? (obj[key] as string) : undefined);

  const name = singleLine(str("name") ?? "");
  const email = (str("email") ?? "").trim();
  const message = (str("message") ?? "").replace(/\r\n/g, "\n").trim();
  const subjectRaw = str("subject");
  const subject = subjectRaw === undefined ? undefined : singleLine(subjectRaw);
  const idem = str("idempotency_key")?.trim();

  if (!name) issues.push("name is required");
  else if (name.length > LIMITS.name) issues.push(`name must be at most ${LIMITS.name} characters`);

  if (!email) issues.push("email is required (used as the reply-to address)");
  else if (email.length > LIMITS.email || !EMAIL_RE.test(email)) issues.push("email must be a valid email address");

  if (!message) issues.push("message is required");
  else if (message.length > LIMITS.message) issues.push(`message must be at most ${LIMITS.message} characters`);

  if (subject !== undefined && subject.length > LIMITS.subject) {
    issues.push(`subject must be at most ${LIMITS.subject} characters`);
  }
  if (idem !== undefined && idem !== "" && !IDEMPOTENCY_RE.test(idem)) {
    issues.push("idempotency_key must be 8-128 characters of letters, digits, '.', '_', ':' or '-'");
  }

  if (issues.length) return { ok: false, issues };
  return {
    ok: true,
    value: { name, email, message, subject: subject || undefined, idempotency_key: idem || undefined },
  };
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

// ---------------------------------------------------------------------------
// In-memory state (per isolate). Good enough to stop accidental loops and
// double submits; Resend's Idempotency-Key header dedupes across isolates.
// ---------------------------------------------------------------------------
const sendLog = new Map<string, number[]>();
const idempotencyCache = new Map<string, { at: number; result: ContactResult & { ok: true } }>();
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

export function resetContactState(): void {
  sendLog.clear();
  idempotencyCache.clear();
}

function checkRateLimit(clientKey: string, now: number): number | null {
  const recent = (sendLog.get(clientKey) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  sendLog.set(clientKey, recent);
  if (recent.length >= RATE_LIMIT.max) {
    return Math.ceil((recent[0] + RATE_LIMIT.windowMs - now) / 1000);
  }
  return null;
}

function recordSend(clientKey: string, now: number) {
  const recent = sendLog.get(clientKey) ?? [];
  recent.push(now);
  sendLog.set(clientKey, recent);
  if (sendLog.size > 5000) sendLog.delete(sendLog.keys().next().value as string);
}

export function clientKeyFrom(request: Request): string {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0].trim() ||
    "unknown"
  );
}

export interface SendOptions {
  channel: Channel;
  clientKey: string;
  userAgent?: string;
  clientName?: string;
  now?: number;
  fetchImpl?: typeof fetch;
}

/**
 * Validate and deliver a message to Kiarash. Never reports success unless the
 * email provider accepted the message (or CONTACT_DRY_RUN=1 is explicitly set,
 * in which case status is "dry_run").
 */
export async function sendContact(raw: unknown, env: ContactEnv, opts: SendOptions): Promise<ContactResult> {
  const now = opts.now ?? Date.now();
  const doFetch = opts.fetchImpl ?? fetch;

  const parsed = validateContact(raw);
  if (!parsed.ok) {
    return {
      ok: false,
      error: "invalid_input",
      message: `Invalid input: ${parsed.issues.join("; ")}`,
      issues: parsed.issues,
      fallback: MAILTO_FALLBACK,
    };
  }
  const input = parsed.value;
  const idempotencyKey =
    input.idempotency_key ??
    "auto-" + (await sha256Hex([input.email.toLowerCase(), input.subject ?? "", input.message].join("\n"))).slice(0, 40);

  const cached = idempotencyCache.get(idempotencyKey);
  if (cached && now - cached.at < IDEMPOTENCY_TTL_MS) {
    return { ...cached.result, duplicate: true };
  }

  const retryAfter = checkRateLimit(opts.clientKey, now);
  if (retryAfter !== null) {
    return {
      ok: false,
      error: "rate_limited",
      message: `Too many messages from this client. Try again in ${retryAfter} seconds, or email ${OWNER_EMAIL}.`,
      retry_after_seconds: retryAfter,
      fallback: MAILTO_FALLBACK,
    };
  }

  const to = env.CONTACT_EMAIL || OWNER_EMAIL;
  const subject = `[25x.codes] ${input.subject || `Message from ${input.name}`}`;
  const text = [
    input.message,
    "",
    "--",
    `From:    ${input.name} <${input.email}>`,
    `Via:     25x.codes ${opts.channel === "mcp" ? "MCP submit_contact" : opts.channel === "form" ? "contact form" : "POST /contact"}`,
    opts.clientName ? `Client:  ${opts.clientName}` : null,
    opts.userAgent ? `Agent:   ${opts.userAgent.slice(0, 200)}` : null,
    `Key:     ${idempotencyKey}`,
    "Reply to this email to answer the sender directly.",
  ]
    .filter((l) => l !== null)
    .join("\n");

  const success = (status: "sent" | "dry_run", messageId: string): ContactResult & { ok: true } => ({
    ok: true,
    status,
    message_id: messageId,
    idempotency_key: idempotencyKey,
    duplicate: false,
    recipient: "Kiarash Adl",
    reply_to: input.email,
  });

  if (env.CONTACT_DRY_RUN === "1") {
    recordSend(opts.clientKey, now);
    console.log("[contact] dry run, not sent:", JSON.stringify({ to, subject, idempotencyKey }));
    const result = success("dry_run", `dry-run-${idempotencyKey}`);
    idempotencyCache.set(idempotencyKey, { at: now, result });
    return result;
  }

  if (!env.RESEND_API_KEY) {
    console.error("[contact] RESEND_API_KEY is not configured; message NOT delivered");
    return {
      ok: false,
      error: "not_configured",
      message: `Email delivery is not configured on this server, so the message was NOT sent. Please email ${OWNER_EMAIL} directly.`,
      fallback: MAILTO_FALLBACK,
    };
  }

  recordSend(opts.clientKey, now);
  let response: Response;
  try {
    response = await doFetch(env.RESEND_API_URL || DEFAULT_RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM || DEFAULT_FROM,
        to: [to],
        reply_to: input.email,
        subject,
        text,
      }),
    });
  } catch (err) {
    console.error("[contact] Resend request failed:", err);
    return {
      ok: false,
      error: "delivery_failed",
      message: `The email provider could not be reached, so the message was NOT sent. Please retry later or email ${OWNER_EMAIL}.`,
      fallback: MAILTO_FALLBACK,
    };
  }

  const bodyText = await response.text();
  if (!response.ok) {
    console.error(`[contact] Resend error ${response.status}:`, bodyText.slice(0, 500));
    return {
      ok: false,
      error: "delivery_failed",
      message: `The email provider rejected the message (HTTP ${response.status}), so it was NOT sent. Please email ${OWNER_EMAIL} directly.`,
      fallback: MAILTO_FALLBACK,
    };
  }

  let messageId = "";
  try {
    messageId = String((JSON.parse(bodyText) as { id?: unknown }).id ?? "");
  } catch {
    /* handled below */
  }
  if (!messageId) {
    console.error("[contact] Resend returned no message id:", bodyText.slice(0, 500));
    return {
      ok: false,
      error: "delivery_failed",
      message: `The email provider did not confirm delivery. Please email ${OWNER_EMAIL} directly.`,
      fallback: MAILTO_FALLBACK,
    };
  }

  const result = success("sent", messageId);
  idempotencyCache.set(idempotencyKey, { at: now, result });
  if (idempotencyCache.size > 1000) idempotencyCache.delete(idempotencyCache.keys().next().value as string);
  return result;
}

/** One-line human summary used in MCP text content and REST responses. */
export function describeResult(r: ContactResult): string {
  if (r.ok) {
    return r.status === "sent"
      ? `${r.duplicate ? "Already sent (duplicate request ignored)" : "Message sent"} to Kiarash Adl. Message id: ${r.message_id}. He will reply to ${r.reply_to}.`
      : `Dry run: message validated but NOT sent (CONTACT_DRY_RUN=1). Id: ${r.message_id}.`;
  }
  return `${r.message} (fallback: ${r.fallback})`;
}
