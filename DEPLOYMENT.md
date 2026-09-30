# Deployment Guide - Cloudflare Pages + Email Routing

The site is a Cloudflare Pages project (static Vite build + Pages Functions).
Email from the contact form, the MCP `submit_contact` tool and the guestbook is
sent with **Cloudflare Email Routing** (`send_email` binding). Pages Functions
cannot hold a `send_email` binding, so a tiny Worker, `adl-resume-contact-mailer`
(`workers/contact-mailer/`), does the sending and the Pages project reaches it
through a **service binding** named `CONTACT_MAILER`.

```
agent / browser ──POST /contact or /mcp──▶ Pages Function ──service binding CONTACT_MAILER──▶
  adl-resume-contact-mailer Worker ──send_email (Email Routing)──▶ kiarasha@alum.mit.edu
```

## 1. Email Routing (dashboard, zone 25x.codes, one time)

1. Cloudflare dashboard → **25x.codes** → **Email** → **Email Routing**. Make sure it is enabled
   (MX records `route1/2/3.mx.cloudflare.net`, SPF and DKIM are added automatically).
2. **Destination addresses** → **Add destination address** → `kiarasha@alum.mit.edu`.
   Cloudflare emails a verification link to that inbox; click it. The status must say **Verified**.
   `send_email` can only deliver to verified destinations.
3. The sender, `contact@25x.codes`, needs no mailbox; it only has to be on the 25x.codes zone.

## 2. Deploy the mailer Worker

```bash
npx wrangler deploy -c workers/contact-mailer/wrangler.jsonc
```

It has no public URL (`workers_dev: false`, no routes). Recipient and sender are
set in `workers/contact-mailer/wrangler.jsonc` (`destination_address`,
`CONTACT_TO`, `CONTACT_FROM`).

## 3. Bind it to the Pages project

Dashboard → **Workers & Pages** → the Pages project for 25x.codes → **Settings** →
**Bindings** → **Add** → **Service binding**:

- Variable name: `CONTACT_MAILER`
- Service: `adl-resume-contact-mailer`

Add it for **Production** (and Preview if you want previews to send), then redeploy.
(This repo deliberately has no Pages `wrangler.toml`: adding one makes it the source
of truth and locks dashboard-managed settings. The equivalent, if you ever adopt one:
`[[services]]` / `binding = "CONTACT_MAILER"` / `service = "adl-resume-contact-mailer"`.)

The old `RESEND_API_KEY` / `CONTACT_EMAIL` / `CONTACT_FROM` Pages variables are no
longer read and can be deleted.

## 4. Build and deploy the site

Pushing to `main` triggers the Cloudflare Pages Git build (`npm run build`, output `dist`).
Manual alternative: `npm run build && npx wrangler pages deploy dist`.

## Verify

- `curl -s https://25x.codes/llms.txt` returns text (not the homepage HTML).
- `curl -s -X POST https://25x.codes/mcp -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`
- One real `POST /contact` (see `public/llms.txt`) should return `"status":"sent"` and arrive in the inbox.
  If the binding is missing you get HTTP 503 `not_configured`; if the destination is not verified,
  HTTP 502 `delivery_failed` with Cloudflare's error code. Nothing ever reports a fake success.

## Local development

```bash
npm run build
# terminal 1: mailer (local send_email is simulated; no real email leaves the machine)
npx wrangler dev -c workers/contact-mailer/wrangler.jsonc --port 8790
# terminal 2: site, bound to the local mailer
npx wrangler pages dev dist --service CONTACT_MAILER=adl-resume-contact-mailer
```

Or set `CONTACT_DRY_RUN=1` in `.dev.vars` to validate without sending.

## Monitoring

- Pages Functions logs: Pages project → **Functions** → **Logs**
- Mailer logs: Workers & Pages → `adl-resume-contact-mailer` → **Logs** (observability enabled)
- Email Routing → **Activity log** shows each message sent to the destination.

## Cost

Cloudflare Pages and Email Routing to your own verified destination are free.
