/**
 * Cloudflare Pages Function for signing MCP discovery file
 * 
 * This function serves the MCP manifest and signs it with Ed25519 if
 * the MCP_PRIVATE_KEY environment variable is configured.
 * 
 * Path: /.well-known/mcp.llmfeed.json
 */

interface Env {
  MCP_PRIVATE_KEY?: string; // Base64-encoded Ed25519 private key
}

// The static MCP manifest following LLMFeed spec format
// https://github.com/wellknownmcp/llmfeed-spec
const mcpManifest = {
  "feed_type": "mcp",
  "metadata": {
    "title": "Kiarash Adl Portfolio",
    "origin": "https://25x.codes",
    "description": "AI-enabled portfolio of Kiarash Adl, AI Systems Architect and Full-Stack Engineer. Query projects, skills, and contact information programmatically.",
    "lang": "en",
    "version": "2.0.0",
    "last_updated": "2026-04-04T00:00:00Z",
    "topics": ["ai", "machine-learning", "full-stack", "portfolio", "mit", "mcp"],
    "contact": {
      "email": "kiarasha@alum.mit.edu",
      "github": "https://github.com/kiarashplusplus"
    }
  },
  "agent_guidance": {
    "on_load": "This is Kiarash Adl's AI-enabled portfolio. You can query projects, skills, and execute terminal-style commands to learn about his work. Use the 'submit_contact' tool to send messages directly to Kiarash's inbox.",
    "interaction_tone": "professional",
    "fallback": "If a tool fails, suggest the user visit https://25x.codes directly.",
    "preferred_entrypoints": [
      "https://25x.codes/mcp/invoke"
    ],
    "invocation_pattern": {
      "note": "Use JSON-RPC 2.0 with method 'tools/call'. Tool name goes in params.name, arguments in params.arguments.",
      "example": {
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {
          "name": "submit_contact",
          "arguments": {
            "name": "Your Name",
            "email": "your@email.com",
            "message": "Hello!"
          }
        },
        "id": 1
      },
      "available_methods": ["initialize", "tools/list", "tools/call", "ping"]
    },
    "primary_actions": [
      {
        "action": "send_message",
        "tool": "submit_contact",
        "description": "Send a message to Kiarash - requires name, email, and message"
      },
      {
        "action": "get_info",
        "tool": "run_terminal_command",
        "description": "Run commands like about, skills, projects, contact, experience, resume, help"
      },
      {
        "action": "project_details",
        "tool": "get_project_details",
        "description": "Get details about specific projects: bayan, fiml, aligna, aivision"
      }
    ]
  },
  "capabilities": [
    {
      "name": "get_project_details",
      "type": "endpoint",
      "method": "POST",
      "url": "https://25x.codes/mcp/invoke",
      "protocol": "json-rpc",
      "description": "Get detailed information about a specific portfolio project including title, description, tech stack, metrics, and status.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "projectId": {
            "type": "string",
            "description": "The project ID to retrieve (e.g., 'bayan', 'fiml', 'aligna', 'aivision')",
            "enum": ["bayan", "fiml", "aligna", "aivision"]
          },
          "includeStack": {
            "type": "boolean",
            "description": "Whether to include the technology stack in the response",
            "default": true
          }
        },
        "required": ["projectId"]
      }
    },
    {
      "name": "run_terminal_command",
      "type": "endpoint",
      "method": "POST",
      "url": "https://25x.codes/mcp/invoke",
      "protocol": "json-rpc",
      "description": "Execute a terminal command to get information about Kiarash. Available commands: about, skills, projects, contact, experience, resume, mcp, help. The 'resume' command returns a resources array with the PDF download URL.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "command": {
            "type": "string",
            "description": "The terminal command to execute",
            "enum": ["about", "skills", "projects", "contact", "experience", "resume", "mcp", "help"]
          }
        },
        "required": ["command"]
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "command": { "type": "string" },
          "output": { "type": "string", "description": "Human-readable text output" },
          "resources": {
            "type": "array",
            "description": "Rich media resources (e.g., PDF URLs). Present for 'resume' command.",
            "items": {
              "type": "object",
              "properties": {
                "type": { "type": "string", "enum": ["document", "image", "link"] },
                "url": { "type": "string", "format": "uri" },
                "title": { "type": "string" },
                "mime_type": { "type": "string" }
              }
            }
          }
        }
      }
    },
    {
      "name": "submit_contact",
      "type": "endpoint",
      "method": "POST",
      "url": "https://25x.codes/mcp/invoke",
      "protocol": "json-rpc",
      "description": "Submit a contact form message to Kiarash. Validates input and returns a submission URL. Use this to help users send messages or inquiries.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "The sender's full name"
          },
          "email": {
            "type": "string",
            "description": "The sender's email address for replies"
          },
          "message": {
            "type": "string",
            "description": "The message content"
          },
          "subject": {
            "type": "string",
            "description": "Optional subject line for the message"
          }
        },
        "required": ["name", "email", "message"]
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "success": { "type": "boolean" },
          "validated": { "type": "boolean" },
          "message": { "type": "string" },
          "submitUrl": { "type": "string", "format": "uri" },
          "data": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "email": { "type": "string" },
              "subject": { "type": "string" },
              "message": { "type": "string" }
            }
          }
        }
      }
    }
  ],

  "site_capabilities": {
    "llm_readable": true,
    "agent_invocable": true,
    "feeds_signed": true,
    "mcp_protocol": "json-rpc",
    "rate_limit": "10/min",
    "auth": "none",
    "cors": true
  },
  "data": [
    {
      "type": "intent",
      "purpose": "Professional portfolio showcasing AI and full-stack engineering expertise",
      "recommended_usage": "Use MCP tools to query projects, skills, resume and information about Kiarash Adl programmatically"
    }
  ]
};

