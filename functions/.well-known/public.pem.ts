/**
 * Cloudflare Pages Function to serve the MCP public key
 * 
 * Path: /.well-known/public.pem
 * 
 * This serves the Ed25519 public key used to verify MCP manifest signatures.
 */

// Static Ed25519 public key (generated from mcp-private.pem)
const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAxRIrPaJ2/ZcqJIvdTVwdFAybjvZ2G4YbesOKUsEpX3A=
-----END PUBLIC KEY-----
`;

// Cloudflare Pages Function handler
export const onRequest = async (context: { request: Request }): Promise<Response> => {
  const { request } = context;
  
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
  
  return new Response(PUBLIC_KEY_PEM, {
    headers: {
      "Content-Type": "application/x-pem-file",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      "X-Key-Algorithm": "Ed25519",
    },
  });
};
