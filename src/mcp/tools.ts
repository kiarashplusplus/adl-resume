/**
 * MCP (Model Context Protocol) Tools for AI Agent Integration
 * 
 * These tools allow AI agents (Claude, Grok, etc.) to interact with
 * the portfolio via the WebMCP standard.
 */

import { z } from "zod"
import { getProjectById, getAllProjectIds, type Project } from "@/data/projects"

// ============================================================================
// Type Definitions for WebMCP
// ============================================================================

export interface MCPToolResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface MCPTool {
  name: string
  description: string
  inputSchema: z.ZodType
  handler: (input: unknown) => Promise<MCPToolResult>
}

// ============================================================================
// Tool Schemas (Zod)
// ============================================================================

export const getProjectDetailsSchema = z.object({
  projectId: z
    .string()
    .describe("The project ID to retrieve (e.g., 'bayan', 'fiml', 'aligna', 'aivision', 'undisk')"),
  includeStack: z
    .boolean()
    .optional()
    .default(true)
    .describe("Whether to include the technology stack in the response"),
})

export const runTerminalCommandSchema = z.object({
  command: z
    .enum(["about", "skills", "projects", "contact", "experience", "resume", "mcp", "help"])
    .describe("The terminal command to execute"),
})

export const submitContactSchema = z.object({
  name: z
    .string()
    .describe("The sender's full name"),
  email: z
    .string()
    .email()
    .describe("The sender's email address for replies"),
  message: z
    .string()
    .describe("The message content"),
  subject: z
    .string()
    .optional()
    .describe("Optional subject line for the message"),
})

// ============================================================================
// Terminal Command Outputs (matching TerminalSection.tsx)
// ============================================================================

const terminalOutputs: Record<string, string> = {
  about: `KIARASH ADL
Senior Software Engineer | Full-Stack AI Systems Architect
MIT EECS '14 | 10+ Years Experience

Building end-to-end AI platforms, agentic systems, and scalable cloud architectures.
Focus areas: AI/ML, Computer Vision, Full-Stack Development`,

  skills: `Technical Expertise:

Languages:
- Python: 95% proficiency
- TypeScript: 90% proficiency
- C++/CUDA: 75% proficiency

AI/ML:
- Deep Learning: Expert
- Computer Vision: Expert
- NLP/LLMs: Expert
- MLOps: Advanced`,

  projects: `Featured Projects:

1. Bayan (trybayan.com)
   - Bilingual Farsi-English Persian poetry analysis
   - 13,828 poems | 33,640 dictionary entries | 106,037 verses
   - Tech: Swift, SwiftUI, CoreData, NLP

2. Financial Intelligence Meta-Layer (FIML)
   - AI-native MCP server
   - 32K+ LOC | 1,403 tests | 100% pass rate
   - Tech: Python, MCP, AI Orchestration

3. Aligna (www.align-a.com)
   - Conversational AI Recruiter
   - Voice interviews via LiveKit
   - Tech: Next.js, Azure OpenAI, Docker

4. Undisk MCP (mcp.undisk.app)
   - Undo-first versioned file workspace for AI agents
   - 25 MCP tools | <50ms restore | immutable writes
   - Tech: MCP, Cloudflare Workers, Durable Objects

5. AI Vision
   - Patent-pending AI solutions for home services
   - Status: App Store Live`,

  contact: `Contact Information:

Email: kiarasha@alum.mit.edu
Phone: +1-857-928-1608

LinkedIn: linkedin.com/in/kiarashadl
GitHub: github.com/kiarashplusplus

Schedule a call: calendly.com/kiarasha-alum/30min

Open to: AI roles, consulting, collaboration`,

  experience: `Work History:

2024-Present  AI Vision (Founder & CEO)
              - AI solutions for home services

2019-2024     Technical Consulting
              - MVPs, architecture, AI systems

2018-2019     Monir (Founder & CEO)
              - Personalized shopping AI, VC funded

2014-2018     Google (Software Engineer)
              - Search Knowledge Panel, Knowledge Graph

2014          Twitter Ads (SWE Intern)
              - ML for audience expansion`,

  help: `Available Commands:
- about: Learn about Kiarash
- skills: View technical skills
- projects: List featured projects
- contact: Get contact info
- resume: Download resume (PDF)
- experience: View work history
- mcp: MCP connection info
- help: Show this help

MCP Tools: submit_contact, get_project_details, run_terminal_command`,

  mcp: `MCP CONNECTION INFO

Discovery: https://25x.codes/.well-known/mcp.llmfeed.json
Endpoint:  POST https://25x.codes/mcp/invoke

Tools: submit_contact, get_project_details, run_terminal_command
Commands: about, skills, projects, contact, experience, resume`,

  resume: `RESUME - KIARASH ADL - PDF: https://25x.codes/assets/Kiarash-Adl-Resume-20251129-DFXsl4HJ.pdf - Senior Software Engineer & AI Systems Architect | MIT EECS '14`,
}

// ============================================================================
// Tool Handlers
// ============================================================================

