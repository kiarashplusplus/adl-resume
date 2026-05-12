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

The resume is served from a **permanent, un-hashed URL** so external links never break:

- Local file: `public/Kiarash-Adl-Resume.pdf`
- Public URL: `https://25x.codes/Kiarash-Adl-Resume.pdf`

To update the resume, simply replace that single file and redeploy. No code changes are needed.

```bash
cp /path/to/new-resume.pdf public/Kiarash-Adl-Resume.pdf
npm run build   # optional, just to sanity-check
git commit -am "Update resume PDF"
git push        # Cloudflare Pages auto-deploys
```

> Do **not** import the PDF from `src/` — that path goes through Vite's asset pipeline and gets a content hash like `Kiarash-Adl-Resume-20251129-DFXsl4HJ.pdf`, which changes on every content update and breaks any link that points at it.

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
