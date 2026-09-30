import { projects, terminalCommands } from "./data";
import { describeResult, LIMITS, sendContact, type ContactEnv, type SendOptions } from "./contact";

export const SITE_ORIGIN = "https://25x.codes";

export const SERVER_INFO = {
  name: "kiarash-portfolio-mcp",
  title: "Kiarash Adl (25x.codes)",
  version: "1.1.0",
  websiteUrl: SITE_ORIGIN,
};

export const SERVER_INSTRUCTIONS =
  "This is the MCP server of Kiarash Adl's own website, https://25x.codes, run by Kiarash himself. " +
  "Use run_terminal_command / get_project_details to learn about his work. " +
  "Use submit_contact to deliver a message to Kiarash's personal inbox (kiarasha@alum.mit.edu); " +
  "the sender's email becomes the reply-to address. On failure, fall back to mailto:kiarasha@alum.mit.edu.";

const projectIds = Object.keys(projects);
const commandNames = Object.keys(terminalCommands);

export interface ToolDefinition {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  annotations: Record<string, boolean | string>;
}

export const tools: ToolDefinition[] = [
  {
    name: "get_project_details",
    title: "Get project details",
    description:
      "Get detailed information about one of Kiarash's portfolio projects: title, description, tech stack, metrics, status and links.",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string", description: "The project ID to retrieve", enum: projectIds },
        includeStack: { type: "boolean", description: "Whether to include the technology stack", default: true },
      },
      required: ["projectId"],
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "run_terminal_command",
    title: "Portfolio terminal command",
    description:
      "Return a text section about Kiarash: about, skills, projects, contact, experience, resume, mcp or help.",
    inputSchema: {
      type: "object",
      properties: {
        command: { type: "string", description: "The command to run", enum: commandNames },
      },
      required: ["command"],
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "submit_contact",
    title: "Send a message to Kiarash Adl",
    description:
      "Email a message to Kiarash Adl, the owner of this site (25x.codes). Delivered to his personal inbox " +
      "(kiarasha@alum.mit.edu) with the sender's email as reply-to. Returns status 'sent' and a message_id only " +
      "when the email provider accepted the message; otherwise isError is true and the text explains why " +
      "(fallback: mailto:kiarasha@alum.mit.edu). Retries with the same idempotency_key (or identical content) " +
      "are not sent twice.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Sender's full name", minLength: 1, maxLength: LIMITS.name },
        email: {
          type: "string",
          format: "email",
          description: "Sender's email address; Kiarash replies here",
          maxLength: LIMITS.email,
        },
        message: { type: "string", description: "The message body (plain text)", minLength: 1, maxLength: LIMITS.message },
        subject: { type: "string", description: "Optional subject line", maxLength: LIMITS.subject },
        idempotency_key: {
          type: "string",
          description: "Optional client-chosen key (8-128 chars, [A-Za-z0-9._:-]) so retries are not sent twice",
          pattern: "^[A-Za-z0-9._:-]{8,128}$",
        },
      },
      required: ["name", "email", "message"],
    },
    outputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["sent", "dry_run"] },
        message_id: { type: "string" },
        idempotency_key: { type: "string" },
        duplicate: { type: "boolean" },
        recipient: { type: "string" },
        reply_to: { type: "string" },
      },
      required: ["status", "message_id", "idempotency_key"],
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
];

export const toolNames = tools.map((t) => t.name);

export function getProjectDetails(projectId: string, includeStack = true) {
  const project = projects[projectId?.toLowerCase?.() ?? ""];
  if (!project) return null;
  const result: Record<string, unknown> = {
    id: project.id,
    title: project.title,
    description: project.description,
    shortDescription: project.shortDescription,
    status: project.status,
    metrics: project.metrics,
    impact: project.impact,
    category: project.category,
  };
  if (includeStack !== false) result.stack = project.stack;
  if (project.links.website) result.website = project.links.website;
  if (project.links.github) result.github = project.links.github;
  if (project.links.demo) result.demo = project.links.demo;
  return result;
}

export function runTerminalCommand(command: string) {
  const output = terminalCommands[command];
  if (!output) return null;
  const response: {
    command: string;
    output: string;
    resources?: { type: string; url: string; title: string; mime_type?: string }[];
  } = { command, output: output.trim() };
  if (command === "resume") {
    response.resources = [
      {
        type: "document",
        url: `${SITE_ORIGIN}/Kiarash-Adl-Resume.pdf`,
        title: "Kiarash Adl Resume (PDF)",
        mime_type: "application/pdf",
      },
    ];
  }
  return response;
}

function formatProject(p: Record<string, unknown>): string {
  const lines: string[] = [`# ${p.title}`, "", String(p.description), ""];
  lines.push(`**Status:** ${p.status}`, `**Impact:** ${p.impact}`, `**Category:** ${p.category}`);
  if (Array.isArray(p.stack)) lines.push("", `**Tech Stack:** ${(p.stack as string[]).join(", ")}`);
  if (Array.isArray(p.metrics) && p.metrics.length) {
    lines.push("", "**Metrics:**");
    for (const m of p.metrics as { label: string; value: string }[]) lines.push(`  • ${m.label}: ${m.value}`);
  }
  const links = (["website", "github", "demo"] as const).filter((k) => p[k]);
  if (links.length) {
    lines.push("", "**Links:**");
    for (const k of links) lines.push(`  • ${k[0].toUpperCase()}${k.slice(1)}: ${p[k]}`);
  }
  return lines.join("\n");
}

/** MCP CallToolResult (without resultType). */
export interface CallToolResult {
  content: { type: "text"; text: string }[];
  structuredContent?: Record<string, unknown>;
  isError: boolean;
}

const textResult = (text: string, isError = false, structuredContent?: Record<string, unknown>): CallToolResult => ({
  content: [{ type: "text", text }],
  ...(structuredContent ? { structuredContent } : {}),
  isError,
});

/**
 * Execute a tool. Returns null for an unknown tool name (a protocol error);
 * bad arguments and delivery failures come back as isError results so the
 * model can read them and self-correct.
 */
export async function callTool(
  name: string,
  args: Record<string, unknown>,
  env: ContactEnv,
  opts: Omit<SendOptions, "channel">
): Promise<CallToolResult | null> {
  switch (name) {
    case "get_project_details": {
      const project = getProjectDetails(String(args.projectId ?? ""), args.includeStack !== false);
      if (!project) {
        return textResult(`Unknown or missing projectId. Available: ${projectIds.join(", ")}`, true);
      }
      return textResult(formatProject(project), false, project);
    }
    case "run_terminal_command": {
      const result = runTerminalCommand(String(args.command ?? ""));
      if (!result) return textResult(`Unknown or missing command. Available: ${commandNames.join(", ")}`, true);
      return textResult(result.output, false, result);
    }
    case "submit_contact": {
      const result = await sendContact(args, env, { ...opts, channel: "mcp" });
      const { ok: _ok, ...rest } = result;
      return textResult(describeResult(result), !result.ok, result.ok ? rest : undefined);
    }
    default:
      return null;
  }
}