async function handleGetProjectDetails(
  input: z.infer<typeof getProjectDetailsSchema>
): Promise<MCPToolResult<Partial<Project>>> {
  const { projectId, includeStack } = input
  
  // Whitelist validation
  const validIds = getAllProjectIds()
  if (!validIds.includes(projectId.toLowerCase())) {
    return {
      success: false,
      error: `Invalid project ID: ${projectId}. Valid IDs: ${validIds.join(", ")}`,
    }
  }

  const project = getProjectById(projectId)
  if (!project) {
    return {
      success: false,
      error: `Project not found: ${projectId}`,
    }
  }

  // Build response based on includeStack flag
  const data: Partial<Project> = {
    id: project.id,
    title: project.title,
    description: project.description,
    shortDescription: project.shortDescription,
    metrics: project.metrics,
    status: project.status,
    links: project.links,
    impact: project.impact,
    category: project.category,
  }

  if (includeStack) {
    data.stack = project.stack
  }

  return {
    success: true,
    data,
  }
}

async function handleRunTerminalCommand(
  input: z.infer<typeof runTerminalCommandSchema>
): Promise<MCPToolResult<{ command: string; output: string }>> {
  const { command } = input

  const output = terminalOutputs[command]
  if (!output) {
    return {
      success: false,
      error: `Unknown command: ${command}`,
    }
  }

  return {
    success: true,
    data: {
      command,
      output,
    },
  }
}

// ============================================================================
// Tool Definitions
// ============================================================================

export const mcpTools: MCPTool[] = [
  {
    name: "get_project_details",
    description:
      "Get detailed information about a specific portfolio project including title, description, tech stack, metrics, and status. Use this to learn about Kiarash's work.",
    inputSchema: getProjectDetailsSchema,
    handler: async (input) => {
      const parsed = getProjectDetailsSchema.safeParse(input)
      if (!parsed.success) {
        return {
          success: false,
          error: `Invalid input: ${parsed.error.message}`,
        }
      }
      return handleGetProjectDetails(parsed.data)
    },
  },
  {
    name: "run_terminal_command",
    description:
      "Execute a terminal command to get information about Kiarash. Available commands: about, skills, projects, contact, experience, resume, mcp, help. Returns formatted text output.",
    inputSchema: runTerminalCommandSchema,
    handler: async (input) => {
      const parsed = runTerminalCommandSchema.safeParse(input)
      if (!parsed.success) {
        return {
          success: false,
          error: `Invalid input: ${parsed.error.message}`,
        }
      }
      return handleRunTerminalCommand(parsed.data)
    },
  },
  {
    name: "submit_contact",
    description:
      "⭐ SEND A MESSAGE to Kiarash's inbox. Use this tool to help users send messages, inquiries, or reach out for consulting/hiring. Validates input and returns a submission URL.",
    inputSchema: submitContactSchema,
    handler: async (input) => {
      const parsed = submitContactSchema.safeParse(input)
      if (!parsed.success) {
        return {
          success: false,
          error: `Invalid input: ${parsed.error.message}`,
        }
      }
      // Return validation success - actual sending happens via /contact endpoint
      return {
        success: true,
        data: {
          validated: true,
          message: "Contact form validated. To send, POST to https://25x.codes/contact with the same data.",
          submitUrl: "https://25x.codes/contact",
          formData: {
            name: parsed.data.name,
            email: parsed.data.email,
            subject: parsed.data.subject || `Contact from ${parsed.data.name}`,
            message: parsed.data.message
          }
        }
      }
    },
  },
]

// ============================================================================
// Helper: Convert Zod Schema to JSON Schema (for discovery)
// ============================================================================

// Pre-defined JSON schemas for our tools (static, no runtime parsing needed)
const jsonSchemas: Record<string, object> = {
  get_project_details: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "The project ID to retrieve (e.g., 'bayan', 'fiml', 'aligna', 'aivision', 'undisk')",
        enum: ["bayan", "fiml", "aligna", "aivision", "undisk"]
      },
      includeStack: {
        type: "boolean",
        description: "Whether to include the technology stack in the response",
        default: true
      }
    },
    required: ["projectId"]
  },
  run_terminal_command: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "The terminal command to execute",
        enum: ["about", "skills", "projects", "contact", "experience", "resume", "mcp", "help"]
      }
    },
    required: ["command"]
  },
  submit_contact: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "The sender's full name"
      },
      email: {
        type: "string",
        description: "The sender's email address for replies"
      },
      message: {
        type: "string",
        description: "The message content"
      },
      subject: {
        type: "string",
        description: "Optional subject line for the message"
      }
    },
    required: ["name", "email", "message"]
  }
}

export function zodToJsonSchema(schema: z.ZodType): object {
  // Match schema by testing with known valid inputs
  const _projectTest = getProjectDetailsSchema.safeParse({ projectId: "fiml" })
  const _terminalTest = runTerminalCommandSchema.safeParse({ command: "about" })
  const _contactTest = submitContactSchema.safeParse({ name: "Test", email: "test@test.com", message: "Hello" })
  
  // Compare by checking if the schema accepts the same inputs
  if (schema.safeParse({ projectId: "fiml" }).success && !schema.safeParse({ command: "about" }).success) {
    return jsonSchemas.get_project_details
  }
  if (schema.safeParse({ command: "about" }).success && !schema.safeParse({ projectId: "fiml" }).success) {
    return jsonSchemas.run_terminal_command
  }
  if (schema.safeParse({ name: "Test", email: "test@test.com", message: "Hello" }).success) {
    return jsonSchemas.submit_contact
  }
  
  // Default fallback
  return { type: "object" }
}