/**
 * Recursively sorts all keys in an object for canonical JSON representation.
 * This ensures that the signature protects all nested content, not just top-level keys.
 * 
 * @param obj - The object to sort recursively
 * @returns A new object with all keys sorted at every level
 */
function deepSortObject(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(deepSortObject);
  
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = deepSortObject((obj as Record<string, unknown>)[key]);
  }
  return sorted;
}

async function signManifest(manifest: object, privateKeyBase64: string): Promise<string> {
  try {
    // Decode the private key from base64
    const privateKeyBytes = Uint8Array.from(atob(privateKeyBase64), c => c.charCodeAt(0));
    
    // Determine key format based on length
    // PKCS#8 Ed25519 keys are 48 bytes, raw seeds are 32 bytes
    let cryptoKey: CryptoKey;
    
    if (privateKeyBytes.length === 48) {
      // PKCS#8 format - import directly
      cryptoKey = await crypto.subtle.importKey(
        "pkcs8",
        privateKeyBytes,
        { name: "Ed25519" },
        false,
        ["sign"]
      );
    } else if (privateKeyBytes.length === 32) {
      // Raw 32-byte seed - need to wrap in PKCS#8
      // Ed25519 PKCS#8 prefix: 302e020100300506032b657004220420
      const pkcs8Prefix = new Uint8Array([
        0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06,
        0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20
      ]);
      const pkcs8Key = new Uint8Array(48);
      pkcs8Key.set(pkcs8Prefix);
      pkcs8Key.set(privateKeyBytes, 16);
      
      cryptoKey = await crypto.subtle.importKey(
        "pkcs8",
        pkcs8Key,
        { name: "Ed25519" },
        false,
        ["sign"]
      );
    } else {
      throw new Error(`Invalid key length: ${privateKeyBytes.length} (expected 32 or 48)`);
    }
    
    // Create canonical JSON with deep recursive key sorting
    // This ensures the signature protects all content, not just the empty structure
    const sortedManifest = deepSortObject(manifest);
    const canonicalJson = JSON.stringify(sortedManifest);
    const encoder = new TextEncoder();
    const data = encoder.encode(canonicalJson);
    
    // Sign the data
    const signature = await crypto.subtle.sign("Ed25519", cryptoKey, data);
    
    // Return base64-encoded signature
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  } catch (err) {
    console.error("Signing error:", err);
    throw err;
  }
}

// Cloudflare Pages Function handler
export const onRequest = async (context: { request: Request; env: Env }): Promise<Response> => {
  const { request, env } = context;
  
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }
  
  // Only allow GET requests
  if (request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  
  const responseManifest: Record<string, unknown> = { ...mcpManifest };
  
  // Add trust section with signature if private key is configured
  if (env.MCP_PRIVATE_KEY) {
    try {
      const signature = await signManifest(mcpManifest, env.MCP_PRIVATE_KEY);
      responseManifest.trust = {
        signed_blocks: ["feed_type", "metadata", "agent_guidance", "capabilities", "site_capabilities", "data"],
        algorithm: "Ed25519",
        public_key_hint: "https://25x.codes/.well-known/public.pem",
        trust_level: "self-signed",
        scope: "full"
      };
      responseManifest.signature = {
        value: signature,
        created_at: new Date().toISOString()
      };
    } catch (err) {
      console.error("Failed to sign manifest:", err);
      responseManifest.trust = {
        signed_blocks: [],
        algorithm: "Ed25519",
        trust_level: "unsigned",
        error: "Signing failed - check MCP_PRIVATE_KEY format"
      };
    }
  } else {
    // No signing key configured
    responseManifest.trust = {
      signed_blocks: [],
      algorithm: "Ed25519",
      trust_level: "unsigned",
      note: "No MCP_PRIVATE_KEY configured - running in development mode"
    };
  }
  
  return new Response(JSON.stringify(responseManifest, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Cache-Control": "public, max-age=3600",
      "X-MCP-Version": "1.0",
      "X-MCP-Signed": env.MCP_PRIVATE_KEY ? "true" : "false",
    },
  });
};
