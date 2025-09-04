## RPM Embedded App (Discord Activity)

### Local development

1. Install deps:
   ```bash
   cd embedded-app
   npm ci
   npm run dev
   ```
2. Expose HTTPS (optional for local Discord embed): use a tunnel (e.g., Cloudflare Tunnel) and add the URL in the Discord Dev Portal as App URL and Allowed Origins.

### Deploy to Vercel

Option A: At repo root, the included `vercel.json` config deploys the `embedded-app/` subfolder.

Option B: Create a separate Vercel project with root `embedded-app/`.

Build settings:
- Build Command: `npm ci && npm run build`
- Output Directory: `dist`

Headers: `vercel.json` sets `Content-Security-Policy: frame-ancestors https://discord.com https://*.discord.com https://*.discordapp.com;` so Discord can embed the app.

### Discord Developer Portal

1. Embedded App / Activities: Enable it.
2. App URL: set to your Vercel production URL (e.g., `https://your-app.vercel.app/`).
3. Allowed Origins / URL allowlist: add the same production URL and any preview URLs.
4. App Testers: add your user(s).
5. Install the app to your server.

Start in a text channel via "Start Activity" and select this app.


