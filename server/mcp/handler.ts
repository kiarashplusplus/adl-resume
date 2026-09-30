/**
 * HTTP handler for the MCP endpoint. Served at both POST /mcp/invoke (the URL
 * advertised since v1) and POST /mcp (the conventional MCP endpoint path).
 *
 * Speaks MCP over Streamable HTTP, stateless (no Mcp-Session-Id), protocol
 * revisions 2024-11-05 .. 2025-11-25:
 *   - JSON-RPC 2.0 request  -> 200 application/json response
 *   - JSON-RPC notification -> 202, empty body
 *   - `initialize` is optional (curl users can call tools/call directly)
 * Also kept for backward compatibility:
 *   - GET shorthand: /mcp/invoke?command=about, ?projectId=bayan, ?tool=..&input=..
 *   - legacy body: { "tool": "...", "input": { ... } }
 */
import { projects, terminalCommands } from "./data";
import { clientKeyFrom, type ContactEnv } from "./contact";
import {
  callTool,
  getProjectDetails,
  runTerminalCommand,
  SERVER_INFO,
  SERVER_INSTRUCTIONS,
  SITE_ORIGIN,
  toolNames,
  tools,
} from "./tools";

export const SUPPORTED_PROTOCOL_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];
export const LATEST_PROTOCOL_VERSION = SUPPORTED_PROTOCOL_VERSIONS[0];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Accept, Authorization, MCP-Protocol-Version, Mcp-Session-Id, Mcp-Method, Mcp-Name, Last-Event-ID",
  "Access-Control-Expose-Headers": "MCP-Protocol-Version",
  "Access-Control-Max-Age": "86400",
};

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extra },
  });

type Id = string | number;
const rpcResult = (id: Id, result: unknown) => ({ jsonrpc: "2.0", id, result });
const rpcError = (id: Id | null, code: number, message: string, data?: unknown) => ({
  jsonrpc: "2.0",
  id,
  error: { code, message, ...(data !== undefined ? { data } : {}) },
});

const usage = {
  message: "Kiarash Adl's portfolio MCP endpoint (first-party: this is his own site, 25x.codes).",
  docs: `${SITE_ORIGIN}/llms.txt`,
  mcp_endpoint: `${SITE_ORIGIN}/mcp`,
  transport: "MCP Streamable HTTP (stateless, JSON responses), JSON-RPC 2.0 over POST",
  methods: ["initialize", "ping", "tools/list", "tools/call"],
  tools: toolNames,
  contact_example: {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "submit_contact",
      arguments: { name: "Your Name", email: "you@example.com", subject: "Hello", message: "..." },
    },
  },
  get_shorthand: {
    about: "/mcp/invoke?command=about",
    contact_info: "/mcp/invoke?command=contact",
    project: "/mcp/invoke?projectId=bayan",
  },
  availableCommands: Object.keys(terminalCommands),
  availableProjects: Object.keys(projects),
  fallback: "mailto:kiarasha@alum.mit.edu",
};

