/**
 * Cloudflare Worker for signing MCP discovery file
 * 
 * This is OPTIONAL - only needed if AI agents require signed manifests.
 * Most agents accept unsigned manifests for public read-only tools.
 * 
 * To deploy:
 * 1. Create a Cloudflare Worker
 * 2. Add MCP_PRIVATE_KEY secret (Ed25519 private key, base64 encoded)
 * 3. Deploy this worker
 * 4. Route /.well-known/mcp.llmfeed.json to the worker
 * 
 * Generate keypair with:
 *   openssl genpkey -algorithm ed25519 -out private.pem
 *   openssl pkey -in private.pem -pubout -out public.pem
 */

export interface Env {
  MCP_PRIVATE_KEY?: string; // Base64-encoded Ed25519 private key
}

// The static MCP manifest (without signature)
const mcpManifest = {
  "@context": "https://spec.webmcp.org/v1",
  "type": "mcp",
  "version": "1.0",
  "name": "Kiarash Adl Portfolio",
  "description": "AI-enabled portfolio of Kiarash Adl, AI Systems Architect and Full-Stack Engineer.",
  "homepage": "https://25x.codes",
  "tools": [
    {
      "name": "get_project_details",
      "description": "Get detailed information about a specific portfolio project.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "projectId": {
            "type": "string",
            "enum": ["fiml", "aligna", "aivision", "interviewreadynot"]
          },
          "includeStack": {
            "type": "boolean",
            "default": true
          }
        },
        "required": ["projectId"]
      }
    },
    {
      "name": "run_terminal_command", 
      "description": "Execute a terminal command to get portfolio information.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "command": {
            "type": "string",
            "enum": ["about", "skills", "projects", "contact", "experience", "help"]
          }
        },
        "required": ["command"]
      }
    }
  ],
  "capabilities": {
    "rateLimit": "10/min",
    "auth": "none",
    "cors": true
  },
  "contact": {
    "email": "kiarasha@alum.mit.edu"
  }
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
  // Decode the private key
  const privateKeyBytes = Uint8Array.from(atob(privateKeyBase64), c => c.charCodeAt(0));
  
  // Import the key for signing
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    privateKeyBytes,
    { name: "Ed25519" },
    false,
    ["sign"]
  );
  
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
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Only handle the MCP discovery endpoint
    if (url.pathname !== "/.well-known/mcp.llmfeed.json") {
      return new Response("Not Found", { status: 404 });
    }
    
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
    
    const responseManifest: typeof mcpManifest & { trust?: { signature: string; signatureAlgorithm: string; signedAt?: string; error?: string; note?: string } } = { ...mcpManifest };
    
    // Add trust section
    if (env.MCP_PRIVATE_KEY) {
      // Sign the manifest if private key is configured
      try {
        const signature = await signManifest(mcpManifest, env.MCP_PRIVATE_KEY);
        responseManifest.trust = {
          signature,
          signatureAlgorithm: "ed25519",
          signedAt: new Date().toISOString(),
        };
      } catch (err) {
        console.error("Failed to sign manifest:", err);
        responseManifest.trust = {
          signature: "unsigned",
          signatureAlgorithm: "ed25519",
          error: "Signing failed",
        };
      }
    } else {
      // No signing key configured
      responseManifest.trust = {
        signature: "unsigned",
        signatureAlgorithm: "ed25519",
        note: "Configure MCP_PRIVATE_KEY secret to enable signing",
      };
    }
    
    return new Response(JSON.stringify(responseManifest, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
        "X-MCP-Version": "1.0",
      },
    });
  },
};
