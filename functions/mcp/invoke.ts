/**
 * MCP Tool Invocation Endpoint
 * 
 * This Cloudflare Pages Function handles incoming MCP tool calls from AI agents.
 * POST /mcp/invoke with JSON body: { "tool": "tool_name", "input": { ... } }
 */

interface Env {
  RESEND_API_KEY?: string;
  CONTACT_EMAIL?: string;
}

// Project data (synced from src/data/projects.ts for serverless context)
const projects: Record<string, {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  stack: string[];
  metrics: { label: string; value: string }[];
  status: string;
  links: { website?: string; github?: string; demo?: string };
  impact: string;
  category: string;
}> = {
  fiml: {
    id: "fiml",
    title: "Financial Intelligence Meta-Layer (FIML)",
    description: "AI-native MCP server for financial data aggregation with intelligent multi-provider orchestration and multilingual compliance guardrails. Open source project demonstrating enterprise-grade AI architecture.",
    shortDescription: "AI-native MCP server for financial data aggregation",
    stack: ["Python", "MCP Server", "AI Orchestration", "Expo", "CI/CD"],
    metrics: [
      { label: "Lines of Code", value: "32K+" },
      { label: "Automated Tests", value: "1,403" },
      { label: "Pass Rate", value: "100%" },
      { label: "Status", value: "Phase 2" }
    ],
    status: "development",
    links: {
      website: "https://kiarashplusplus.github.io/FIML/",
      github: "https://github.com/kiarashplusplus/FIML"
    },
    impact: "Reduces financial data integration time by 70%",
    category: "open-source"
  },
  aligna: {
    id: "aligna",
    title: "Aligna",
    description: "Conversational AI recruiter that schedules and conducts voice interviews via LiveKit, transcribes with Azure OpenAI, and performs automated candidate-job matching with full observability.",
    shortDescription: "Conversational AI recruiter with voice interviews",
    stack: ["Next.js", "LiveKit", "Azure OpenAI", "PostgreSQL", "Docker"],
    metrics: [
      { label: "Feature", value: "AI Voice Interviews" },
      { label: "a Production AI", value: "Built" },
      { label: "Matching", value: "2-Way Smart" },
      { label: "Observability", value: "Full" }
    ],
    status: "live",
    links: {
      website: "https://www.align-a.com/about"
    },
    impact: "Helps startups cut hiring time with AI interviews",
    category: "saas"
  },
  bayan: {
    id: "bayan",
    title: "Bayan",
    description: "The only app providing bilingual Farsi-English literary analysis of classical Persian poetry, decoding Sufi symbolism, historical allusions, and archaic vocabulary. Fully offline with verse text sourced from a verified canonical corpus rather than AI-generated.",
    shortDescription: "Bilingual Farsi-English classical Persian poetry analysis",
    stack: ["Swift", "SwiftUI", "CoreData", "NLP", "iOS"],
    metrics: [
      { label: "Poems", value: "13,828" },
      { label: "Dictionary Entries", value: "33,640" },
      { label: "Searchable Verses", value: "106,037" },
      { label: "Test Functions", value: "128+" }
    ],
    status: "live",
    links: {
      website: "https://trybayan.com"
    },
    impact: "Only bilingual Farsi-English Persian poetry analysis app with verified canonical corpus",
    category: "ai"
  },
  aivision: {
    id: "aivision",
    title: "AI Vision",
    description: "Patent-pending AI and computer vision solutions for home services industry. Founder and CEO. Mobile app live on App Store.",
    shortDescription: "AI solutions for home services",
    stack: ["Computer Vision", "iOS", "Machine Learning", "Mobile"],
    metrics: [
      { label: "Status", value: "App Store Live" },
      { label: "Progress", value: "80%" }
    ],
    status: "live",
    links: {},
    impact: "Patent-pending AI technology for home services",
    category: "startup"
  }
};

