import { describe, expect, it, vi } from "vitest";
import { handleSend, type MailerEnv } from "../workers/contact-mailer/index";
import { buildMime, encodeHeader } from "../workers/contact-mailer/mime";
import { onRequestPost as guestbookPost } from "../functions/guestbook";

const decodeBody = (raw: string) => {
  const b64 = raw.split("\r\n\r\n")[1].replace(/\r\n/g, "");
  return new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
};

function makeEnv(send = vi.fn(async (_msg: unknown) => undefined)) {
  const env: MailerEnv = {
    SEND_EMAIL: { send },
    CONTACT_TO: "kiarasha@alum.mit.edu",
    CONTACT_FROM: "contact@25x.codes",
    CONTACT_FROM_NAME: "25x.codes contact",
  };
  return { env, send };
}

const req = (body: unknown, path = "/send") =>
  new Request(`https://contact-mailer.internal${path}`, { method: "POST", body: JSON.stringify(body) });

describe("buildMime", () => {
  it("builds headers, blocks header injection, encodes UTF-8", () => {
    const raw = buildMime({
      from: "contact@25x.codes",
      fromName: "25x.codes contact",
      to: "kiarasha@alum.mit.edu",
      replyTo: "ada@example.com",
      replyToName: "Ada\r\nBcc: evil@example.com",
      subject: "Salâm 👋\nBcc: evil@example.com",
      text: "line1\nline2 ✓",
      messageId: "abc@25x.codes",
      date: new Date("2026-09-30T00:00:00Z"),
    });
    const head = raw.split("\r\n\r\n")[0];
    expect(head).toContain('From: "25x.codes contact" <contact@25x.codes>');
    expect(head).toContain("To: <kiarasha@alum.mit.edu>");
    expect(head).toContain('Reply-To: "Ada Bcc: evil@example.com" <ada@example.com>');
    expect(head).toContain("Message-ID: <abc@25x.codes>");
    expect(head).toContain("Content-Transfer-Encoding: base64");
    expect(head.split("\r\n").some((l) => l.startsWith("Bcc:"))).toBe(false);
    expect(head).toContain(`Subject: ${encodeHeader("Salâm 👋 Bcc: evil@example.com")}`);
    expect(decodeBody(raw)).toBe("line1\r\nline2 ✓");
  });
});

describe("contact-mailer Worker", () => {
  const good = { subject: "Hi", text: "Hello", replyTo: "ada@example.com", replyToName: "Ada", messageId: "k1@25x.codes" };

  it("sends through the send_email binding and returns the Message-ID", async () => {
    const { env, send } = makeEnv();
    const res = await handleSend(req(good), env);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "<k1@25x.codes>" });
    const msg = send.mock.calls[0][0] as unknown as { from: string; to: string; raw: string };
    expect(msg.from).toBe("contact@25x.codes");
    expect(msg.to).toBe("kiarasha@alum.mit.edu");
    expect(msg.raw).toContain("Reply-To: \"Ada\" <ada@example.com>");
  });

  it("maps a thrown Cloudflare error to 502 with its code", async () => {
    const { env } = makeEnv(vi.fn(async (_msg: unknown) => {
      throw Object.assign(new Error("destination address not verified"), { code: "E_RECIPIENT_NOT_ALLOWED" });
    }));
    const res = await handleSend(req(good), env);
    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ error: "send_failed", code: "E_RECIPIENT_NOT_ALLOWED" });
  });

  it("rejects bad requests, other paths and missing config", async () => {
    const { env, send } = makeEnv();
    expect((await handleSend(req({ ...good, messageId: "no-at-sign" }), env)).status).toBe(400);
    expect((await handleSend(req({ ...good, replyTo: "x\r\nBcc: y" }), env)).status).toBe(400);
    expect((await handleSend(req(good, "/other"), env)).status).toBe(404);
    expect((await handleSend(req(good), { ...env, CONTACT_FROM: "" })).status).toBe(503);
    expect(send).not.toHaveBeenCalled();
  });
});

describe("POST /guestbook", () => {
  it("sends through the mailer, or fails loudly without it", async () => {
    const fetch = vi.fn(async (_url: Request | string, _init?: RequestInit) => new Response('{"id":"<x@25x.codes>"}', { status: 200 }));
    const request = () => new Request("https://25x.codes/guestbook", { method: "POST", body: JSON.stringify({ name: "Bo", message: "hi", emoji: "👋", date: "2026-09-30" }) });
    expect((await guestbookPost({ request: request(), env: { CONTACT_MAILER: { fetch } } })).status).toBe(200);
    expect(JSON.parse(String(fetch.mock.calls[0][1]?.body)).text).toContain('name: "Bo"');
    expect((await guestbookPost({ request: request(), env: {} })).status).toBe(503);
  });
});
