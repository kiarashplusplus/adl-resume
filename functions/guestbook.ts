/**
 * POST /guestbook — emails a guestbook entry to Kiarash for manual review
 * (he pastes approved entries into src/components/Guestbook.tsx).
 * Delivery: Cloudflare Email Routing via the CONTACT_MAILER service binding
 * (workers/contact-mailer), same as /contact.
 */
import type { ContactEnv } from "../server/mcp/contact";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const oneLine = (s: string) => s.replace(/[\r\n\t]+/g, " ").trim();
const quote = (s: string) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

export const onRequestOptions = () => new Response(null, { status: 204, headers: CORS });

export const onRequestPost = async ({ request, env }: { request: Request; env: ContactEnv }): Promise<Response> => {
  let entry: Record<string, unknown>;
  try {
    entry = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "Body must be JSON" }, 400);
  }
  const name = oneLine(typeof entry.name === "string" ? entry.name : "").slice(0, 50);
  const message = oneLine(typeof entry.message === "string" ? entry.message : "").slice(0, 280);
  const emoji = oneLine(typeof entry.emoji === "string" ? entry.emoji : "").slice(0, 8) || "👋";
  const date = oneLine(typeof entry.date === "string" ? entry.date : "").slice(0, 40) || new Date().toISOString().slice(0, 10);
  if (!name || !message) return json({ error: "Name and message are required" }, 400);

  if (!env.CONTACT_MAILER) {
    console.error("[guestbook] CONTACT_MAILER service binding is not configured");
    return json({ error: "Guestbook email is not configured; entry was NOT submitted" }, 503);
  }

  const snippet = `{\n  name: "${quote(name)}",\n  message: "${quote(message)}",\n  date: "${quote(date)}",\n  emoji: "${quote(emoji)}"\n},`;
  const text = `New guestbook entry ${emoji}\n\nFrom: ${name}\nDate: ${date}\nMessage: ${message}\n\n---\n\nCopy-paste into src/components/Guestbook.tsx:\n\n${snippet}\n`;

  try {
    const res = await env.CONTACT_MAILER.fetch("https://contact-mailer.internal/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: `[25x.codes] Guestbook entry from ${name}`,
        text,
        messageId: `guestbook-${Date.now()}-${crypto.randomUUID()}@25x.codes`,
      }),
    });
    if (!res.ok) {
      console.error(`[guestbook] contact-mailer error ${res.status}:`, (await res.text()).slice(0, 500));
      return json({ error: "Failed to submit entry" }, 502);
    }
  } catch (err) {
    console.error("[guestbook] contact-mailer call failed:", err);
    return json({ error: "Failed to submit entry" }, 502);
  }
  return json({ success: true, message: "Guestbook entry submitted for review" });
};