// Terminal command outputs
const terminalCommands: Record<string, string> = {
  about: `
KIARASH ADL
Senior Software Engineer & AI Systems Architect

MIT EECS '14 | 10+ Years Experience

Building end-to-end AI platforms, agentic systems,
and scalable cloud architectures.

Specializing in:
  • AI/ML Systems & Computer Vision
  • Full-Stack Development (React, Python, Node)
  • Cloud Infrastructure (AWS, Docker, Kubernetes)
  • Technical Leadership & Startup Experience`,
  
  skills: `  
TECHNICAL SKILLS

Languages
  Python              95%
  React/React Native  90%
  TypeScript          90%
  C++/CUDA            75%

AI & Machine Learning
  Deep Learning       Expert
  Computer Vision     Expert
  NLP/LLMs            Expert
  MLOps               Advanced

Backend
  FastAPI             92%
  Node.js             88%
  PostgreSQL          65%

Cloud & DevOps
  AWS                 90%
  Docker              88%
  CI/CD               65%`,

  projects: `
FEATURED PROJECTS

1. Bayan (trybayan.com)
   Status: Live
   Stack: Swift, SwiftUI, CoreData, NLP, iOS
   Bilingual Farsi-English classical Persian poetry analysis
   13,828 poems | 33,640 dictionary entries | 106,037 verses

2. FIML - Financial Intelligence Meta-Layer
   Status: Development
   Stack: Python, MCP Server, AI Orchestration
   AI-native MCP server for financial data aggregation
   32K+ LOC | 1,403 tests | 100% pass rate

3. Aligna (www.align-a.com/about)
   Status: Live
   Stack: Next.js, LiveKit, Azure OpenAI
   Conversational AI recruiter with voice interviews
   Helps startups cut hiring time

4. AI Vision
   Status: Live
   Stack: Computer Vision, iOS, ML
   Patent-pending AI solutions for home services
   Mobile app live on App Store

Use 'get_project_details' tool for more information.`,

  contact: `
CONTACT INFORMATION

Email:    kiarasha@alum.mit.edu
GitHub:   github.com/kiarashplusplus
LinkedIn: linkedin.com/in/kiarashadl
Phone:    +1-857-928-1608

Open to: Consulting, Advisory, Full-time opportunities`,

  experience: `
EXPERIENCE

2024-Present  AI Vision (Founder & CEO)
              Patent-pending AI solutions for home services
              Led development from prototype to App Store launch

2019-2024     Technical Consulting
              Built production-ready MVPs for multiple startups
              Advised on AI/ML integration and tech roadmaps

2018-2019     Monir (Founder & CEO)
              VC-funded AI personalization startup
              Built serverless Python microservices platform

2014-2018     Google (Software Engineer)
              Search Knowledge Panel & Knowledge Graph
              Features serving billions of users worldwide

2014          Twitter Ads (SWE Intern)
              ML algorithm for audience expansion
              Production system in Hadoop/Scalding

2012-2014     MIT CSAIL (Research Assistant)
              55x GPU speedup in speech recognition (ICASSP 2012)
              Worked under Sir Tim Berners-Lee

EDUCATION

MIT - BS Electrical Engineering & Computer Science (2014)`,

  help: `COMMANDS: about, skills, projects, contact, resume, experience, mcp, help

MCP TOOLS: submit_contact, get_project_details, run_terminal_command`,

  mcp: `MCP CONNECTION INFO

Discovery: https://25x.codes/.well-known/mcp.llmfeed.json
Endpoint:  POST https://25x.codes/mcp/invoke

Tools: submit_contact, get_project_details, run_terminal_command
Commands: about, skills, projects, contact, experience, resume`,

  resume: `RESUME - KIARASH ADL - PDF: https://25x.codes/Kiarash-Adl-Resume.pdf - Senior Software Engineer & AI Systems Architect | MIT EECS '14`
};