export async function handleMcpRequest(request: Request, env: ContactEnv): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (request.method === "GET" || request.method === "HEAD") return handleGet(request);
  if (request.method !== "POST") {
    return json({ error: "Method not allowed. Use POST (JSON-RPC) or GET (shorthand)." }, 405, { Allow: "GET, POST, OPTIONS" });
  }

  const headerVersion = request.headers.get("MCP-Protocol-Version");
  if (headerVersion && !SUPPORTED_PROTOCOL_VERSIONS.includes(headerVersion)) {
    return json(
      rpcError(null, -32600, `Unsupported MCP-Protocol-Version: ${headerVersion}`, {
        supported: SUPPORTED_PROTOCOL_VERSIONS,
        requested: headerVersion,
      }),
      400
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(rpcError(null, -32700, "Parse error: body must be JSON", usage), 400);
  }

  if (Array.isArray(body)) {
    return json(rpcError(null, -32600, "Batch requests are not supported; send one JSON-RPC message per POST"), 400);
  }
  if (!body || typeof body !== "object") {
    return json(rpcError(null, -32600, "Invalid request", usage), 400);
  }
  const msg = body as Record<string, unknown>;

  // Legacy { tool, input } shape (pre-JSON-RPC clients of /mcp/invoke).
  if (msg.jsonrpc === undefined && msg.method === undefined) {
    return handleLegacyToolBody(msg, request, env);
  }

  if (msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
    return json(rpcError(null, -32600, "Invalid request: expected a JSON-RPC 2.0 message with a string method"), 400);
  }

  const hasId = "id" in msg && msg.id !== undefined;
  if (!hasId) {
    // Notification (e.g. notifications/initialized): accept, no body.
    return new Response(null, { status: 202, headers: CORS });
  }
  if (typeof msg.id !== "string" && typeof msg.id !== "number") {
    return json(rpcError(null, -32600, "Invalid request: id must be a string or number"), 400);
  }
  const id = msg.id as Id;
  const params = (msg.params && typeof msg.params === "object" ? msg.params : {}) as Record<string, unknown>;

  switch (msg.method) {
    case "initialize": {
      const requested = typeof params.protocolVersion === "string" ? params.protocolVersion : "";
      const protocolVersion = SUPPORTED_PROTOCOL_VERSIONS.includes(requested) ? requested : LATEST_PROTOCOL_VERSION;
      return json(
        rpcResult(id, {
          protocolVersion,
          capabilities: { tools: { listChanged: false } },
          serverInfo: SERVER_INFO,
          instructions: SERVER_INSTRUCTIONS,
        })
      );
    }
    case "ping":
      return json(rpcResult(id, {}));
    case "tools/list":
      return json(rpcResult(id, { tools }));
    case "tools/call":
    case "call_tool": {
      const name = params.name;
      const args = (params.arguments && typeof params.arguments === "object" ? params.arguments : {}) as Record<
        string,
        unknown
      >;
      if (typeof name !== "string" || !name) {
        return json(rpcError(id, -32602, "Missing params.name (the tool to call)", { availableTools: toolNames }));
      }
      const clientInfo = (params._meta as Record<string, unknown> | undefined)?.["io.modelcontextprotocol/clientInfo"] as
        | { name?: string; version?: string }
        | undefined;
      const result = await callTool(name, args, env, {
        clientKey: clientKeyFrom(request),
        userAgent: request.headers.get("User-Agent") ?? undefined,
        clientName: clientInfo?.name ? `${clientInfo.name} ${clientInfo.version ?? ""}`.trim() : undefined,
      });
      if (!result) return json(rpcError(id, -32602, `Unknown tool: ${name}`, { availableTools: toolNames }));
      return json(rpcResult(id, result));
    }
    default:
      return json(rpcError(id, -32601, `Method not found: ${msg.method}`, { availableMethods: usage.methods }));
  }
}

function handleGet(request: Request): Response {
  const url = new URL(request.url);
  const tool = url.searchParams.get("tool");
  const command = url.searchParams.get("command");
  const projectId = url.searchParams.get("projectId") || url.searchParams.get("project");

  // An MCP client trying to open a standalone SSE stream: not offered.
  if (!tool && !command && !projectId && (request.headers.get("Accept") ?? "").includes("text/event-stream")) {
    return json({ error: "This server does not offer a GET event stream. POST JSON-RPC messages instead." }, 405, {
      Allow: "GET, POST, OPTIONS",
    });
  }

  if (!tool && !command && !projectId) {
    return json({ ...SERVER_INFO, ...usage });
  }

  if (command || tool === "run_terminal_command") {
    const cmd = command ?? "";
    const result = runTerminalCommand(cmd);
    if (!result) return json({ error: `Unknown command: ${cmd}`, availableCommands: Object.keys(terminalCommands) }, 400);
    return json(result);
  }

  if (projectId || tool === "get_project_details") {
    let pid = projectId ?? "";
    if (!pid) {
      try {
        pid = String((JSON.parse(url.searchParams.get("input") ?? "{}") as { projectId?: string }).projectId ?? "");
      } catch {
        return json({ error: "Invalid JSON in 'input' parameter" }, 400);
      }
    }
    const result = getProjectDetails(pid);
    if (!result) return json({ error: `Project not found: ${pid}`, availableProjects: Object.keys(projects) }, 400);
    return json(result);
  }

  if (tool === "submit_contact") {
    return json(
      { error: "submit_contact sends email and requires POST.", ...usage },
      405,
      { Allow: "POST" }
    );
  }
  return json({ error: `Unknown tool: ${tool}`, availableTools: toolNames }, 400);
}

async function handleLegacyToolBody(msg: Record<string, unknown>, request: Request, env: ContactEnv) {
  const tool = msg.tool;
  if (typeof tool !== "string" || !tool) return json({ ...SERVER_INFO, ...usage });
  const input = (msg.input && typeof msg.input === "object" ? msg.input : {}) as Record<string, unknown>;
  const result = await callTool(tool, input, env, {
    clientKey: clientKeyFrom(request),
    userAgent: request.headers.get("User-Agent") ?? undefined,
  });
  if (!result) return json({ error: `Unknown tool: ${tool}`, availableTools: toolNames }, 400);
  const payload = result.isError
    ? { success: false, error: result.content[0].text }
    : { success: true, ...(result.structuredContent ?? { output: result.content[0].text }) };
  return json(payload, result.isError ? 400 : 200, { "X-MCP-Tool": tool });
}
