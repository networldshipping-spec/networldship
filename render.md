Render Deployment checklist and environment variables

Quick steps to configure Render for NET WORLD SHIPPING

1) Service root
- Set the Root Directory to the repository root (leave blank) or the folder containing `package.json`.

2) Build & Start commands
- Build command: `npm install`
- Start command: `npm start` (app uses `node server.js`)

3) Environment variables (add under your Web Service → Environment)
- `DATABASE_URL` = Use the INTERNAL Database URL when the web service and DB are in the same Render region.
  Example (internal):
  postgresql://<DB_USER>:<DB_PASS>@dpg-d6latiua2pns73bu1bk0-a/networldship

- `EXTERNAL_DATABASE_URL` = Optional. Use this for local development or external access:
  postgresql://<DB_USER>:<DB_PASS>@dpg-d6latiua2pns73bu1bk0-a.oregon-postgres.render.com/networldship

- `NODE_ENV` = production
- `PORT` = 3000 (Render will provide a port via `$PORT` automatically; leaving this is optional)
- `BASE_URL` = https://your-render-url.onrender.com (update after deployment)
- `EMAIL_SERVICE`, `EMAIL_USER`, `EMAIL_PASS` = (set secure values)
- `IMAP_HOST`, `IMAP_PORT` = imap.gmail.com, 993
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `SESSION_SECRET` = (set secure values)

4) Use internal vs external host rules
- Internal host (short name without `.render.com`) is reachable only from resources inside Render in the same region. It's slightly faster and recommended for web services on Render.
- External host (fully-qualified) is for local or outside-Render access.

5) Security & secrets
- Remove `.env` from the repo and keep secrets only in Render's Environment settings.
- Rotate any credentials that were committed to the repository (passwords, API keys).

6) Testing locally
- For local testing, set `EXTERNAL_DATABASE_URL` in your local `.env` (or set `DATABASE_URL` to the external URL).

7) Troubleshooting
- If you see `getaddrinfo ENOTFOUND`, the host is incomplete; ensure you use the correct full hostname for external connections or the internal short name on Render.

8) Redeploy
- After updating environment variables, trigger a redeploy in the Render dashboard and check logs for successful DB connections.

--
Generated guidance: update these values with real credentials before deploying; keep secrets out of git.