// Tool handlers
// Format project details as readable text
function formatProjectDetails(data: unknown): string {
  if (!data || typeof data !== 'object') {
    return String(data);
  }
  
  const project = data as Record<string, unknown>;
  const lines: string[] = [];
  
  if (project.title) {
    lines.push(`# ${project.title}`);
    lines.push('');
  }
  
  if (project.description) {
    lines.push(String(project.description));
    lines.push('');
  }
  
  if (project.status) {
    lines.push(`**Status:** ${project.status}`);
  }
  
  if (project.impact) {
    lines.push(`**Impact:** ${project.impact}`);
  }
  
  if (project.category) {
    lines.push(`**Category:** ${project.category}`);
  }
  
  if (project.stack && Array.isArray(project.stack)) {
    lines.push('');
    lines.push(`**Tech Stack:** ${(project.stack as string[]).join(', ')}`);
  }
  
  if (project.metrics && Array.isArray(project.metrics)) {
    lines.push('');
    lines.push('**Metrics:**');
    for (const m of project.metrics as Array<{ label: string; value: string }>) {
      lines.push(`  • ${m.label}: ${m.value}`);
    }
  }
  
  if (project.website || project.github) {
    lines.push('');
    lines.push('**Links:**');
    if (project.website) lines.push(`  • Website: ${project.website}`);
    if (project.github) lines.push(`  • GitHub: ${project.github}`);
    if (project.demo) lines.push(`  • Demo: ${project.demo}`);
  }
  
  return lines.join('\n');
}

function handleGetProjectDetails(input: { projectId: string; includeStack?: boolean }) {
  const project = projects[input.projectId];
  if (!project) {
    return {
      error: `Project not found: ${input.projectId}`,
      availableProjects: Object.keys(projects)
    };
  }

  const result: Record<string, unknown> = {
    id: project.id,
    title: project.title,
    description: project.description,
    shortDescription: project.shortDescription,
    status: project.status,
    metrics: project.metrics,
    impact: project.impact,
    category: project.category
  };

  if (input.includeStack !== false) {
    result.stack = project.stack;
  }

  // Include links if available
  if (project.links.website) result.website = project.links.website;
  if (project.links.github) result.github = project.links.github;
  if (project.links.demo) result.demo = project.links.demo;

  return result;
}

function handleRunTerminalCommand(input: { command: string }) {
  const output = terminalCommands[input.command];
  if (!output) {
    return {
      error: `Unknown command: ${input.command}`,
      availableCommands: Object.keys(terminalCommands)
    };
  }
  
  // Base response
  const response: {
    command: string;
    output: string;
    resources?: { type: string; url: string; title: string; mime_type?: string }[];
  } = {
    command: input.command,
    output: output.trim()
  };
  
  // Add rich media resources for specific commands
  if (input.command === 'resume') {
    response.resources = [
      {
        type: "document",
        url: "https://25x.codes/Kiarash-Adl-Resume.pdf",
        title: "Kiarash Adl Resume (PDF)",
        mime_type: "application/pdf"
      }
    ];
  }
  
  return response;
}

// Handle contact form submission - sends email via Resend API directly
async function handleSubmitContact(
  input: { name: string; email: string; message: string; subject?: string },
  env: Env
): Promise<{
  success: boolean;
  error?: string;
  message?: string;
}> {
  // Validate required fields
  if (!input.name || !input.email || !input.message) {
    return {
      success: false,
      error: "Missing required fields: name, email, and message are required"
    };
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(input.email)) {
    return {
      success: false,
      error: "Invalid email address format"
    };
  }

  // Check if Resend API key is configured
  if (!env.RESEND_API_KEY) {
    // Fallback: return success with manual follow-up instruction
    return {
      success: true,
      message: `Message validated! Please email kiarasha@alum.mit.edu directly with your message. (API key not configured)`
    };
  }
  
  // Send email via Resend API directly (no self-referencing fetch)
  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Portfolio Contact <onboarding@resend.dev>',
        to: env.CONTACT_EMAIL || 'kiarasha@alum.mit.edu',
        reply_to: input.email,
        subject: input.subject || `[MCP] Contact from ${input.name}`,
        text: `Name: ${input.name}\nEmail: ${input.email}\n\nMessage:\n${input.message}`,
      }),
    });

    if (!resendResponse.ok) {
      console.error('Resend API error:', await resendResponse.text());
      return {
        success: false,
        error: 'Failed to send email - please email kiarasha@alum.mit.edu directly'
      };
    }

    return {
      success: true,
      message: `Message sent to Kiarash! He will reply to ${input.email}.`
    };
  } catch (err) {
    console.error('Error sending contact email:', err);
    return {
      success: false,
      error: 'Failed to send email - please email kiarasha@alum.mit.edu directly'
    };
  }
}

