/**
 * MCP endpoint (Cloudflare Pages Function) — POST /mcp/invoke
 * Also served at /mcp (functions/mcp/index.ts). Implementation: server/mcp/handler.ts
 */
import { handleMcpRequest } from "../../server/mcp/handler";
import type { ContactEnv } from "../../server/mcp/contact";

export const onRequest = (context: { request: Request; env: ContactEnv }): Promise<Response> =>
  handleMcpRequest(context.request, context.env);
