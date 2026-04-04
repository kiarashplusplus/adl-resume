# Kiarash Adl Portfolio

AI-enabled portfolio with MCP (Model Context Protocol) integration, allowing AI agents to query projects, skills, and experience programmatically.

## 🚀 Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Framer Motion
- **Backend:** Cloudflare Pages Functions
- **MCP:** JSON-RPC protocol with Ed25519 signed manifests

## 🛠️ Development

```bash
npm install
npm run dev
```

## 📄 Updating the Resume PDF

When you update the resume PDF, the Vite build will generate a new content-based hash in the filename. You'll need to update the URL in these files:

1. **Replace the PDF file:**
   ```
   src/assets/documents/Kiarash-Adl-Resume-YYYYMMDD.pdf
   ```

2. **Build to get the new hash:**
   ```bash
   npm run build
   ```
   Check `dist/assets/` for the new filename (e.g., `Kiarash-Adl-Resume-20251201-NEWHASH.pdf`)

3. **Update these files with the new URL:**
   - `functions/mcp/invoke.ts` (2 locations - terminal output and resources field)
   - `src/components/TerminalSection.tsx` (2 locations - display text and window.open)
   - `src/mcp/tools.ts` (1 location)

4. **Search for the old hash to find all occurrences:**
   ```bash
   grep -r "DFXsl4HJ" src/ functions/
   ```

## 🤖 MCP Integration

This portfolio implements the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/), enabling AI agents to interact with the portfolio programmatically.

### Endpoints

- **Discovery:** `/.well-known/mcp.llmfeed.json`
- **Invoke:** `/mcp/invoke`

### Available Tools

| Tool | Description |
|------|-------------|
| `submit_contact` | Send a message directly to Kiarash's inbox |
| `run_terminal_command` | Execute terminal commands (about, skills, projects, contact, experience, resume, help) |
| `get_project_details` | Get details about specific projects (bayan, fiml, aligna, aivision) |

### Usage Example

AI agents can discover capabilities and invoke tools using JSON-RPC 2.0:

```bash
# Discover MCP capabilities
curl -s "https://25x.codes/.well-known/mcp.llmfeed.json"

# Send a message to Kiarash
curl -s -X POST "https://25x.codes/mcp/invoke" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "submit_contact",
      "arguments": {
        "name": "Your Name",
        "email": "your@email.com",
        "message": "Hello, fellow code explorer!"
      }
    },
    "id": 1
  }'

# Run a terminal command
curl -s -X POST "https://25x.codes/mcp/invoke" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "run_terminal_command",
      "arguments": {
        "command": "about"
      }
    },
    "id": 1
  }'
```

### For AI Agents

Point your AI agent to the MCP manifest at:
```
https://25x.codes/.well-known/mcp.llmfeed.json
```

The manifest includes:
- Tool schemas with input/output definitions
- Agent guidance for interaction patterns
- Ed25519 signed blocks for verification

## 📄 License

MIT