// Tool definitions for MCP protocol (keyed by tool name for capabilities.tools)
const toolDefinitions: Record<string, { description: string; inputSchema: object }> = {
  get_project_details: {
    description: "Get detailed information about a specific portfolio project including title, description, tech stack, metrics, and status.",
    inputSchema: {
      type: "object",
      properties: {
        projectId: {
          type: "string",
          description: "The project ID to retrieve",
          enum: ["bayan", "fiml", "aligna", "aivision"]
        },
        includeStack: {
          type: "boolean",
          description: "Whether to include the technology stack",
          default: true
        }
      },
      required: ["projectId"]
    }
  },
  run_terminal_command: {
    description: "Execute a terminal command to get information about Kiarash. Returns formatted text output.",
    inputSchema: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "The terminal command to execute",
          enum: ["about", "skills", "projects", "contact", "experience", "resume", "mcp", "help"]
        }
      },
      required: ["command"]
    }
  },
  submit_contact: {
    description: "Submit a contact form message to Kiarash. Validates the input and returns a URL to complete the submission. AI agents should use this to help users send messages.",
    inputSchema: {
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
};

// Tools as array format (for tools/list response)
const toolsListFormat = Object.entries(toolDefinitions).map(([name, def]) => ({
  name,
  ...def
}));

const toolNames = Object.keys(toolDefinitions);

// Server info for MCP protocol
const serverInfo = {
  name: "kiarash-portfolio-mcp",
  version: "1.0.0",
  description: "AI-enabled portfolio of Kiarash Adl. Query projects, skills, and contact information.",
  protocolVersion: "2024-11-05"
};

const serverCapabilities = {
  tools: toolDefinitions
};

// Cloudflare Pages Function handler
export const onRequest = async (context: { request: Request; env: Env }): Promise<Response> => {
  const { request, env } = context;

  // CORS headers - permissive for AI agents
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "86400",
    "Connection": "keep-alive",
  };

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  // Handle GET requests (for AI agents that can only make GET requests, like Claude's fetch tool)
  if (request.method === "GET") {
    const url = new URL(request.url);
    const tool = url.searchParams.get("tool");
    const command = url.searchParams.get("command");
    const projectId = url.searchParams.get("projectId") || url.searchParams.get("project");
    
    // If no parameters, return API documentation
    if (!tool && !command && !projectId) {
      return new Response(JSON.stringify({
        ...serverInfo,
        message: "Welcome to Kiarash Adl's Portfolio API",
        usage: {
          get_about: "/mcp/invoke?command=about",
          get_skills: "/mcp/invoke?command=skills", 
          get_projects: "/mcp/invoke?command=projects",
          get_contact: "/mcp/invoke?command=contact",
          get_resume: "/mcp/invoke?command=resume",
          get_experience: "/mcp/invoke?command=experience",
          get_project_bayan: "/mcp/invoke?projectId=bayan",
          get_project_fiml: "/mcp/invoke?projectId=fiml",
          get_project_aligna: "/mcp/invoke?projectId=aligna",
          get_project_aivision: "/mcp/invoke?projectId=aivision"
        },
        availableCommands: Object.keys(terminalCommands),
        availableProjects: Object.keys(projects)
      }, null, 2), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    let result: unknown;
    
    // Handle command parameter (shorthand for run_terminal_command)
    if (command) {
      const output = terminalCommands[command];
      if (!output) {
        return new Response(JSON.stringify({
          error: `Unknown command: ${command}`,
          availableCommands: Object.keys(terminalCommands)
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      result = { command, output: output.trim() };
    }
    // Handle projectId parameter (shorthand for get_project_details)
    else if (projectId) {
      const project = projects[projectId.toLowerCase()];
      if (!project) {
        return new Response(JSON.stringify({
          error: `Project not found: ${projectId}`,
          availableProjects: Object.keys(projects)
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      result = handleGetProjectDetails({ projectId: projectId.toLowerCase(), includeStack: true });
    }
    // Handle tool parameter with input as JSON
    else if (tool) {
      const inputParam = url.searchParams.get("input");
      let input: Record<string, unknown> = {};
      
      if (inputParam) {
        try {
          input = JSON.parse(inputParam);
        } catch {
          return new Response(JSON.stringify({
            error: "Invalid JSON in 'input' parameter"
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      }
      
      switch (tool) {
        case "get_project_details":
          const pid = input.projectId as string || url.searchParams.get("projectId");
          if (!pid) {
            return new Response(JSON.stringify({
              error: "Missing projectId parameter",
              availableProjects: Object.keys(projects)
            }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
          result = handleGetProjectDetails({ projectId: pid, includeStack: true });
          break;
        case "run_terminal_command":
          const cmd = input.command as string || url.searchParams.get("command");
          if (!cmd) {
            return new Response(JSON.stringify({
              error: "Missing command parameter",
              availableCommands: Object.keys(terminalCommands)
            }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
          result = handleRunTerminalCommand({ command: cmd });
          break;
        default:
          return new Response(JSON.stringify({
            error: `Unknown tool: ${tool}`,
            availableTools: toolNames
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
      }
    }
    
    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // Only allow POST for the rest
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed. Use GET or POST." }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    const body = await request.json() as { 
      method?: string;
      tool?: string; 
      input?: Record<string, unknown>;
      params?: Record<string, unknown>;
      id?: string | number;
      jsonrpc?: string;
    };
    
    // Handle JSON-RPC style MCP requests
    const method = body.method;
    const isJsonRpc = body.jsonrpc === "2.0";
    
    // Helpers to format response/error following JSON-RPC 2.0 when applicable
    const formatResponse = (result: unknown, id?: string | number) => {
      if (isJsonRpc && id !== undefined) {
        return { jsonrpc: "2.0", id, result };
      }
      return result;
    };

    const formatError = (message: string, id?: string | number, code = -32602, data?: Record<string, unknown>) => {
      if (isJsonRpc && id !== undefined) {
        return {
          jsonrpc: "2.0",
          id,
          error: {
            code,
            message,
            ...(data ? { data } : {})
          }
        };
      }
      return {
        error: message,
        ...(data ? data : {})
      };
    };

    // Handle MCP protocol methods
    if (method) {
      switch (method) {
        case "initialize":
          return new Response(JSON.stringify(formatResponse({
            ...serverInfo,
            capabilities: {
              tools: toolDefinitions
            }
          }, body.id)), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });

        case "tools/list":
          return new Response(JSON.stringify(formatResponse({
            tools: toolsListFormat
          }, body.id)), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });

        case "ping":
        case "echo":
          return new Response(JSON.stringify(formatResponse({
            status: "ok",
            timestamp: new Date().toISOString(),
            server: serverInfo.name
          }, body.id)), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });

        case "tools/call":
        case "call_tool":
          // Extract tool name and arguments from params
          const toolName = body.params?.name as string;
          const toolArgs = body.params?.arguments as Record<string, unknown> || {};
          
          if (!toolName) {
            return new Response(JSON.stringify(formatError(
              "Missing tool name in params",
              body.id,
              -32602,
              { availableTools: toolNames }
            )), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
          
          // Process the tool call
          let toolResult: unknown;
          switch (toolName) {
            case "get_project_details":
              if (!toolArgs.projectId) {
                return new Response(JSON.stringify(formatError(
                  "Missing required field: projectId",
                  body.id,
                  -32602,
                  { availableProjects: Object.keys(projects) }
                )), {
                  status: 400,
                  headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
              }
              toolResult = handleGetProjectDetails(toolArgs as { projectId: string; includeStack?: boolean });
              break;
            case "run_terminal_command":
              if (!toolArgs.command) {
                return new Response(JSON.stringify(formatError(
                  "Missing required field: command",
                  body.id,
                  -32602,
                  { availableCommands: Object.keys(terminalCommands) }
                )), {
                  status: 400,
                  headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
              }
              toolResult = handleRunTerminalCommand(toolArgs as { command: string });
              break;
            case "submit_contact":
              if (!toolArgs.name || !toolArgs.email || !toolArgs.message) {
                return new Response(JSON.stringify(formatError(
                  "Missing required fields: name, email, and message are required",
                  body.id,
                  -32602
                )), {
                  status: 400,
                  headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
              }
              toolResult = await handleSubmitContact(toolArgs as { name: string; email: string; message: string; subject?: string }, env);
              break;
            default:
              return new Response(JSON.stringify(formatError(
                `Unknown tool: ${toolName}`,
                body.id,
                -32601,
                { availableTools: toolNames }
              )), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
              });
          }
          
          // Format content based on tool result type
          let content: Array<{ type: string; text: string }>;
          if (toolResult && typeof toolResult === 'object' && 'output' in toolResult) {
            // Terminal command - return the output text directly
            content = [{ type: "text", text: (toolResult as { output: string }).output }];
          } else if (toolResult && typeof toolResult === 'object' && 'error' in toolResult) {
            // Error response
            content = [{ type: "text", text: `Error: ${(toolResult as { error: string }).error}` }];
          } else if (toolResult && typeof toolResult === 'object' && 'message' in toolResult) {
            // Contact submission or other message response
            content = [{ type: "text", text: (toolResult as { message: string }).message }];
          } else {
            // Project details or other structured data - format nicely
            content = [{ type: "text", text: formatProjectDetails(toolResult) }];
          }
          
          return new Response(JSON.stringify(formatResponse({
            content
          }, body.id)), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });

        default:
          return new Response(JSON.stringify(formatError(
            `Unknown method: ${method}`,
            body.id,
            -32601,
            { availableMethods: ["initialize", "tools/list", "tools/call", "ping", "echo"] }
          )), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
      }
    }

    // Legacy simple tool call format: { "tool": "...", "input": { ... } }
    const { tool, input } = body;

    if (!tool) {
      // No tool and no method - return server info with capabilities overview
      return new Response(JSON.stringify({ 
        ...serverInfo,
        capabilities: serverCapabilities,
        tools: toolsListFormat,
        usage: {
          simple: { tool: "tool_name", input: { "...": "..." } },
          jsonrpc: { jsonrpc: "2.0", method: "tools/call", params: { name: "tool_name", arguments: {} }, id: 1 }
        }
      }, null, 2), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    let result: unknown;

    switch (tool) {
      case "get_project_details":
        if (!input?.projectId) {
          return new Response(JSON.stringify({ 
            error: "Missing required field: projectId",
            availableProjects: Object.keys(projects)
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        result = handleGetProjectDetails(input as { projectId: string; includeStack?: boolean });
        break;

      case "run_terminal_command":
        if (!input?.command) {
          return new Response(JSON.stringify({ 
            error: "Missing required field: command",
            availableCommands: Object.keys(terminalCommands)
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        result = handleRunTerminalCommand(input as { command: string });
        break;

      case "submit_contact":
        if (!input?.name || !input?.email || !input?.message) {
          return new Response(JSON.stringify({ 
            error: "Missing required fields: name, email, and message are required"
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        result = await handleSubmitContact(input as { name: string; email: string; message: string; subject?: string }, env);
        break;

      default:
        return new Response(JSON.stringify({ 
          error: `Unknown tool: ${tool}`,
          availableTools: toolNames
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json",
        "X-MCP-Tool": tool
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ 
      error: "Invalid JSON body",
      ...serverInfo,
      capabilities: serverCapabilities,
      tools: toolsListFormat,
      usage: {
        simple: { tool: "tool_name", input: { "...": "..." } },
        jsonrpc: { jsonrpc: "2.0", method: "initialize", id: 1 }
      }
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
};
