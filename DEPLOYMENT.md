# Deployment Guide - Cloudflare Pages

This portfolio site is ready to deploy on Cloudflare Pages with a serverless contact form.

## Prerequisites

1. A Cloudflare account (free tier works fine)
2. A Resend account for sending emails (free tier: 3,000 emails/month)

## Step 1: Get Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Go to [API Keys](https://resend.com/api-keys)
3. Create a new API key
4. Copy the key (it starts with `re_`)

## Step 2: Deploy to Cloudflare Pages

### Option A: Connect GitHub Repository (Recommended)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages** → **Create application** → **Pages**
3. Click **Connect to Git**
4. Select your GitHub repository
5. Configure build settings:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
6. Click **Save and Deploy**

### Option B: Direct Upload

1. Build the project locally:
   ```bash
   npm run build
   ```
2. Go to Cloudflare Dashboard → **Workers & Pages** → **Create application**
3. Choose **Upload assets**
4. Upload the `dist` folder

## Step 3: Configure Environment Variables

1. In your Cloudflare Pages project, go to **Settings** → **Environment variables**
2. Add the following variables for **Production**:
   - `RESEND_API_KEY`: Your Resend API key (from Step 1)
   - `CONTACT_EMAIL`: `kiarasha@alum.mit.edu`
   - `CONTACT_FROM` (recommended): a sender on a domain verified in Resend, e.g. `25x.codes <contact@25x.codes>`.
     Without it the shared `onboarding@resend.dev` sender is used, which Resend only delivers to the Resend account owner's address.
3. Click **Save**

`RESEND_API_KEY` is used by both the website form (`POST /contact`) and the MCP tool
`submit_contact` (`POST /mcp`, same as `/mcp/invoke`). If it is missing, both return an explicit
"not sent" error (HTTP 503 / `isError: true`); they never report a fake success.

## Step 4: Redeploy

After adding environment variables, trigger a new deployment:
- If using Git: Push a new commit or use "Retry deployment"
- If using direct upload: Re-upload the dist folder

## Local Development with Contact Form

1. Create a `.dev.vars` file in the project root:
   ```bash
   cp .dev.vars.example .dev.vars
   ```

2. Edit `.dev.vars` and add your Resend API key:
   ```
   RESEND_API_KEY=re_your_actual_api_key
   CONTACT_EMAIL=kiarasha@alum.mit.edu
   ```

3. Install Wrangler CLI (Cloudflare's dev tool):
   ```bash
   npm install -g wrangler
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

The contact form will now work locally and send real emails via Resend.

## Verifying the Contact Form

1. Visit your deployed site
2. Navigate to the contact section
3. Fill out the form and submit
4. Check your email at `kiarasha@alum.mit.edu`
5. You should receive the contact form submission

## Custom Domain (Optional)

1. In Cloudflare Pages, go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain (e.g., `kiarashadl.com`)
4. Follow DNS configuration instructions
5. SSL/TLS is automatic with Cloudflare

## Using Your Own Domain with Resend

For production, you should verify your own domain in Resend:

1. Go to [Resend Domains](https://resend.com/domains)
2. Click **Add Domain**
3. Enter your domain (e.g., `kiarashadl.com`)
4. Add the DNS records shown (MX, TXT, CNAME)
5. Wait for verification (~24 hours)
6. Set the `CONTACT_FROM` environment variable, e.g. `25x.codes <contact@25x.codes>`

## Monitoring

- **Contact form submissions**: Check your email
- **Error logs**: Cloudflare Dashboard → Your Pages project → **Functions** → **Logs**
- **Resend dashboard**: Track email delivery at [resend.com/emails](https://resend.com/emails)

## Troubleshooting

### Contact form returns 500 error
- Check that `RESEND_API_KEY` is set in Cloudflare environment variables
- Verify the API key is valid in Resend dashboard
- Check function logs in Cloudflare

### Emails not arriving
- Check Resend dashboard for delivery status
- Verify email isn't in spam folder
- Ensure `CONTACT_EMAIL` is set correctly

### Build fails
- Ensure Node.js version is compatible (16+)
- Run `npm install` locally and check for errors
- Check build logs in Cloudflare

## Cost

- **Cloudflare Pages**: Free (includes 500 builds/month, unlimited requests)
- **Resend**: Free tier includes 3,000 emails/month
- **Total**: $0/month for typical portfolio traffic

## Support

If you encounter issues:
- Cloudflare Discord: [discord.gg/cloudflaredev](https://discord.gg/cloudflaredev)
- Resend Support: [resend.com/support](https://resend.com/support)
