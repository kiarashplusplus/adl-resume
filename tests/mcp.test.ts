import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { onRequest as invoke } from "../functions/mcp/invoke";
import { onRequest as mcpIndex } from "../functions/mcp/index";
import { onRequestPost as contactPost } from "../functions/contact";
import { RATE_LIMIT, resetContactState, sendContact, validateContact } from "../server/mcp/contact";
import { LATEST_PROTOCOL_VERSION } from "../server/mcp/handler";
import { SERVER_INFO } from "../server/mcp/tools";

const ENV = { RESEND_API_KEY: "re_test", CONTACT_EMAIL: "owner@example.com", CONTACT_FROM: "Site <contact@25x.codes>" };
let ipCounter = 0;

function rpc(body: unknown, opts: { env?: Record<string, string>; headers?: Record<string, string>; path?: string; ip?: string } = {}) {
  const request = new Request(`https://25x.codes${opts.path ?? "/mcp"}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "CF-Connecting-IP": opts.ip ?? `10.0.0.${++ipCounter}`,
      ...opts.headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  const handler = opts.path === "/mcp/invoke" ? invoke : mcpIndex;
  return handler({ request, env: opts.env ?? ENV });
}

const contactArgs = { name: "Ada Agent", email: "ada@example.com", subject: "Hi", message: "Hello Kiarash" };
const callContact = (args: Record<string, unknown> = contactArgs, opts = {}) =>
  rpc({ jsonrpc: "2.0", id: 7, method: "tools/call", params: { name: "submit_contact", arguments: args } }, opts);

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  resetContactState();
  fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: "email_123" }), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("MCP protocol", () => {
  it("initialize negotiates a supported version and returns spec-shaped result", async () => {
    const res = await rpc({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "1" } } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.result.protocolVersion).toBe("2025-06-18");
    expect(body.result.serverInfo).toEqual(SERVER_INFO);
    expect(body.result.capabilities).toEqual({ tools: { listChanged: false } });
    expect(body.result.instructions).toContain("25x.codes");
    expect(res.headers.get("Mcp-Session-Id")).toBeNull();
  });

  it("initialize with an unknown version answers with the latest supported", async () => {
    const body = await (await rpc({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "1999-01-01" } })).json();
    expect(body.result.protocolVersion).toBe(LATEST_PROTOCOL_VERSION);
  });

  it("notifications get 202 with no body", async () => {
    const res = await rpc({ jsonrpc: "2.0", method: "notifications/initialized" });
    expect(res.status).toBe(202);
    expect(await res.text()).toBe("");
  });

  it("rejects an unsupported MCP-Protocol-Version header", async () => {
    const res = await rpc({ jsonrpc: "2.0", id: 1, method: "ping" }, { headers: { "MCP-Protocol-Version": "1999-01-01" } });
    expect(res.status).toBe(400);
  });

  it("tools/list returns all tools with schemas and annotations", async () => {
    const body = await (await rpc({ jsonrpc: "2.0", id: 2, method: "tools/list" })).json();
    const names = body.result.tools.map((t: { name: string }) => t.name);
    expect(names).toEqual(["get_project_details", "run_terminal_command", "submit_contact"]);
    const contact = body.result.tools[2];
    expect(contact.inputSchema.required).toEqual(["name", "email", "message"]);
    expect(contact.inputSchema.properties.message.maxLength).toBe(5000);
    expect(contact.outputSchema.required).toContain("message_id");
    expect(contact.annotations.readOnlyHint).toBe(false);
  });

  it("unknown method -> -32601, unknown tool -> -32602, parse error -> -32700", async () => {
    expect((await (await rpc({ jsonrpc: "2.0", id: 3, method: "nope" })).json()).error.code).toBe(-32601);
    const unknownTool = await (await rpc({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "nope", arguments: {} } })).json();
    expect(unknownTool.error.code).toBe(-32602);
    const parse = await rpc("{not json");
    expect(parse.status).toBe(400);
    expect((await parse.json()).error.code).toBe(-32700);
  });

  it("read-only tools return text plus structuredContent", async () => {
    const body = await (await rpc({ jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "run_terminal_command", arguments: { command: "contact" } } })).json();
    expect(body.result.isError).toBe(false);
    expect(body.result.content[0].text).toContain("kiarasha@alum.mit.edu");
    const bad = await (await rpc({ jsonrpc: "2.0", id: 6, method: "tools/call", params: { name: "get_project_details", arguments: { projectId: "zzz" } } })).json();
    expect(bad.result.isError).toBe(true);
  });

  it("/mcp/invoke keeps GET shorthand and legacy {tool,input} body", async () => {
    const get = await invoke({ request: new Request("https://25x.codes/mcp/invoke?command=about"), env: ENV });
    expect((await get.json()).command).toBe("about");
    const sse = await invoke({ request: new Request("https://25x.codes/mcp/invoke", { headers: { Accept: "text/event-stream" } }), env: ENV });
    expect(sse.status).toBe(405);
    const legacy = await rpc({ tool: "get_project_details", input: { projectId: "bayan" } }, { path: "/mcp/invoke" });
    expect((await legacy.json()).id).toBe("bayan");
  });
});

describe("submit_contact", () => {
  it("delivers via Resend and returns the message id", async () => {
    const body = await (await callContact()).json();
    expect(body.result.isError).toBe(false);
    expect(body.result.structuredContent).toMatchObject({ status: "sent", message_id: "email_123", duplicate: false, reply_to: "ada@example.com" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers["Idempotency-Key"]).toMatch(/^auto-[0-9a-f]{40}$/);
    const sent = JSON.parse(init.body);
    expect(sent).toMatchObject({ from: "Site <contact@25x.codes>", to: ["owner@example.com"], reply_to: "ada@example.com", subject: "[25x.codes] Hi" });
    expect(sent.text).toContain("Hello Kiarash");
  });

  it("does not send twice for the same idempotency key", async () => {
    const args = { ...contactArgs, idempotency_key: "retry-key-0001" };
    await callContact(args);
    const second = await (await callContact(args)).json();
    expect(second.result.structuredContent).toMatchObject({ duplicate: true, message_id: "email_123" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns isError with issues for invalid input and never calls the provider", async () => {
    const body = await (await callContact({ name: "", email: "not-an-email", message: "x".repeat(5001) })).json();
    expect(body.result.isError).toBe(true);
    expect(body.result.content[0].text).toMatch(/name is required.*email must be a valid.*at most 5000/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails loudly (not a fake success) when RESEND_API_KEY is missing", async () => {
    const body = await (await callContact(contactArgs, { env: {} })).json();
    expect(body.result.isError).toBe(true);
    expect(body.result.content[0].text).toContain("NOT sent");
    expect(body.result.content[0].text).toContain("mailto:kiarasha@alum.mit.edu");
  });

  it("reports provider errors as isError", async () => {
    fetchMock.mockResolvedValueOnce(new Response('{"message":"bad"}', { status: 422 }));
    const body = await (await callContact()).json();
    expect(body.result.isError).toBe(true);
    expect(body.result.content[0].text).toContain("HTTP 422");
  });

  it("rate limits per client", async () => {
    for (let i = 0; i < RATE_LIMIT.max; i++) {
      const r = await (await callContact({ ...contactArgs, message: `m${i}` }, { ip: "1.2.3.4" })).json();
      expect(r.result.isError).toBe(false);
    }
    const limited = await (await callContact({ ...contactArgs, message: "one more" }, { ip: "1.2.3.4" })).json();
    expect(limited.result.isError).toBe(true);
    expect(limited.result.content[0].text).toMatch(/Too many messages/);
    const other = await (await callContact({ ...contactArgs, message: "other ip" }, { ip: "5.6.7.8" })).json();
    expect(other.result.isError).toBe(false);
  });

  it("dry run is explicit, not a silent success", async () => {
    const r = await sendContact(contactArgs, { CONTACT_DRY_RUN: "1" }, { channel: "rest", clientKey: "x" });
    expect(r).toMatchObject({ ok: true, status: "dry_run" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("validation strips header-breaking newlines from name and subject", () => {
    const v = validateContact({ name: "A\r\nBcc: x", email: "a@b.co", message: "m", subject: "s\nt" });
    expect(v.ok && v.value.name).toBe("A Bcc: x");
    expect(v.ok && v.value.subject).toBe("s t");
  });
});

describe("POST /contact", () => {
  const post = (body: unknown, env: Record<string, string> = ENV) =>
    contactPost({ request: new Request("https://25x.codes/contact", { method: "POST", headers: { "Content-Type": "application/json", "CF-Connecting-IP": `9.9.9.${++ipCounter}` }, body: JSON.stringify(body) }), env });

  it("returns 200 with message id on success", async () => {
    const res = await post(contactArgs);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true, status: "sent", message_id: "email_123" });
  });

  it("maps failures to HTTP status codes", async () => {
    expect((await post({ name: "x" })).status).toBe(400);
    expect((await post(contactArgs, {})).status).toBe(503);
  });
});

describe("discovery docs stay in sync", () => {
  it("llms.txt and the manifest advertise the same endpoint and fallback", () => {
    const llms = readFileSync("public/llms.txt", "utf8");
    const manifest = JSON.parse(readFileSync("public/.well-known/mcp.llmfeed.json", "utf8"));
    for (const s of ["https://25x.codes/mcp", "submit_contact", "mailto:kiarasha@alum.mit.edu", "https://25x.codes/contact"]) {
      expect(llms).toContain(s);
    }
    expect(manifest.metadata.origin).toBe("https://25x.codes");
    expect(manifest.agent_guidance.preferred_entrypoints[0]).toBe("https://25x.codes/mcp");
    const contactCap = manifest.capabilities.find((c: { name: string }) => c.name === "submit_contact");
    expect(contactCap.url).toBe("https://25x.codes/mcp");
  });
});
