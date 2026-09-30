# Kiarash Adl Portfolio

AI-enabled portfolio with MCP (Model Context Protocol) integration, allowing AI agents to query projects, skills, and experience programmatically.

## 🚀 Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Framer Motion
- **Backend:** Cloudflare Pages Functions
- **MCP:** Streamable HTTP MCP endpoint (`/mcp`), LLMFeed manifest, `llms.txt`
- **Email:** Cloudflare Email Routing via the `contact-mailer` Worker (see [DEPLOYMENT.md](DEPLOYMENT.md))

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
npm run build
git commit -am "Update resume PDF"
git push
npx wrangler pages deploy dist --project-name 25x-codes --branch main   # Pages has no Git integration; pushing alone does not deploy
```

> Do **not** import the PDF from `src/` — that path goes through Vite's asset pipeline and gets a content hash like `Kiarash-Adl-Resume-20251129-DFXsl4HJ.pdf`, which changes on every content update and breaks any link that points at it.

## 🤖 MCP Integration / contacting Kiarash (for AI agents)

Start at **https://25x.codes/llms.txt**. It is the plain-text guide for agents, including how to send Kiarash a message.

### Endpoints

- **MCP (Streamable HTTP, stateless JSON-RPC 2.0):** `POST /mcp` (same handler as the older `/mcp/invoke`)
- **Contact (plain REST):** `POST /contact`
- **Discovery:** `/.well-known/mcp.llmfeed.json`, `/llms.txt`
- **Health:** `/mcp/health`

### Tools

| Tool | Description |
|------|-------------|
| `submit_contact` | Email Kiarash (Cloudflare Email Routing). Returns `status: "sent"` + `message_id`, or `isError: true` with the reason |
| `run_terminal_command` | about, skills, projects, contact, experience, resume, mcp, help |
| `get_project_details` | bayan, fiml, aligna, aivision, undisk, interviewreadynot |

### Send a message

```bash
curl -sS https://25x.codes/contact -H 'Content-Type: application/json' \
  -d '{"name":"Your Name","email":"you@example.com","subject":"Hello","message":"Your message"}'

# or via MCP
curl -sS https://25x.codes/mcp -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"submit_contact","arguments":{"name":"Your Name","email":"you@example.com","message":"Your message"}}}'
```

Limits: name ≤100, subject ≤150, message ≤5000 chars; 5 messages / 10 min per client; optional `idempotency_key`. Fallback: mailto:kiarasha@alum.mit.edu

### Tests

```bash
npm test          # vitest: MCP protocol, contact delivery (mocked mailer), mailer MIME
npm run typecheck # functions/, server/, workers/, tests/
```

Tool schemas with input/output definitions
- Agent guidance for interaction patterns
- Ed25519 signed blocks for verification

## 📄 License

MIT
